import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext, Prisma } from '@crm/database';
import { OpenShiftDto, CloseShiftDto } from '@crm/dto';

@Injectable()
export class ShiftService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveShift(userId: string) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new Error('Tenant context missing.');

    return this.prisma.shift.findFirst({
      where: {
        tenantId,
        userId,
        status: 'OPEN',
      },
      include: {
        payments: true,
      },
    });
  }

  async open(userId: string, dto: OpenShiftDto) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new Error('Tenant context missing.');

    const active = await this.getActiveShift(userId);
    if (active) {
      throw new BadRequestException('You already have an active open shift. Please close it first.');
    }

    return this.prisma.shift.create({
      data: {
        tenantId,
        userId,
        openingBalance: new Prisma.Decimal(dto.openingBalance),
        status: 'OPEN',
        notes: dto.notes,
      },
    });
  }

  async close(userId: string, dto: CloseShiftDto) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new Error('Tenant context missing.');

    const active = await this.getActiveShift(userId);
    if (!active) {
      throw new NotFoundException('No active open shift found for this user.');
    }

    // 1. Gather all cash payments received since shift started
    const cashPayments = await this.prisma.payment.findMany({
      where: {
        tenantId,
        paymentMethod: 'CASH',
        paidAt: {
          gte: active.startTime,
        },
        shiftId: null, // not yet associated with a shift
      },
    });

    const cashReceivedTotal = cashPayments.reduce(
      (sum, p) => sum.add(p.amount),
      new Prisma.Decimal(0.00)
    );

    const expected = new Prisma.Decimal(active.openingBalance).add(cashReceivedTotal);
    const actual = new Prisma.Decimal(dto.actualCash);
    const discrepancy = actual.sub(expected);

    // 2. Update all these payments to associate with the current shift
    await this.prisma.$transaction(async (tx) => {
      if (cashPayments.length > 0) {
        await tx.payment.updateMany({
          where: {
            id: { in: cashPayments.map((p) => p.id) },
          },
          data: {
            shiftId: active.id,
          },
        });
      }

      // 3. Update the shift to CLOSED status
      await tx.shift.update({
        where: { id: active.id },
        data: {
          endTime: new Date(),
          closingBalance: actual,
          actualCash: actual,
          expectedCash: expected,
          discrepancy,
          status: 'CLOSED',
          notes: dto.notes,
        },
      });

      // 4. Create an immutable reconciliation audit log
      await tx.cashDrawerReconciliation.create({
        data: {
          tenantId,
          shiftId: active.id,
          userId,
          countedCash: actual,
          systemCash: expected,
          discrepancy,
          notes: `Shift closed. Discrepancy: ${discrepancy.toString()}`,
        },
      });
    });

    return this.prisma.shift.findUnique({
      where: { id: active.id },
      include: { reconciliations: true },
    });
  }

  async findAll() {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) return [];

    return this.prisma.shift.findMany({
      where: { tenantId },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        reconciliations: true,
      },
      orderBy: { startTime: 'desc' },
    });
  }
}
