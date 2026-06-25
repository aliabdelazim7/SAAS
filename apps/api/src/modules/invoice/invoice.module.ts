import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { PurchaseService } from './purchase.service';
import { PurchaseController } from './purchase.controller';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [TenantModule],
  controllers: [InvoiceController, PurchaseController],
  providers: [InvoiceService, PurchaseService],
  exports: [InvoiceService, PurchaseService],
})
export class InvoiceModule {}
