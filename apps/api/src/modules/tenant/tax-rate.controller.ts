import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TaxRateService } from './tax-rate.service';
import { CreateTaxRateDto } from '@crm/dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('tax-rates')
@UseGuards(AuthGuard)
export class TaxRateController {
  constructor(private readonly taxRateService: TaxRateService) {}

  @Post()
  async create(@Body() dto: CreateTaxRateDto) {
    return this.taxRateService.create(dto);
  }

  @Get()
  async findAll() {
    return this.taxRateService.findAll();
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.taxRateService.remove(id);
  }

  @Patch(':id/default')
  async setDefault(@Param('id') id: string) {
    return this.taxRateService.setDefault(id);
  }
}
