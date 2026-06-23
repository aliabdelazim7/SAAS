import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, TenantContext } from '@crm/database';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (err) {
      console.warn('WARNING: Prisma failed to connect to PostgreSQL database on boot. Database calls will fail, but the API server is active.');
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Returns a tenant-scoped Prisma client.
   * If a tenantId is set in the current execution context (via AsyncLocalStorage),
   * all queries are automatically wrapped in a transaction that sets the PostgreSQL
   * 'app.current_tenant_id' session variable, triggering Row-Level Security (RLS).
   * 
   * If no tenantId is in context, the request falls back to the bypass admin client.
   */
  get tenantClient() {
    const tenantId = TenantContext.getTenantId();
    if (!tenantId) {
      return this;
    }

    return this.$extends({
      query: {
        $allOperations: async ({ model, operation, args, query }) => {
          return this.$transaction(async (tx) => {
            // Inject tenant session variable into PG transaction context
            await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenantId}';`);
            return (query as any)(args);
          });
        },
      },
    }) as any;
  }
}
