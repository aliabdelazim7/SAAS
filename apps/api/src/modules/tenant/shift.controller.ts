import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ShiftService } from './shift.service';
import { OpenShiftDto, CloseShiftDto } from '@crm/dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('shifts')
@UseGuards(AuthGuard)
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @Get('active')
  async getActiveShift(@Req() req: any) {
    return this.shiftService.getActiveShift(req.user.userId);
  }

  @Post('open')
  async open(@Req() req: any, @Body() dto: OpenShiftDto) {
    return this.shiftService.open(req.user.userId, dto);
  }

  @Post('close')
  async close(@Req() req: any, @Body() dto: CloseShiftDto) {
    return this.shiftService.close(req.user.userId, dto);
  }

  @Get()
  async findAll() {
    return this.shiftService.findAll();
  }
}
