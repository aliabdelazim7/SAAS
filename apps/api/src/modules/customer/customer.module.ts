import { Module } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { SupplierService } from './supplier.service';
import { SupplierController } from './supplier.controller';

@Module({
  controllers: [CustomerController, SupplierController],
  providers: [CustomerService, SupplierService],
  exports: [CustomerService, SupplierService],
})
export class CustomerModule {}
