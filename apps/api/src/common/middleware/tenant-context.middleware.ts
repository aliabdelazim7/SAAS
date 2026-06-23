import { Injectable, NestMiddleware } from '@nestjs/common';
import { TenantContext } from '@crm/database';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: any, res: any, next: () => void) {
    const host = req.headers.host || '';
    let tenantId = req.headers['x-tenant-id'] as string;

    // 1. Resolve tenant ID from subdomain if not present in custom header
    if (!tenantId) {
      const subdomain = this.extractSubdomain(host);
      if (subdomain && subdomain !== 'app' && subdomain !== 'www') {
        // Query global tenants registry (bypasses RLS)
        const tenant = await this.prisma.tenant.findUnique({
          where: { subdomain },
          select: { id: true },
        });
        if (tenant) {
          tenantId = tenant.id;
        }
      }
    }

    // 2. Execute downstream request pipeline inside the TenantContext storage container
    if (tenantId) {
      req.tenantId = tenantId;
      TenantContext.run({ tenantId }, () => next());
    } else {
      next();
    }
  }

  private extractSubdomain(host: string): string | null {
    const parts = host.split('.');
    // Handles subdomain resolving (e.g. tenant1.saas.com -> tenant1)
    return parts.length > 2 ? parts[0] : null;
  }
}
