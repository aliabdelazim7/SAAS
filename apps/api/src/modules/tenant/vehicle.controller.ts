import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto, UpdateVehicleDto } from '@crm/dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermission } from '../rbac/decorators/permission.decorator';

@Controller('vehicles')
@UseGuards(AuthGuard, PermissionsGuard)
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post()
  @RequirePermission('vehicles', 'create')
  async create(@Body() createDto: CreateVehicleDto) {
    return this.vehicleService.create(createDto);
  }

  @Get()
  @RequirePermission('vehicles', 'view')
  async findAll() {
    return this.vehicleService.findAll();
  }

  @Get(':id')
  @RequirePermission('vehicles', 'view')
  async findOne(@Param('id') id: string) {
    return this.vehicleService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('vehicles', 'edit')
  async update(@Param('id') id: string, @Body() updateDto: UpdateVehicleDto) {
    return this.vehicleService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermission('vehicles', 'delete')
  async remove(@Param('id') id: string) {
    return this.vehicleService.remove(id);
  }
}
