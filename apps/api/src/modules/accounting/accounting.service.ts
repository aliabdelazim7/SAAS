import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext, Prisma } from '@crm/database';
import { CreateJournalEntryDto } from '@crm/dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AccountingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Idempotently seeds the default Chart of Accounts for a tenant.
   */
  async seedChartOfAccounts(tx: Prisma.TransactionClient, tenantId: string) {
    const defaultAccounts = [
      { code: '1000', name: 'Cash & Bank', type: 'ASSET', isSystem: true },
      { code: '1200', name: 'Accounts Receivable', type: 'ASSET', isSystem: true },
      { code: '1400', name: 'Inventory Asset', type: 'ASSET', isSystem: true },
      { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', isSystem: true },
      { code: '3000', name: 'Owner Equity', type: 'EQUITY', isSystem: true },
      { code: '4000', name: 'Sales Revenue', type: 'REVENUE', isSystem: true },
      { code: '5000', name: 'Cost of Goods Sold (COGS)', type: 'EXPENSE', isSystem: true },
      { code: '5100', name: 'Operating Expenses', type: 'EXPENSE', isSystem: true },
    ];

    for (const acc of defaultAccounts) {
      await tx.account.upsert({
        where: {
          tenantId_code: { tenantId, code: acc.code },
        },
        create: {
          tenantId,
          code: acc.code,
          name: acc.name,
          type: acc.type,
          isSystem: acc.isSystem,
        },
        update: {
          name: acc.name,
          type: acc.type,
        },
      });
    }
  }

  /**
   * Posts a double-entry journal entry.
   * Debits must equal Credits.
   */
  async postJournalEntry(
    tx: Prisma.TransactionClient,
    data: {
      description?: string;
      referenceType: string;
      referenceId: string;
      postings: { accountCode: string; debit: number; credit: number }[];
    }
  ) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context missing.');
    }

    if (data.postings.length < 2) {
      throw new BadRequestException('A journal entry must contain at least 2 postings.');
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const p of data.postings) {
      if (p.debit < 0 || p.credit < 0) {
        throw new BadRequestException('Debits and credits must be non-negative.');
      }
      totalDebit += Number(p.debit);
      totalCredit += Number(p.credit);
    }

    // Floating-point precision check
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new BadRequestException(
        `Double-entry check failed. Total Debits (${totalDebit.toFixed(2)}) must equal Total Credits (${totalCredit.toFixed(2)}).`
      );
    }

    const transactionId = uuidv4();

    for (const p of data.postings) {
      const account = await tx.account.findUnique({
        where: {
          tenantId_code: { tenantId, code: p.accountCode },
        },
      });

      if (!account) {
        throw new BadRequestException(`Account with code ${p.accountCode} not found for this tenant.`);
      }

      await tx.ledgerPosting.create({
        data: {
          tenantId,
          accountId: account.id,
          debit: new Prisma.Decimal(p.debit),
          credit: new Prisma.Decimal(p.credit),
          transactionId,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          description: data.description || null,
        },
      });
    }

    return { transactionId };
  }

  /**
   * Computes the trial balance for a tenant.
   */
  async getTrialBalance(tenantId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { tenantId },
      orderBy: { code: 'asc' },
    });

    const postings = await this.prisma.ledgerPosting.findMany({
      where: { tenantId },
    });

    // Aggregate postings by accountId
    const totalsMap: { [key: string]: { debit: number; credit: number } } = {};
    for (const acc of accounts) {
      totalsMap[acc.id] = { debit: 0, credit: 0 };
    }

    for (const p of postings) {
      if (totalsMap[p.accountId]) {
        totalsMap[p.accountId].debit += Number(p.debit);
        totalsMap[p.accountId].credit += Number(p.credit);
      }
    }

    let overallDebits = 0;
    let overallCredits = 0;

    const resultAccounts = accounts.map((acc) => {
      const totals = totalsMap[acc.id];
      let netDebit = 0;
      let netCredit = 0;

      const isAssetOrExpense = acc.type === 'ASSET' || acc.type === 'EXPENSE';

      if (isAssetOrExpense) {
        if (totals.debit >= totals.credit) {
          netDebit = totals.debit - totals.credit;
        } else {
          netCredit = totals.credit - totals.debit;
        }
      } else {
        // Liability, Equity, Revenue
        if (totals.credit >= totals.debit) {
          netCredit = totals.credit - totals.debit;
        } else {
          netDebit = totals.debit - totals.credit;
        }
      }

      overallDebits += netDebit;
      overallCredits += netCredit;

      return {
        code: acc.code,
        name: acc.name,
        type: acc.type,
        totalDebit: totals.debit,
        totalCredit: totals.credit,
        netDebit,
        netCredit,
      };
    });

    return {
      accounts: resultAccounts,
      totalDebits: Number(overallDebits.toFixed(2)),
      totalCredits: Number(overallCredits.toFixed(2)),
      balancesMatch: Math.abs(overallDebits - overallCredits) < 0.01,
    };
  }

  /**
   * Generates financial statements (Profit & Loss / Income Statement).
   */
  async getFinancialReports(tenantId: string) {
    const postings = await this.prisma.ledgerPosting.findMany({
      where: { tenantId },
      include: { account: true },
    });

    let revenue = 0;
    let cogs = 0;
    let operatingExpenses = 0;

    for (const p of postings) {
      const code = p.account.code;
      if (code === '4000') {
        // Sales Revenue (normal Credit balance)
        revenue += Number(p.credit) - Number(p.debit);
      } else if (code === '5000') {
        // COGS (normal Debit balance)
        cogs += Number(p.debit) - Number(p.credit);
      } else if (code === '5100') {
        // Operating Expenses (normal Debit balance)
        operatingExpenses += Number(p.debit) - Number(p.credit);
      }
    }

    const grossProfit = revenue - cogs;
    const netIncome = grossProfit - operatingExpenses;

    return {
      revenue: Number(revenue.toFixed(2)),
      cogs: Number(cogs.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2)),
      operatingExpenses: Number(operatingExpenses.toFixed(2)),
      netIncome: Number(netIncome.toFixed(2)),
    };
  }
}
