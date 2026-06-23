import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto, UpdateCustomerDto } from '@crm/dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermission } from '../rbac/decorators/permission.decorator';

@Controller('customers')
@UseGuards(AuthGuard, PermissionsGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @RequirePermission('crm', 'create')
  async create(@Body() createDto: CreateCustomerDto) {
    return this.customerService.create(createDto);
  }

  @Get()
  @RequirePermission('crm', 'view')
  async findAll() {
    return this.customerService.findAll();
  }

  @Get(':id')
  @RequirePermission('crm', 'view')
  async findOne(@Param('id') id: string) {
    return this.customerService.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('crm', 'edit')
  async update(@Param('id') id: string, @Body() updateDto: UpdateCustomerDto) {
    return this.customerService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermission('crm', 'delete')
  async remove(@Param('id') id: string) {
    return this.customerService.remove(id);
  }
}
