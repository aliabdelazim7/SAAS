import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto, UpdateSupplierDto } from '@crm/dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermission } from '../rbac/decorators/permission.decorator';

@Controller('suppliers')
@UseGuards(AuthGuard, PermissionsGuard)
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  @RequirePermission('purchases', 'create')
  async create(@Body() createDto: CreateSupplierDto) {
    return this.supplierService.create(createDto);
  }

  @Get()
  @RequirePermission('purchases', 'view')
  async findAll() {
    return this.supplierService.findAll();
  }

  @Get(':id')
  @RequirePermission('purchases', 'view')
  async findOne(@Param('id') id: string) {
    return this.supplierService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('purchases', 'edit')
  async update(@Param('id') id: string, @Body() updateDto: UpdateSupplierDto) {
    return this.supplierService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermission('purchases', 'delete')
  async remove(@Param('id') id: string) {
    return this.supplierService.remove(id);
  }
}
