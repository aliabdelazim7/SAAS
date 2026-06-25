import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { BOMService } from './bom.service';
import { CreateBOMDto } from '@crm/dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('boms')
@UseGuards(AuthGuard)
export class BOMController {
  constructor(private readonly bomService: BOMService) {}

  @Post()
  async create(@Body() dto: CreateBOMDto) {
    return this.bomService.create(dto);
  }

  @Get('variant/:variantId')
  async findOneByVariant(@Param('variantId') variantId: string) {
    return this.bomService.findOneByVariant(variantId);
  }

  @Get()
  async findAll() {
    return this.bomService.findAll();
  }
}
