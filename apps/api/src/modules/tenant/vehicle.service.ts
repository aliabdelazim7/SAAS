import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVehicleDto, UpdateVehicleDto } from '@crm/dto';
import { TenantContext } from '@crm/database';

@Injectable()
export class VehicleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateVehicleDto) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context missing.');
    }

    return this.prisma.vehicle.create({
      data: {
        tenantId,
        customerId: createDto.customerId,
        plateNumber: createDto.plateNumber,
        chassisNumber: createDto.chassisNumber,
        brand: createDto.brand,
        model: createDto.model,
        year: createDto.year,
        color: createDto.color,
        notes: createDto.notes,
      },
      include: {
        customer: true,
      },
    });
  }

  async findAll() {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      return [];
    }

    return this.prisma.vehicle.findMany({
      where: { tenantId },
      include: {
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new NotFoundException('Vehicle not found.');
    }

    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
      },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found.');
    }

    return vehicle;
  }

  async update(id: string, updateDto: UpdateVehicleDto) {
    await this.findOne(id);

    return this.prisma.vehicle.update({
      where: { id },
      data: {
        customerId: updateDto.customerId,
        plateNumber: updateDto.plateNumber,
        chassisNumber: updateDto.chassisNumber,
        brand: updateDto.brand,
        model: updateDto.model,
        year: updateDto.year,
        color: updateDto.color,
        notes: updateDto.notes,
      },
      include: {
        customer: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.vehicle.delete({
      where: { id },
    });

    return { success: true };
  }
}
