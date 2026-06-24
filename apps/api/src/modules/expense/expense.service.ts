import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto } from '@crm/dto';
import { Prisma, TenantContext } from '@crm/database';

@Injectable()
export class ExpenseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateExpenseDto) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context missing.');
    }

    return this.prisma.expense.create({
      data: {
        tenantId,
        amount: new Prisma.Decimal(createDto.amount),
        category: createDto.category.toUpperCase(),
        description: createDto.description,
        expenseDate: new Date(createDto.expenseDate),
        receiptUrl: createDto.receiptUrl,
      },
    });
  }

  async findAll() {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      return [];
    }

    return this.prisma.expense.findMany({
      where: { tenantId },
      orderBy: { expenseDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new NotFoundException('Expense log not found.');
    }

    const expense = await this.prisma.expense.findFirst({
      where: { id, tenantId },
    });

    if (!expense) {
      throw new NotFoundException('Expense log not found.');
    }

    return expense;
  }

  async update(id: string, updateDto: UpdateExpenseDto) {
    await this.findOne(id);

    return this.prisma.expense.update({
      where: { id },
      data: {
        amount: updateDto.amount ? new Prisma.Decimal(updateDto.amount) : undefined,
        category: updateDto.category ? updateDto.category.toUpperCase() : undefined,
        description: updateDto.description,
        expenseDate: updateDto.expenseDate ? new Date(updateDto.expenseDate) : undefined,
        receiptUrl: updateDto.receiptUrl,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.expense.delete({
      where: { id },
    });

    return { success: true };
  }
}
