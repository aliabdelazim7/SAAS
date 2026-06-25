import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContext, Prisma } from '@crm/database';

@Injectable()
export class DocumentEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async createDocument(
    data: {
      docType: string; // INVOICE, QUOTATION, PURCHASE_ORDER, GRN, CREDIT_NOTE
      docNumber?: string;
      partyType: string; // CUSTOMER, SUPPLIER
      partyId?: string | null;
      currency?: string;
      exchangeRate?: number;
      status?: string;
      metaData?: any;
      lines: {
        variantId: string;
        quantity: number;
        unitPrice: number;
        taxRate?: number;
        discountAmount?: number;
      }[];
    },
    tx?: Prisma.TransactionClient
  ) {
    const client = tx || this.prisma;
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) throw new Error('Tenant context missing.');

    const docNumber = data.docNumber || `${data.docType.slice(0, 3)}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let subTotal = new Prisma.Decimal(0.00);
    let taxTotal = new Prisma.Decimal(0.00);
    let discountTotal = new Prisma.Decimal(0.00);
    let grandTotal = new Prisma.Decimal(0.00);

    const resolvedLines: any[] = [];

    for (const line of data.lines) {
      const qty = new Prisma.Decimal(line.quantity);
      const price = new Prisma.Decimal(line.unitPrice);
      const disc = new Prisma.Decimal(line.discountAmount ?? 0);
      const taxRate = new Prisma.Decimal(line.taxRate ?? 15.00);

      const itemSubtotal = qty.mul(price);
      const itemNet = itemSubtotal.sub(disc);
      const itemTax = itemNet.mul(taxRate.div(100));
      const itemTotal = itemNet.add(itemTax);

      subTotal = subTotal.add(itemSubtotal);
      discountTotal = discountTotal.add(disc);
      taxTotal = taxTotal.add(itemTax);
      grandTotal = grandTotal.add(itemTotal);

      resolvedLines.push({
        variantId: line.variantId,
        quantity: qty,
        unitPrice: price,
        taxRate,
        taxAmount: itemTax,
        discountAmount: disc,
        totalAmount: itemTotal
      });
    }

    return client.genericDocument.create({
      data: {
        tenantId,
        docType: data.docType,
        docNumber,
        partyType: data.partyType,
        partyId: data.partyId || null,
        currency: data.currency || 'USD',
        exchangeRate: new Prisma.Decimal(data.exchangeRate ?? 1.0000),
        subTotal,
        taxTotal,
        discountTotal,
        grandTotal,
        status: data.status || 'DRAFT',
        metaData: data.metaData || {},
        lines: {
          create: resolvedLines
        }
      },
      include: {
        lines: {
          include: {
            variant: true
          }
        }
      }
    });
  }
}
