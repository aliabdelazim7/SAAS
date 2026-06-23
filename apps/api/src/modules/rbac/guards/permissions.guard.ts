import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
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
    const tenantId = request.tenantId; // Populated by TenantContextMiddleware

    if (!user || !tenantId) {
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
