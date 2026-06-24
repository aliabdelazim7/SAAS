import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductionOrderDto, UpdateProductionOrderDto } from '@crm/dto';
import { TenantContext } from '@crm/database';

@Injectable()
export class ProductionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateProductionOrderDto) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context missing.');
    }

    return this.prisma.productionOrder.create({
      data: {
        tenantId,
        productName: createDto.productName,
        rawMaterials: createDto.rawMaterials,
        quantity: createDto.quantity,
        machineName: createDto.machineName,
        supervisorName: createDto.supervisorName,
        status: createDto.status || 'RAW_MATERIALS',
      },
    });
  }

  async findAll() {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      return [];
    }

    return this.prisma.productionOrder.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new NotFoundException('Production order not found.');
    }

    const order = await this.prisma.productionOrder.findFirst({
      where: { id, tenantId },
    });

    if (!order) {
      throw new NotFoundException('Production order not found.');
    }

    return order;
  }

  async update(id: string, updateDto: UpdateProductionOrderDto) {
    await this.findOne(id);

    return this.prisma.productionOrder.update({
      where: { id },
      data: {
        productName: updateDto.productName,
        rawMaterials: updateDto.rawMaterials,
        quantity: updateDto.quantity,
        machineName: updateDto.machineName,
        supervisorName: updateDto.supervisorName,
        status: updateDto.status,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.productionOrder.delete({
      where: { id },
    });

    return { success: true };
  }
}
