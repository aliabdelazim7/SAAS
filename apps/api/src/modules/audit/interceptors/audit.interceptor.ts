import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TenantContext } from '@crm/database';
import { AuditService } from '../audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, ip, headers } = request;

    // Intercept mutating operations only (POST, PUT, PATCH, DELETE)
    const shouldLog = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    if (!shouldLog) {
      return next.handle();
    }

    const user = request.user; // Populated by AuthGuard
    const tenantId = request.tenantId || request.raw?.tenantId || TenantContext.getTenantId() || user?.tenantId;

    if (tenantId) {
      request.tenantId = tenantId;
      if (request.raw) {
        request.raw.tenantId = tenantId;
      }
      TenantContext.enterWith({ tenantId });
    }
    const ipAddress = ip || request.headers['x-forwarded-for'] || '127.0.0.1';
    const userAgent = headers['user-agent'] || 'unknown';

    const action = this.deriveActionName(method, url);

    return next.handle().pipe(
      tap(async () => {
        if (tenantId && user) {
          // Fire-and-forget execution to avoid delaying the client HTTP response
          this.auditService
            .logAction({
              tenantId,
              userId: user.userId,
              action,
              details: `Request: ${method} ${url}`,
              newValue: body,
              ipAddress,
              userAgent,
            })
            .catch((err) => {
              console.error('Audit logging execution failed:', err);
            });
        }
      })
    );
  }

  private deriveActionName(method: string, url: string): string {
    const parts = url.split('/').filter((p) => p && p !== 'v1');
    const resource = parts[0]?.toUpperCase() || 'SYSTEM';
    const actionMapping: Record<string, string> = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };
    return `${resource}_${actionMapping[method] || 'ACTION'}`;
  }
}
