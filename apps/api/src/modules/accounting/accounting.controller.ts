import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { CreateJournalEntryDto } from '@crm/dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermission } from '../rbac/decorators/permission.decorator';
import { TenantContext, Prisma } from '@crm/database';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('accounting')
@UseGuards(AuthGuard, PermissionsGuard)
export class AccountingController {
  constructor(
    private readonly accountingService: AccountingService,
    private readonly prisma: PrismaService
  ) {}

  @Post('journal-entries')
  @RequirePermission('finance', 'create')
  async createJournalEntry(@Body() createDto: CreateJournalEntryDto) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context missing.');
    }

    return this.prisma.$transaction(async (tx) => {
      return this.accountingService.postJournalEntry(tx, {
        description: createDto.description,
        referenceType: 'MANUAL',
        referenceId: 'manual-journal-entry',
        postings: createDto.postings,
      });
    });
  }

  @Get('trial-balance')
  @RequirePermission('finance', 'view')
  async getTrialBalance() {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context missing.');
    }
    return this.accountingService.getTrialBalance(tenantId);
  }

  @Get('financial-reports')
  @RequirePermission('finance', 'view')
  async getFinancialReports() {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context missing.');
    }
    return this.accountingService.getFinancialReports(tenantId);
  }
}
