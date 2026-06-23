import { Controller, Get, Post, Param, Delete, Body, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from '@crm/dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermission } from '../rbac/decorators/permission.decorator';

@Controller('products')
@UseGuards(AuthGuard, PermissionsGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @RequirePermission('inventory', 'create')
  async create(@Body() createDto: CreateProductDto) {
    return this.productService.create(createDto);
  }

  @Get()
  @RequirePermission('inventory', 'view')
  async findAll() {
    return this.productService.findAll();
  }

  @Get(':id')
  @RequirePermission('inventory', 'view')
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Delete(':id')
  @RequirePermission('inventory', 'delete')
  async remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
