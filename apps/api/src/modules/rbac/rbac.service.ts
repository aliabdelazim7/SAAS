import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RbacService {
  // In-memory cache fallback. Can be extended to connect to a Redis Client in production.
  private permissionsCache = new Map<string, { permissions: string[]; expiresAt: number }>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Evaluates if a user is authorized to perform an action on a module.
   */
  async userHasPermission(userId: string, tenantId: string, module: string, action: string): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId, tenantId);

    // 1. Superuser/Owner wildcard check
    if (userPermissions.includes('*:*') || userPermissions.includes('manage:manage')) {
      return true;
    }

    // 2. Module specific wildcard check (e.g. 'crm:manage')
    if (userPermissions.includes(`${module}:manage`) || userPermissions.includes(`${module}:*`)) {
      return true;
    }

    // 3. Granular check (e.g. 'inventory:create')
    return userPermissions.includes(`${module}:${action}`);
  }

  /**
   * Retrieves all permissions associated with the user's roles.
   */
  async getUserPermissions(userId: string, tenantId: string): Promise<string[]> {
    const cacheKey = `tenant:${tenantId}:user:${userId}:perms`;
    const cached = this.permissionsCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.permissions;
    }

    // Query DB (uses tenant-aware client to restrict scope)
    const userRoles = await this.prisma.tenantClient.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const permissionSet = new Set<string>();

    for (const ur of userRoles) {
      if (ur.role.name === 'OWNER') {
        permissionSet.add('*:*');
      }
      for (const rp of ur.role.permissions) {
        permissionSet.add(`${rp.permission.module}:${rp.permission.action}`);
      }
    }

    const permissionsArray = Array.from(permissionSet);

    // Cache permissions list for 10 minutes
    this.permissionsCache.set(cacheKey, {
      permissions: permissionsArray,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    return permissionsArray;
  }

  /**
   * Invalidates permissions cache when roles or permissions change.
   */
  invalidateCache(userId: string, tenantId: string) {
    const cacheKey = `tenant:${tenantId}:user:${userId}:perms`;
    this.permissionsCache.delete(cacheKey);
  }
}
