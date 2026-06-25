import { Module } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { WarehouseController } from './warehouse.controller';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [TenantModule],
  controllers: [WarehouseController],
  providers: [WarehouseService],
  exports: [WarehouseService],
})
export class WarehouseModule {}
