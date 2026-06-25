import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext, Prisma } from '@crm/database';
import { CreateBOMDto } from '@crm/dto';

@Injectable()
export class BOMService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBOMDto) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new Error('Tenant context missing.');

    // 1. Verify finished goods product variant exists
    const finishedVariant = await this.prisma.productVariant.findFirst({
      where: { id: dto.variantId, tenantId },
    });
    if (!finishedVariant) {
      throw new NotFoundException('Finished product variant not found.');
    }

    // 2. Process raw materials and calculate total rolled cost
    return this.prisma.$transaction(async (tx) => {
      // Delete existing BOM if any
      await tx.billOfMaterials.deleteMany({
        where: { variantId: dto.variantId, tenantId },
      });

      let totalCost = new Prisma.Decimal(0.00);
      const itemsToCreate: any[] = [];

      for (const item of dto.items) {
        const rawVariant = await tx.productVariant.findFirst({
          where: { id: item.variantId, tenantId },
        });
        if (!rawVariant) {
          throw new NotFoundException(`Raw material SKU variant ${item.variantId} not found.`);
        }

        const qty = new Prisma.Decimal(item.quantity);
        const cost = new Prisma.Decimal(item.unitCost);
        const itemCost = qty.mul(cost);

        totalCost = totalCost.add(itemCost);
        itemsToCreate.push({
          tenantId,
          variantId: item.variantId,
          quantity: qty,
          unitCost: cost,
          totalCost: itemCost,
        });
      }

      // Create main Bill of Materials
      const bom = await tx.billOfMaterials.create({
        data: {
          tenantId,
          variantId: dto.variantId,
          name: dto.name,
          description: dto.description,
          totalCost,
          items: {
            create: itemsToCreate.map(i => ({
              tenantId: i.tenantId,
              variantId: i.variantId,
              quantity: i.quantity,
              unitCost: i.unitCost,
              totalCost: i.totalCost,
            }))
          }
        },
        include: {
          items: { include: { variant: { include: { product: true } } } },
          variant: { include: { product: true } },
        }
      });

      // Optional: automatically update variant's costPrice based on rolled BOM cost!
      await tx.productVariant.update({
        where: { id: dto.variantId },
        data: {
          costPrice: totalCost,
        }
      });

      return bom;
    });
  }

  async findOneByVariant(variantId: string) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new Error('Tenant context missing.');

    return this.prisma.billOfMaterials.findFirst({
      where: { variantId, tenantId },
      include: {
        items: { include: { variant: { include: { product: true } } } },
        variant: { include: { product: true } },
      }
    });
  }

  async findAll() {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) return [];

    return this.prisma.billOfMaterials.findMany({
      where: { tenantId },
      include: {
        items: { include: { variant: { include: { product: true } } } },
        variant: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
