import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { WarehouseService } from './warehouse.service';
import { CreateWarehouseDto, UpdateWarehouseDto, AdjustStockDto } from '@crm/dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermission } from '../rbac/decorators/permission.decorator';

@Controller('warehouses')
@UseGuards(AuthGuard, PermissionsGuard)
export class WarehouseController {
  constructor(private readonly warehouseService: WarehouseService) {}

  @Post()
  @RequirePermission('inventory', 'create')
  async create(@Body() createDto: CreateWarehouseDto) {
    return this.warehouseService.create(createDto);
  }

  @Get()
  @RequirePermission('inventory', 'view')
  async findAll() {
    return this.warehouseService.findAll();
  }

  @Get(':id')
  @RequirePermission('inventory', 'view')
  async findOne(@Param('id') id: string) {
    return this.warehouseService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('inventory', 'edit')
  async update(@Param('id') id: string, @Body() updateDto: UpdateWarehouseDto) {
    return this.warehouseService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermission('inventory', 'delete')
  async remove(@Param('id') id: string) {
    return this.warehouseService.remove(id);
  }

  @Post('adjust-stock')
  @RequirePermission('inventory', 'edit')
  async adjustStock(@Body() adjustStockDto: AdjustStockDto) {
    return this.warehouseService.adjustStock(adjustStockDto);
  }

  @Get(':id/balances')
  @RequirePermission('inventory', 'view')
  async getBalances(@Param('id') id: string) {
    return this.warehouseService.getBalances(id);
  }
}
