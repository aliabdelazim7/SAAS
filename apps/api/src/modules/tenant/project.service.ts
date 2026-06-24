import { Injectable, NotFoundException } from '@nestjs/common';
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
    await this.findOne(id);

    return this.prisma.project.update({
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
}
