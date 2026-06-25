import { Controller, Get, Patch, Post, Body, Req, UseGuards, Param, Delete } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { UpdateOrganizationDto, InviteMemberDto } from '@crm/dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('tenant')
@UseGuards(AuthGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('profile')
  async getProfile(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.tenantService.getProfile(tenantId);
  }

  @Patch('profile')
  async updateProfile(@Req() req: any, @Body() updateDto: UpdateOrganizationDto) {
    const tenantId = req.user.tenantId;
    return this.tenantService.updateProfile(tenantId, updateDto);
  }

  @Get('members')
  async getMembers(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.tenantService.getMembers(tenantId);
  }

  @Post('invite')
  async inviteMember(@Req() req: any, @Body() inviteDto: InviteMemberDto) {
    const tenantId = req.user.tenantId;
    // In production, we would check if the requestor has ADMIN/OWNER permissions
    return this.tenantService.inviteMember(tenantId, inviteDto);
  }

  @Post('bootstrap-template')
  async bootstrapTemplate(@Req() req: any, @Body('templateCode') templateCode: string) {
    const tenantId = req.user.tenantId;
    return this.tenantService.bootstrapTemplateForTenant(tenantId, templateCode);
  }

  @Get('templates')
  async getTemplates() {
    return this.tenantService.getTemplates();
  }
}
