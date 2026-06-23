import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ModuleEngineService } from '../module-engine.service';

@Injectable()
export class ModuleEnabledGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly moduleService: ModuleEngineService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModule = this.reflector.get<string>('moduleName', context.getHandler());

    // If route doesn't require specific module activation, let it pass
    if (!requiredModule) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId; // Populated by TenantContextMiddleware

    if (!tenantId) {
      return false;
    }

    const isEnabled = await this.moduleService.isModuleEnabled(tenantId, requiredModule);
    if (!isEnabled) {
      throw new ForbiddenException(
        `The module '${requiredModule}' is disabled or not installed for this organization.`
      );
    }

    return true;
  }
}
