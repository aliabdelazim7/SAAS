import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext, Prisma } from '@crm/database';
import { CreateTaxRateDto } from '@crm/dto';

@Injectable()
export class TaxRateService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTaxRateDto) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new Error('Tenant context missing.');

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        // Remove default status from existing rates
        await tx.taxRate.updateMany({
          where: { tenantId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.taxRate.create({
        data: {
          tenantId,
          name: dto.name,
          rate: new Prisma.Decimal(dto.rate),
          isDefault: !!dto.isDefault,
        },
      });
    });
  }

  async findAll() {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) return [];

    return this.prisma.taxRate.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new Error('Tenant context missing.');

    const taxRate = await this.prisma.taxRate.findFirst({
      where: { id, tenantId },
    });
    if (!taxRate) throw new NotFoundException('Tax rate not found.');

    return this.prisma.taxRate.delete({
      where: { id },
    });
  }

  async setDefault(id: string) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new Error('Tenant context missing.');

    const taxRate = await this.prisma.taxRate.findFirst({
      where: { id, tenantId },
    });
    if (!taxRate) throw new NotFoundException('Tax rate not found.');

    return this.prisma.$transaction(async (tx) => {
      await tx.taxRate.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });

      return tx.taxRate.update({
        where: { id },
        data: { isDefault: true },
      });
    });
  }
}
