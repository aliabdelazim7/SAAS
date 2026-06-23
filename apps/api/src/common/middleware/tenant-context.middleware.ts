import { Injectable, NestMiddleware } from '@nestjs/common';
import { TenantContext } from '@crm/database';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: any, res: any, next: () => void) {
    const host = req.headers.host || '';
    let tenantId = req.headers['x-tenant-id'] as string;

    console.log('TenantContextMiddleware - host:', host, 'header tenantId:', tenantId);

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

    // 2. Fallback: Resolve tenant ID from JWT Token payload if still not resolved
    if (!tenantId && req.headers.authorization) {
      console.log('TenantContextMiddleware - authorization header present');
      try {
        const [type, token] = req.headers.authorization.split(' ');
        if (type === 'Bearer' && token) {
          const payloadPart = token.split('.')[1];
          if (payloadPart) {
            const decoded = JSON.parse(Buffer.from(payloadPart, 'base64').toString('utf8'));
            console.log('TenantContextMiddleware - decoded JWT:', decoded);
            if (decoded && decoded.tenantId) {
              tenantId = decoded.tenantId;
            }
          }
        }
      } catch (err) {
        console.error('TenantContextMiddleware - error decoding JWT:', err);
        // Ignore parsing errors; AuthGuard will reject invalid signatures later
      }
    }

    console.log('TenantContextMiddleware - resolved tenantId:', tenantId);

    // 3. Execute downstream request pipeline inside the TenantContext storage container
    if (tenantId) {
      req.tenantId = tenantId;
      if (req.raw) {
        req.raw.tenantId = tenantId;
      }
      TenantContext.enterWith({ tenantId });
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
