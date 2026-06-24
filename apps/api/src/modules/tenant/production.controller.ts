import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ProductionService } from './production.service';
import { CreateProductionOrderDto, UpdateProductionOrderDto } from '@crm/dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermission } from '../rbac/decorators/permission.decorator';

@Controller('production')
@UseGuards(AuthGuard, PermissionsGuard)
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  @Post()
  @RequirePermission('production', 'create')
  async create(@Body() createDto: CreateProductionOrderDto) {
    return this.productionService.create(createDto);
  }

  @Get()
  @RequirePermission('production', 'view')
  async findAll() {
    return this.productionService.findAll();
  }

  @Get(':id')
  @RequirePermission('production', 'view')
  async findOne(@Param('id') id: string) {
    return this.productionService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('production', 'edit')
  async update(@Param('id') id: string, @Body() updateDto: UpdateProductionOrderDto) {
    return this.productionService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermission('production', 'delete')
  async remove(@Param('id') id: string) {
    return this.productionService.remove(id);
  }
}
