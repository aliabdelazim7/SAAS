import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSupplierDto, UpdateSupplierDto } from '@crm/dto';
import { TenantContext } from '@crm/database';

@Injectable()
export class SupplierService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateSupplierDto) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context missing.');
    }

    return this.prisma.supplier.create({
      data: {
        tenantId,
        name: createDto.name,
        email: createDto.email,
        phone: createDto.phone,
        taxNumber: createDto.taxNumber,
        address: createDto.address,
      },
    });
  }

  async findAll() {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      return [];
    }

    return this.prisma.supplier.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new NotFoundException('Supplier not found.');
    }

    const supplier = await this.prisma.supplier.findFirst({
      where: { id, tenantId },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found.');
    }

    return supplier;
  }

  async update(id: string, updateDto: UpdateSupplierDto) {
    await this.findOne(id);

    return this.prisma.supplier.update({
      where: { id },
      data: {
        name: updateDto.name,
        email: updateDto.email,
        phone: updateDto.phone,
        taxNumber: updateDto.taxNumber,
        address: updateDto.address,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.supplier.delete({
      where: { id },
    });

    return { success: true };
  }
}
