import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantContext } from '@crm/database';
import { RbacService } from '../rbac.service';
import { RequiredPermission } from '../decorators/permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<RequiredPermission>(
      'permission',
      context.getHandler()
    );

    // If no permission requirement metadata is attached, let the request proceed
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Populated by AuthGuard
    const tenantId = request.tenantId || request.raw?.tenantId || TenantContext.getTenantId() || user?.tenantId;

    if (tenantId) {
      request.tenantId = tenantId;
      if (request.raw) {
        request.raw.tenantId = tenantId;
      }
      TenantContext.enterWith({ tenantId });
    }

    console.log('PermissionsGuard - user:', user, 'tenantId:', tenantId);

    if (!user || !tenantId) {
      console.log('PermissionsGuard - Missing user or tenantId. user exists:', !!user, 'tenantId exists:', !!tenantId);
      return false;
    }

    const hasPermission = await this.rbacService.userHasPermission(
      user.userId,
      tenantId,
      requiredPermission.module,
      requiredPermission.action
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Insufficient privileges. Requires permission ${requiredPermission.module}:${requiredPermission.action}`
      );
    }

    return true;
  }
}
