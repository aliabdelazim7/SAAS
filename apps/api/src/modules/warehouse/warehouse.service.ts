import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWarehouseDto, UpdateWarehouseDto, AdjustStockDto, TransferStockDto, InventoryAuditDto } from '@crm/dto';
import { Prisma, TenantContext } from '@crm/database';
import { InventoryMovementService } from '../tenant/inventory-movement.service';
import { DocumentEngineService } from '../tenant/document-engine.service';

@Injectable()
export class WarehouseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryMovement: InventoryMovementService,
    private readonly docEngine: DocumentEngineService,
  ) {}

  async create(createDto: CreateWarehouseDto) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context missing.');
    }

    return this.prisma.warehouse.create({
      data: {
        tenantId,
        name: createDto.name,
        address: createDto.address,
      },
    });
  }

  async findAll() {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      return [];
    }

    return this.prisma.warehouse.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new NotFoundException('Warehouse not found.');
    }

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, tenantId },
    });

    if (!warehouse) {
      throw new NotFoundException('Warehouse not found.');
    }

    return warehouse;
  }

  async update(id: string, updateDto: UpdateWarehouseDto) {
    await this.findOne(id);

    return this.prisma.warehouse.update({
      where: { id },
      data: {
        name: updateDto.name,
        address: updateDto.address,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.warehouse.delete({
      where: { id },
    });

    return { success: true };
  }

  // --- Inventory Stock Balance Adjustments ---
  async adjustStock(adjustStockDto: AdjustStockDto) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context missing.');
    }

    // 1. Verify warehouse and variant existence
    await this.findOne(adjustStockDto.warehouseId);

    const variant = await this.prisma.productVariant.findFirst({
      where: { id: adjustStockDto.variantId, tenantId },
    });
    if (!variant) {
      throw new NotFoundException('Product variant not found.');
    }

    const qty = Number(adjustStockDto.quantity);
    if (qty === 0) return;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create a Generic Document for the adjustment
      const docNumber = `ADJ-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const doc = await this.docEngine.createDocument({
        docType: 'INVENTORY_ADJUSTMENT',
        docNumber,
        partyType: 'INTERNAL',
        partyId: adjustStockDto.warehouseId,
        status: 'COMPLETED',
        lines: [{
          variantId: adjustStockDto.variantId,
          quantity: Math.abs(qty),
          unitPrice: Number(variant.costPrice),
          taxRate: 0,
          discountAmount: 0
        }]
      }, tx);

      // 2. Perform the movement via unified InventoryMovementService
      await this.inventoryMovement.executeMovement({
        variantId: adjustStockDto.variantId,
        quantity: Math.abs(qty),
        movementType: 'ADJUSTMENT',
        referenceType: 'INVENTORY_ADJUSTMENT',
        referenceId: doc.id,
        sourceWarehouseId: qty < 0 ? adjustStockDto.warehouseId : undefined,
        destWarehouseId: qty > 0 ? adjustStockDto.warehouseId : undefined,
      }, tx);

      // Get updated balance to return for backward compatibility with integration tests
      return tx.inventoryBalance.findFirst({
        where: { warehouseId: adjustStockDto.warehouseId, variantId: adjustStockDto.variantId }
      });
    });
  }

  // --- Inventory Stock Transfers ---
  async transferStock(transferDto: TransferStockDto) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context missing.');
    }

    if (transferDto.sourceWarehouseId === transferDto.destWarehouseId) {
      throw new Error('Source and destination warehouses must be different.');
    }

    await this.findOne(transferDto.sourceWarehouseId);
    await this.findOne(transferDto.destWarehouseId);

    return this.prisma.$transaction(async (tx) => {
      const docNumber = `TRSF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      // 1. Create generic document
      const doc = await this.docEngine.createDocument({
        docType: 'TRANSFER',
        docNumber,
        partyType: 'INTERNAL',
        partyId: transferDto.destWarehouseId,
        status: 'COMPLETED',
        metaData: {
          sourceWarehouseId: transferDto.sourceWarehouseId,
          destWarehouseId: transferDto.destWarehouseId
        },
        lines: transferDto.items.map(item => ({
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: 0,
          taxRate: 0,
          discountAmount: 0
        }))
      }, tx);

      // 2. Perform movements
      for (const item of transferDto.items) {
        await this.inventoryMovement.executeMovement({
          variantId: item.variantId,
          quantity: item.quantity,
          movementType: 'TRANSFER',
          referenceType: 'TRANSFER',
          referenceId: doc.id,
          sourceWarehouseId: transferDto.sourceWarehouseId,
          destWarehouseId: transferDto.destWarehouseId,
        }, tx);
      }

      return doc;
    });
  }

  // --- Inventory Audits / Physical Counts ---
  async auditInventory(auditDto: InventoryAuditDto) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context missing.');
    }

    await this.findOne(auditDto.warehouseId);

    return this.prisma.$transaction(async (tx) => {
      const docNumber = `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const linesToCreate: any[] = [];

      // Create a temporary reference string for movements before document ID is resolved
      const tempRef = `INVENTORY_AUDIT_PENDING_${docNumber}`;

      for (const item of auditDto.items) {
        // Fetch current stock balance
        const balance = await tx.inventoryBalance.findFirst({
          where: { warehouseId: auditDto.warehouseId, variantId: item.variantId, tenantId }
        });
        const currentQty = balance ? Number(balance.quantity) : 0;
        const variance = item.auditedQuantity - currentQty;

        linesToCreate.push({
          variantId: item.variantId,
          quantity: item.auditedQuantity,
          unitPrice: 0,
          taxRate: 0,
          discountAmount: 0,
          metaData: { currentQty, variance }
        });

        if (variance !== 0) {
          // Trigger adjustment to align stock
          await this.inventoryMovement.executeMovement({
            variantId: item.variantId,
            quantity: Math.abs(variance),
            movementType: 'ADJUSTMENT',
            referenceType: 'INVENTORY_AUDIT',
            referenceId: tempRef,
            sourceWarehouseId: variance < 0 ? auditDto.warehouseId : undefined,
            destWarehouseId: variance > 0 ? auditDto.warehouseId : undefined,
          }, tx);
        }
      }

      // Create generic document logging the audit
      const doc = await this.docEngine.createDocument({
        docType: 'INVENTORY_AUDIT',
        docNumber,
        partyType: 'INTERNAL',
        partyId: auditDto.warehouseId,
        status: 'COMPLETED',
        metaData: { warehouseId: auditDto.warehouseId },
        lines: linesToCreate.map(l => ({
          variantId: l.variantId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: l.taxRate,
          discountAmount: l.discountAmount
        }))
      }, tx);

      // Update movements to point to actual document ID instead of temp reference
      await tx.inventoryMovement.updateMany({
        where: { referenceId: tempRef, tenantId },
        data: { referenceId: doc.id }
      });

      return doc;
    });
  }

  // --- Get movements (Stock Ledger) ---
  async getMovements(warehouseId: string) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) return [];

    await this.findOne(warehouseId);

    return this.prisma.inventoryMovement.findMany({
      where: {
        tenantId,
        OR: [
          { sourceLocationId: warehouseId },
          { destLocationId: warehouseId }
        ]
      },
      include: {
        variant: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getBalances(warehouseId: string) {
    const tenantId = TenantContext.getTenantId();
    await this.findOne(warehouseId);

    return this.prisma.inventoryBalance.findMany({
      where: { warehouseId, tenantId },
      include: {
        variant: {
          include: { product: true },
        },
      },
    });
  }
}
