import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWarehouseDto, UpdateWarehouseDto, AdjustStockDto } from '@crm/dto';
import { Prisma, TenantContext } from '@crm/database';

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaService) {}

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
    return this.prisma.warehouse.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
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

    const variant = await this.prisma.productVariant.findUnique({
      where: { id: adjustStockDto.variantId },
    });
    if (!variant) {
      throw new NotFoundException('Product variant not found.');
    }

    // 2. Upsert the InventoryBalance record
    return this.prisma.inventoryBalance.upsert({
      where: {
        warehouseId_variantId: {
          warehouseId: adjustStockDto.warehouseId,
          variantId: adjustStockDto.variantId,
        },
      },
      update: {
        quantity: {
          increment: new Prisma.Decimal(adjustStockDto.quantity),
        },
      },
      create: {
        tenantId,
        warehouseId: adjustStockDto.warehouseId,
        variantId: adjustStockDto.variantId,
        quantity: new Prisma.Decimal(adjustStockDto.quantity),
        reservedQuantity: new Prisma.Decimal(0.0),
        reorderLevel: new Prisma.Decimal(10.0),
      },
    });
  }

  async getBalances(warehouseId: string) {
    await this.findOne(warehouseId);

    return this.prisma.inventoryBalance.findMany({
      where: { warehouseId },
      include: {
        variant: {
          include: { product: true },
        },
      },
    });
  }
}
