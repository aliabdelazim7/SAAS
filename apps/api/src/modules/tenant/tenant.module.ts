import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { VehicleService } from './vehicle.service';
import { VehicleController } from './vehicle.controller';
import { ProductionService } from './production.service';
import { ProductionController } from './production.controller';

@Module({
  controllers: [TenantController, ProjectController, VehicleController, ProductionController],
  providers: [TenantService, ProjectService, VehicleService, ProductionService],
  exports: [TenantService, ProjectService, VehicleService, ProductionService],
})
export class TenantModule {}
