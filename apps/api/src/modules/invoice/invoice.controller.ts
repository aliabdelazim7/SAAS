import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto, POSCheckoutDto } from '@crm/dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RequirePermission } from '../rbac/decorators/permission.decorator';

@Controller('invoices')
@UseGuards(AuthGuard, PermissionsGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @RequirePermission('sales', 'create')
  async create(@Req() req: any, @Body() createDto: CreateInvoiceDto) {
    return this.invoiceService.create(createDto, req.user.userId);
  }

  @Post('pos')
  @RequirePermission('pos', 'create')
  async posCheckout(@Req() req: any, @Body() posDto: POSCheckoutDto) {
    return this.invoiceService.posCheckout(posDto, req.user.userId);
  }

  @Get()
  @RequirePermission('sales', 'view')
  async findAll() {
    return this.invoiceService.findAll();
  }

  @Get(':id')
  @RequirePermission('sales', 'view')
  async findOne(@Param('id') id: string) {
    return this.invoiceService.findOne(id);
  }
}
