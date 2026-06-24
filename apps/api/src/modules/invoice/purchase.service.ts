import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePurchaseOrderDto } from '@crm/dto';
import { Prisma, TenantContext } from '@crm/database';

@Injectable()
export class PurchaseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreatePurchaseOrderDto) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context missing.');
    }

    // 1. Calculate totals
    let subTotal = 0;
    let taxTotal = 0;

    const itemsData = createDto.items.map((item) => {
      const itemSub = item.quantity * item.unitCost;
      const rate = item.taxRate ?? 15.00;
      const itemTax = itemSub * (rate / 100);
      
      subTotal += itemSub;
      taxTotal += itemTax;

      return {
        tenantId,
        variantId: item.variantId,
        quantity: new Prisma.Decimal(item.quantity),
        unitCost: new Prisma.Decimal(item.unitCost),
        taxRate: new Prisma.Decimal(rate),
        taxAmount: new Prisma.Decimal(itemTax),
        totalAmount: new Prisma.Decimal(itemSub + itemTax),
      };
    });

    const grandTotal = subTotal + taxTotal;

    // 2. Database transaction to create PO and update inventory
    return this.prisma.$transaction(async (tx) => {
      // Create PO
      const po = await tx.purchaseOrder.create({
        data: {
          tenantId,
          supplierId: createDto.supplierId,
          warehouseId: createDto.warehouseId,
          orderNumber: createDto.orderNumber,
          status: 'RECEIVED', // Mark as RECEIVED so it instantly updates stock
          subTotal: new Prisma.Decimal(subTotal),
          taxTotal: new Prisma.Decimal(taxTotal),
          grandTotal: new Prisma.Decimal(grandTotal),
          notes: createDto.notes,
          issueDate: new Date(createDto.issueDate),
          items: {
            create: itemsData,
          },
        },
        include: {
          items: {
            include: {
              variant: true,
            },
          },
          supplier: true,
          warehouse: true,
        },
      });

      // Update Inventory Balance for each item
      for (const item of createDto.items) {
        const existingBalance = await tx.inventoryBalance.findFirst({
          where: {
            warehouseId: createDto.warehouseId,
            variantId: item.variantId,
          },
        });

        if (existingBalance) {
          await tx.inventoryBalance.update({
            where: { id: existingBalance.id },
            data: {
              quantity: {
                increment: new Prisma.Decimal(item.quantity),
              },
            },
          });
        } else {
          await tx.inventoryBalance.create({
            data: {
              tenantId,
              warehouseId: createDto.warehouseId,
              variantId: item.variantId,
              quantity: new Prisma.Decimal(item.quantity),
              reservedQuantity: new Prisma.Decimal(0),
              reorderLevel: new Prisma.Decimal(10),
            },
          });
        }
      }

      return po;
    });
  }

  async findAll() {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      return [];
    }

    return this.prisma.purchaseOrder.findMany({
      where: { tenantId },
      include: {
        supplier: true,
        warehouse: true,
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new NotFoundException('Purchase order not found.');
    }

    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: {
        supplier: true,
        warehouse: true,
        items: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!po) {
      throw new NotFoundException('Purchase order not found.');
    }

    return po;
  }
}
