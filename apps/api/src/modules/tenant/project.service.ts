import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto, CreateTaskDto, UpdateTaskDto } from '@crm/dto';
import { Prisma, TenantContext } from '@crm/database';

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateProjectDto) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context missing.');
    }

    return this.prisma.project.create({
      data: {
        tenantId,
        customerId: createDto.customerId,
        vehicleId: createDto.vehicleId,
        name: createDto.name,
        description: createDto.description,
        status: createDto.status || 'LEAD',
        amount: new Prisma.Decimal(createDto.amount || 0),
        measurements: createDto.measurements || {},
        notes: createDto.notes,
      },
      include: {
        customer: true,
        vehicle: true,
        tasks: true,
      },
    });
  }

  async findAll() {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      return [];
    }

    return this.prisma.project.findMany({
      where: { tenantId },
      include: {
        customer: true,
        vehicle: true,
        tasks: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new NotFoundException('Project not found.');
    }

    const project = await this.prisma.project.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        vehicle: true,
        tasks: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    return project;
  }

  async update(id: string, updateDto: UpdateProjectDto) {
    const project = await this.findOne(id);
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new Error('Tenant context missing.');

    // 1. If measurements are being updated, record revision history
    if (updateDto.measurements && JSON.stringify(updateDto.measurements) !== JSON.stringify(project.measurements)) {
      await this.prisma.projectMeasurementHistory.create({
        data: {
          tenantId,
          projectId: id,
          measurements: updateDto.measurements,
          notes: `Updated measurements to: ${JSON.stringify(updateDto.measurements)}`,
        }
      });
    }

    // 2. Perform the update
    const updatedProject = await this.prisma.project.update({
      where: { id },
      data: {
        customerId: updateDto.customerId,
        vehicleId: updateDto.vehicleId,
        name: updateDto.name,
        description: updateDto.description,
        status: updateDto.status,
        amount: updateDto.amount ? new Prisma.Decimal(updateDto.amount) : undefined,
        measurements: updateDto.measurements,
        notes: updateDto.notes,
      },
      include: {
        customer: true,
        vehicle: true,
        tasks: true,
      },
    });

    // 3. Auto-billing: If status is advanced to DELIVERY or COMPLETED, auto-generate invoice for parts
    if (updateDto.status === 'DELIVERY' || updateDto.status === 'COMPLETED') {
      const existingInv = await this.prisma.invoice.findFirst({
        where: { customerId: project.customerId, tenantId, notes: `Project Auto-Bill: ${project.name}` }
      });
      if (!existingInv) {
        const mats = await this.prisma.projectMaterial.findMany({
          where: { projectId: id, tenantId }
        });
        const warehouse = await this.prisma.warehouse.findFirst({ where: { tenantId } });

        if (warehouse && mats.length > 0) {
          let subTotal = new Prisma.Decimal(0.00);
          for (const m of mats) {
            subTotal = subTotal.add(m.totalPrice);
          }
          const taxTotal = subTotal.mul(0.15);
          const grandTotal = subTotal.add(taxTotal);
          const invoiceNumber = `PRJ-${id.slice(-6)}-${Date.now().toString().slice(-4)}`;

          await this.prisma.invoice.create({
            data: {
              tenantId,
              customerId: project.customerId,
              invoiceNumber,
              status: 'UNPAID',
              subTotal,
              taxTotal,
              discountTotal: 0,
              grandTotal,
               notes: `Project Auto-Bill: ${project.name}`,
              issueDate: new Date(),
              dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days payment terms
              items: {
                create: mats.map(m => ({
                  tenantId,
                  variantId: m.variantId,
                  quantity: m.quantity,
                  unitPrice: m.unitPrice,
                  taxRate: 15.00,
                  taxAmount: new Prisma.Decimal(m.totalPrice).mul(0.15),
                  discountAmount: 0,
                  totalAmount: new Prisma.Decimal(m.totalPrice).mul(1.15)
                }))
              }
            }
          });
        }
      }
    }

    return updatedProject;
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.project.delete({
      where: { id },
    });

    return { success: true };
  }

  // --- TASKS SUPPORT ---
  async createTask(projectId: string, createTaskDto: CreateTaskDto) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context missing.');
    }

    return this.prisma.task.create({
      data: {
        tenantId,
        projectId,
        title: createTaskDto.title,
        description: createTaskDto.description,
        status: createTaskDto.status || 'TODO',
        dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
        assignedTo: createTaskDto.assignedTo,
      },
    });
  }

  async findTasks(projectId: string) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      return [];
    }

    return this.prisma.task.findMany({
      where: { tenantId, projectId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateTask(taskId: string, updateTaskDto: UpdateTaskDto) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context missing.');
    }

    const task = await this.prisma.task.findFirst({
      where: { id: taskId, tenantId },
    });

    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        title: updateTaskDto.title,
        description: updateTaskDto.description,
        status: updateTaskDto.status,
        dueDate: updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate) : undefined,
        assignedTo: updateTaskDto.assignedTo,
      },
    });
  }

  async removeTask(taskId: string) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context missing.');
    }

    const task = await this.prisma.task.findFirst({
      where: { id: taskId, tenantId },
    });

    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    await this.prisma.task.delete({
      where: { id: taskId },
    });

    return { success: true };
  }

  // --- PROJECT MATERIALS SUPPORT ---
  async addMaterial(projectId: string, dto: any) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new Error('Tenant context missing.');

    await this.findOne(projectId);
    const variant = await this.prisma.productVariant.findFirst({
      where: { id: dto.variantId, tenantId },
    });
    if (!variant) throw new NotFoundException('Product variant not found.');

    const warehouse = await this.prisma.warehouse.findFirst({ where: { tenantId } });
    if (!warehouse) throw new NotFoundException('No warehouse registered. Cannot deduct parts.');

    return this.prisma.$transaction(async (tx) => {
      const balance = await tx.inventoryBalance.findFirst({
        where: { warehouseId: warehouse.id, variantId: dto.variantId, tenantId },
      });
      const stock = balance ? Number(balance.quantity) : 0;
      if (stock < dto.quantity) {
        throw new BadRequestException(`Insufficient stock. Available: ${stock}, Requested: ${dto.quantity}`);
      }

      await tx.inventoryBalance.update({
        where: {
          warehouseId_variantId: {
            warehouseId: warehouse.id,
            variantId: dto.variantId,
          },
        },
        data: {
          quantity: { decrement: dto.quantity },
        },
      });

      const qty = Number(dto.quantity);
      const price = new Prisma.Decimal(dto.unitPrice);
      const total = price.mul(qty);

      return tx.projectMaterial.create({
        data: {
          tenantId,
          projectId,
          variantId: dto.variantId,
          quantity: qty,
          unitPrice: price,
          totalPrice: total,
        },
        include: {
          variant: { include: { product: true } },
        },
      });
    });
  }

  async removeMaterial(projectId: string, materialId: string) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new Error('Tenant context missing.');

    const material = await this.prisma.projectMaterial.findFirst({
      where: { id: materialId, projectId, tenantId },
    });
    if (!material) throw new NotFoundException('Project material not found.');

    const warehouse = await this.prisma.warehouse.findFirst({ where: { tenantId } });

    await this.prisma.$transaction(async (tx) => {
      if (warehouse) {
        await tx.inventoryBalance.update({
          where: {
            warehouseId_variantId: {
              warehouseId: warehouse.id,
              variantId: material.variantId,
            },
          },
          data: {
            quantity: { increment: material.quantity },
          },
        });
      }

      await tx.projectMaterial.delete({
        where: { id: materialId },
      });
    });

    return { success: true };
  }

  async findMaterials(projectId: string) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) return [];

    return this.prisma.projectMaterial.findMany({
      where: { projectId, tenantId },
      include: {
        variant: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMeasurementHistory(projectId: string) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) return [];

    return this.prisma.projectMeasurementHistory.findMany({
      where: { projectId, tenantId },
      orderBy: { changedAt: 'desc' },
    });
  }
}
