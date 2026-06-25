import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext, Prisma } from '@crm/database';
import { AccountingService } from '../accounting/accounting.service';

@Injectable()
export class InventoryMovementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountingService: AccountingService
  ) {}

  private async resolveLocationForWarehouse(warehouseId: string, client: Prisma.TransactionClient): Promise<string> {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new Error('Tenant context missing.');

    let loc = await client.stockLocation.findFirst({
      where: { id: warehouseId, tenantId }
    });
    if (!loc) {
      const wh = await client.warehouse.findFirst({ where: { id: warehouseId, tenantId } });
      const name = wh ? wh.name : `Warehouse Location ${warehouseId}`;
      
      loc = await client.stockLocation.create({
        data: {
          id: warehouseId,
          tenantId,
          name
        }
      });
    }
    return loc.id;
  }

  async executeMovement(
    data: {
      variantId: string;
      quantity: number;
      movementType: string; // SALE, PURCHASE, TRANSFER, ADJUSTMENT, SCRAP, CONSUMPTION
      referenceType: string; // INVOICE, PURCHASE_ORDER, INVENTORY_AUDIT, PROJECT_MATERIAL
      referenceId: string;
      sourceWarehouseId?: string;
      destWarehouseId?: string;
    },
    tx?: Prisma.TransactionClient
  ) {
    const client = tx || this.prisma;
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new Error('Tenant context missing.');

    const variant = await client.productVariant.findFirst({
      where: { id: data.variantId, tenantId }
    });
    if (!variant) throw new BadRequestException('Product variant not found.');

    let sourceLocationId: string | undefined;
    let destLocationId: string | undefined;

    if (data.sourceWarehouseId) {
      sourceLocationId = await this.resolveLocationForWarehouse(data.sourceWarehouseId, client);
      
      const balance = await client.inventoryBalance.findFirst({
        where: { warehouseId: data.sourceWarehouseId, variantId: data.variantId, tenantId }
      });
      const stock = balance ? Number(balance.quantity) : 0;
      if (stock < data.quantity && data.movementType !== 'ADJUSTMENT') {
        throw new BadRequestException(`Insufficient stock for SKU ${variant.sku}. Available: ${stock}, Requested: ${data.quantity}`);
      }
      
      if (balance) {
        await client.inventoryBalance.update({
          where: { warehouseId_variantId: { warehouseId: data.sourceWarehouseId, variantId: data.variantId } },
          data: { quantity: { decrement: data.quantity } }
        });
      }
    }

    if (data.destWarehouseId) {
      destLocationId = await this.resolveLocationForWarehouse(data.destWarehouseId, client);
      
      const balance = await client.inventoryBalance.findFirst({
        where: { warehouseId: data.destWarehouseId, variantId: data.variantId, tenantId }
      });
      
      if (balance) {
        await client.inventoryBalance.update({
          where: { warehouseId_variantId: { warehouseId: data.destWarehouseId, variantId: data.variantId } },
          data: { quantity: { increment: data.quantity } }
        });
      } else {
        await client.inventoryBalance.create({
          data: {
            tenantId,
            warehouseId: data.destWarehouseId,
            variantId: data.variantId,
            quantity: data.quantity
          }
        });
      }
    }

    const movement = await client.inventoryMovement.create({
      data: {
        tenantId,
        variantId: data.variantId,
        sourceLocationId,
        destLocationId,
        quantity: new Prisma.Decimal(data.quantity),
        unitCost: variant.costPrice,
        movementType: data.movementType,
        referenceType: data.referenceType,
        referenceId: data.referenceId
      }
    });

    const totalCost = Number(movement.quantity) * Number(movement.unitCost);
    if (totalCost > 0) {
      if (data.movementType === 'SALE' || data.movementType === 'CONSUMPTION' || data.movementType === 'SCRAP') {
        await this.accountingService.postJournalEntry(client, {
          description: `Inventory Out (${data.movementType}) SKU: ${variant.sku}`,
          referenceType: 'STOCK_MOVEMENT',
          referenceId: movement.id,
          postings: [
            { accountCode: '5000', debit: totalCost, credit: 0.00 },
            { accountCode: '1400', debit: 0.00, credit: totalCost },
          ],
        });
      } else if (data.movementType === 'PURCHASE') {
        await this.accountingService.postJournalEntry(client, {
          description: `Inventory In (Purchase) SKU: ${variant.sku}`,
          referenceType: 'STOCK_MOVEMENT',
          referenceId: movement.id,
          postings: [
            { accountCode: '1400', debit: totalCost, credit: 0.00 },
            { accountCode: '2000', debit: 0.00, credit: totalCost },
          ],
        });
      } else if (data.movementType === 'ADJUSTMENT') {
        const isReduction = !!data.sourceWarehouseId && !data.destWarehouseId;
        const isAddition = !!data.destWarehouseId && !data.sourceWarehouseId;
        if (isReduction) {
          await this.accountingService.postJournalEntry(client, {
            description: `Inventory Adjustment (Deficit) SKU: ${variant.sku}`,
            referenceType: 'STOCK_MOVEMENT',
            referenceId: movement.id,
            postings: [
              { accountCode: '5000', debit: totalCost, credit: 0.00 },
              { accountCode: '1400', debit: 0.00, credit: totalCost },
            ],
          });
        } else if (isAddition) {
          await this.accountingService.postJournalEntry(client, {
            description: `Inventory Adjustment (Surplus) SKU: ${variant.sku}`,
            referenceType: 'STOCK_MOVEMENT',
            referenceId: movement.id,
            postings: [
              { accountCode: '1400', debit: totalCost, credit: 0.00 },
              { accountCode: '5000', debit: 0.00, credit: totalCost },
            ],
          });
        }
      }
    }

    return movement;
  }
}
