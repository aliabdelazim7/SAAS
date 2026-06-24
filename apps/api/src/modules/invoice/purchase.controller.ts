import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { CreatePurchaseOrderDto } from '@crm/dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermission } from '../rbac/decorators/permission.decorator';

@Controller('purchases')
@UseGuards(AuthGuard, PermissionsGuard)
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Post()
  @RequirePermission('purchases', 'create')
  async create(@Body() createDto: CreatePurchaseOrderDto) {
    return this.purchaseService.create(createDto);
  }

  @Get()
  @RequirePermission('purchases', 'view')
  async findAll() {
    return this.purchaseService.findAll();
  }

  @Get(':id')
  @RequirePermission('purchases', 'view')
  async findOne(@Param('id') id: string) {
    return this.purchaseService.findOne(id);
  }
}
