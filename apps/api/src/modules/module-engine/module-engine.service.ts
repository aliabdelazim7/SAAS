import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ModuleEngineService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Installs a module for a tenant and enables it.
   */
  async installModule(tenantId: string, moduleId: string) {
    const existing = await this.prisma.tenantClient.tenantModule.findUnique({
      where: { tenantId_moduleId: { tenantId, moduleId } },
    });

    if (existing) {
      throw new BadRequestException('Module is already installed.');
    }

    // In a full implementation, we would validate module dependencies here
    return this.prisma.tenantClient.tenantModule.create({
      data: {
        tenantId,
        moduleId,
        isEnabled: true,
      },
    });
  }

  /**
   * Uninstalls a module, purging active registrations.
   */
  async uninstallModule(tenantId: string, moduleId: string) {
    return this.prisma.tenantClient.tenantModule.delete({
      where: { tenantId_moduleId: { tenantId, moduleId } },
    });
  }

  /**
   * Toggles the enabled status of an installed module.
   */
  async setModuleStatus(tenantId: string, moduleId: string, isEnabled: boolean) {
    return this.prisma.tenantClient.tenantModule.update({
      where: { tenantId_moduleId: { tenantId, moduleId } },
      data: { isEnabled },
    });
  }

  /**
   * Helper: Resolves if a specific module is active for the tenant workspace.
   */
  async isModuleEnabled(tenantId: string, moduleId: string): Promise<boolean> {
    const record = await this.prisma.tenantClient.tenantModule.findUnique({
      where: { tenantId_moduleId: { tenantId, moduleId } },
    });
    return !!record?.isEnabled;
  }
}
