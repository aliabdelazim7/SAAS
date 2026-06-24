import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto } from '@crm/dto';
import { TenantContext } from '@crm/database';

@Injectable()
export class CustomerService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateCustomerDto) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context missing.');
    }

    return this.prisma.customer.create({
      data: {
        tenantId,
        name: createDto.name,
        email: createDto.email,
        phone: createDto.phone,
        taxNumber: createDto.taxNumber,
        creditLimit: createDto.creditLimit ?? 0.00,
        shippingAddress: createDto.shippingAddress,
        billingAddress: createDto.billingAddress,
      },
    });
  }

  async findAll() {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      return [];
    }

    return this.prisma.customer.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new NotFoundException('Customer not found.');
    }

    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    return customer;
  }

  async update(id: string, updateDto: UpdateCustomerDto) {
    await this.findOne(id); // Verifies existence within tenant context

    return this.prisma.customer.update({
      where: { id },
      data: {
        name: updateDto.name,
        email: updateDto.email,
        phone: updateDto.phone,
        taxNumber: updateDto.taxNumber,
        creditLimit: updateDto.creditLimit,
        shippingAddress: updateDto.shippingAddress,
        billingAddress: updateDto.billingAddress,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Verifies existence within tenant context

    await this.prisma.customer.delete({
      where: { id },
    });

    return { success: true };
  }
}
