import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { VehicleService } from './vehicle.service';
import { VehicleController } from './vehicle.controller';
import { ProductionService } from './production.service';
import { ProductionController } from './production.controller';
import { ShiftService } from './shift.service';
import { ShiftController } from './shift.controller';
import { BOMService } from './bom.service';
import { BOMController } from './bom.controller';
import { TaxRateService } from './tax-rate.service';
import { TaxRateController } from './tax-rate.controller';
import { InventoryMovementService } from './inventory-movement.service';
import { DocumentEngineService } from './document-engine.service';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [AccountingModule],
  controllers: [
    TenantController,
    ProjectController,
    VehicleController,
    ProductionController,
    ShiftController,
    BOMController,
    TaxRateController,
  ],
  providers: [
    TenantService,
    ProjectService,
    VehicleService,
    ProductionService,
    ShiftService,
    BOMService,
    TaxRateService,
    InventoryMovementService,
    DocumentEngineService,
  ],
  exports: [
    TenantService,
    ProjectService,
    VehicleService,
    ProductionService,
    ShiftService,
    BOMService,
    TaxRateService,
    InventoryMovementService,
    DocumentEngineService,
  ],
})
export class TenantModule {}

