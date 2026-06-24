import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto, POSCheckoutDto } from '@crm/dto';
import { Prisma, TenantContext } from '@crm/database';

@Injectable()
export class InvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateInvoiceDto) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new Error('Tenant context missing.');
    }

    // 1. Verify customer exists if specified within this tenant
    if (createDto.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: { id: createDto.customerId, tenantId },
      });
      if (!customer) {
        throw new NotFoundException('Customer not found.');
      }
    }

    // 2. Verify warehouse exists within this tenant
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: createDto.warehouseId, tenantId },
    });
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found.');
    }

    // 3. Process items and calculate totals in a database transaction
    return this.prisma.$transaction(async (tx) => {
      let subTotal = new Prisma.Decimal(0.00);
      let taxTotal = new Prisma.Decimal(0.00);
      let discountTotal = new Prisma.Decimal(0.00);
      let grandTotal = new Prisma.Decimal(0.00);

      const resolvedItems: any[] = [];

      for (const item of createDto.items) {
        // A. Verify variant exists and fetch price within this tenant
        const variant = await tx.productVariant.findFirst({
          where: { id: item.variantId, tenantId },
        });
        if (!variant) {
          throw new NotFoundException(`Product variant ${item.variantId} not found.`);
        }

        // B. Check stock balance in the warehouse within this tenant
        const balance = await tx.inventoryBalance.findFirst({
          where: {
            warehouseId: createDto.warehouseId,
            variantId: item.variantId,
            tenantId,
          },
        });

        const availableQty = balance ? Number(balance.quantity) : 0;
        if (availableQty < item.quantity) {
          throw new ConflictException(
            `Insufficient stock for SKU ${variant.sku} in warehouse ${warehouse.name}. Available: ${availableQty}, Requested: ${item.quantity}`
          );
        }

        // C. Calculate Totals
        const qty = new Prisma.Decimal(item.quantity);
        const price = new Prisma.Decimal(item.unitPrice);
        const disc = new Prisma.Decimal(item.discountAmount ?? 0);
        const taxRate = new Prisma.Decimal(item.taxRate ?? 15); // Default 15% VAT

        const itemSubtotal = qty.mul(price);
        const itemNetSubtotal = itemSubtotal.sub(disc);
        const itemTax = itemNetSubtotal.mul(taxRate.div(100));
        const itemTotal = itemNetSubtotal.add(itemTax);

        subTotal = subTotal.add(itemSubtotal);
        discountTotal = discountTotal.add(disc);
        taxTotal = taxTotal.add(itemTax);
        grandTotal = grandTotal.add(itemTotal);

        resolvedItems.push({
          variantId: item.variantId,
          quantity: qty,
          unitPrice: price,
          taxRate,
          taxAmount: itemTax,
          discountAmount: disc,
          totalAmount: itemTotal,
        });
      }

      // D. Auto-generate invoice number if missing
      const invoiceNumber =
        createDto.invoiceNumber ??
        `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // E. Create the Invoice
      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          customerId: createDto.customerId,
          invoiceNumber,
          status: createDto.status,
          subTotal,
          taxTotal,
          discountTotal,
          grandTotal,
          notes: createDto.notes,
          issueDate: new Date(),
          dueDate: new Date(createDto.dueDate),
        },
      });

      // F. Create the Invoice Items & Deduct Inventory Balances
      for (const resolvedItem of resolvedItems) {
        // Create line item
        await tx.invoiceItem.create({
          data: {
            tenantId,
            invoiceId: invoice.id,
            variantId: resolvedItem.variantId,
            quantity: resolvedItem.quantity,
            unitPrice: resolvedItem.unitPrice,
            taxRate: resolvedItem.taxRate,
            taxAmount: resolvedItem.taxAmount,
            discountAmount: resolvedItem.discountAmount,
            totalAmount: resolvedItem.totalAmount,
          },
        });

        // Deduct inventory balance
        await tx.inventoryBalance.update({
          where: {
            warehouseId_variantId: {
              warehouseId: createDto.warehouseId,
              variantId: resolvedItem.variantId,
            },
          },
          data: {
            quantity: {
              decrement: resolvedItem.quantity,
            },
          },
        });
      }

      // G. If UNPAID, update Customer Outstanding Balance
      if (createDto.status !== 'PAID' && createDto.customerId) {
        await tx.customer.update({
          where: { id: createDto.customerId },
          data: {
            outstandingBalance: {
              increment: grandTotal,
            },
          },
        });
      }

      // H. If PAID, create Payment record
      if (createDto.status === 'PAID') {
        await tx.payment.create({
          data: {
            tenantId,
            invoiceId: invoice.id,
            amount: grandTotal,
            paymentMethod: 'CASH', // default for general sales
            status: 'COMPLETED',
            reference: 'System Auto-Payment',
            paidAt: new Date(),
          },
        });
      }

      return tx.invoice.findUnique({
        where: { id: invoice.id },
        include: { items: { include: { variant: true } } },
      });
    });
  }

  // --- High-Speed POS Billing Checkout ---
  async posCheckout(posDto: POSCheckoutDto) {
    // 1. Map to CreateInvoiceDto
    const invoiceDto: CreateInvoiceDto = {
      customerId: posDto.customerId,
      status: 'PAID',
      dueDate: new Date().toISOString(),
      warehouseId: posDto.warehouseId,
      items: posDto.items,
      invoiceNumber: `POS-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    };

    // 2. Execute standard invoice transaction
    const invoice = await this.create(invoiceDto);

    // 3. Update payment details with the user's specific payment method
    if (invoice) {
      await this.prisma.payment.updateMany({
        where: { invoiceId: invoice.id },
        data: {
          paymentMethod: posDto.paymentMethod.toUpperCase(),
        },
      });
    }

    return invoice;
  }

  async findAll() {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      return [];
    }

    return this.prisma.invoice.findMany({
      where: { tenantId },
      include: {
        customer: true,
        items: { include: { variant: { include: { product: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      throw new NotFoundException('Invoice not found.');
    }

    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        items: { include: { variant: { include: { product: true } } } },
        payments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found.');
    }

    return invoice;
  }
}
