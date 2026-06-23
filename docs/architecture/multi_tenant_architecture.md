# Multi-Tenant Architecture Blueprint

This document defines the architectural strategy for tenant isolation, data security, and dynamic tenant routing. To support thousands of tenants while keeping infrastructure overhead low, the platform employs a **Hybrid Multi-Tenant Model**.

---

## 1. Database Multi-Tenancy Strategy

The platform supports two deployment models based on the tenant's tier and volume:

```
                  ┌────────────────────────────────────────┐
                  │          API Gateway Router            │
                  └──────────────────┬─────────────────────┘
                                     │
                     ┌───────────────┴───────────────┐
                     ▼                               ▼
        ┌─────────────────────────┐     ┌─────────────────────────┐
        │  Standard Tenants DB    │     │  Enterprise Tenant DB   │
        │  (Shared DB/Schema)     │     │  (Dedicated DB/Schema)  │
        ├─────────────────────────┤     ├─────────────────────────┤
        │  - Tenant A (RLS Active)│     │  - Tenant C             │
        │  - Tenant B (RLS Active)│     │                         │
        └─────────────────────────┘     └─────────────────────────┘
```

1. **Shared Database & Shared Schema (Default/Standard)**:
   - *Target*: Starter, Business, and Professional tiers.
   - *Architecture*: All tenant data resides in the same PostgreSQL database. Tenant isolation is strictly enforced at the database layer using **PostgreSQL Row-Level Security (RLS)**.
   - *Pros*: Minimal resource usage, simplified migration execution, unified database upgrades, low maintenance costs.
2. **Dedicated Database (Enterprise Option)**:
   - *Target*: High-volume enterprise customers with strict regulatory requirements (HIPAA, GDPR, local financial data laws) or custom integrations.
   - *Architecture*: Data is isolated in a separate PostgreSQL database instance. The API gateway dynamically routes requests based on tenant metadata.

---

## 2. Row-Level Security (RLS) Implementation

To guarantee database-level isolation and prevent developer error (such as forgetting a `WHERE tenant_id = x` clause), PostgreSQL native Row-Level Security is configured on every tenant-scoped table.

### 2.1 Database Schema Initialization
Every table that contains tenant-scoped data must include a `tenant_id` column linked via a foreign key to the `tenants` table.

```sql
-- Step 1: Enable RLS on target table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Step 2: Define the security policy
CREATE POLICY customer_tenant_isolation ON customers
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
```

### 2.2 How the Context Session Variable Works
1. Every time a connection is retrieved from the pool to process a request, the API backend issues a session-scoped configuration command.
2. This sets the transaction parameter `app.current_tenant_id` to the request's tenant ID.
3. PostgreSQL automatically restricts all queries (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) executed within that transaction context to matching `tenant_id` rows.

---

## 3. NestJS Backend Context & Middleware Integration

In NestJS, dynamic tenant identification is handled at the entry point using a custom middleware that inspects request headers/subdomains, sets up the request-scoped execution context, and configures the database connection.

### 3.1 Tenant Extraction Middleware
```typescript
import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly db: DatabaseService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const host = req.headers.host || '';
    let tenantId: string | null = null;

    // 1. Extract from custom header (typically for mobile or API integrations)
    if (req.headers['x-tenant-id']) {
      tenantId = req.headers['x-tenant-id'] as string;
    } else {
      // 2. Extract from subdomain (e.g., tenant-a.saas-platform.com)
      const subdomain = this.extractSubdomain(host);
      if (subdomain && subdomain !== 'app' && subdomain !== 'www') {
        const tenant = await this.db.tenant.findUnique({
          where: { subdomain },
          select: { id: true },
        });
        if (tenant) tenantId = tenant.id;
      }
    }

    if (!tenantId) {
      throw new UnauthorizedException('Missing or invalid Tenant context.');
    }

    // Attach tenantId to request object for downstream controllers and interceptors
    req['tenantId'] = tenantId;
    next();
  }

  private extractSubdomain(host: string): string | null {
    const parts = host.split('.');
    return parts.length > 2 ? parts[0] : null;
  }
}
```

### 3.2 Prisma RLS Transaction Interceptor
To make RLS automatic inside Prisma ORM without repeating boilerplate code, we use Prisma Middleware or extensions to set the current tenant transaction variable before query execution:

```typescript
import { PrismaClient } from '@prisma/client';

export const rlsExtension = (tenantId: string) => {
  return PrismaClient.$extends({
    query: {
      $allOperations({ model, operation, args, query }) {
        return prisma.$transaction(async (tx) => {
          // Set the tenant ID context in the PG transaction session
          await tx.$executeRawUnsafe(
            `SET LOCAL app.current_tenant_id = '${tenantId}';`
          );
          return query(args);
        });
      },
    },
  });
};
```

---

## 4. Connection Pooling & Database Management

Running multi-tenancy at scale requires careful connection management.

### 4.1 Connection Pool Optimization
* **PgBouncer Deployment**: Place a PgBouncer layer between the NestJS app servers and PostgreSQL. Set PgBouncer to **Transaction Pooling mode**.
  - *Rationale*: Transaction pooling allows hundreds of backend node processes to share a small pool of database connections, as connections are released back to the pool the instant a transaction completes (rather than waiting for the HTTP request to end).
* **Pool Sizing Formula**:
  $$\text{Max Connections} = (\text{DB CPU Cores} \times 2) + \text{Spindle Count}$$
  For an Aurora Serverless v2 instance with 16 vCPUs, we configure PgBouncer max connections to 64.

### 4.2 Scaling Strategy: Moving to Dedicated DBs
As a tenant grows from a small shop to a large warehouse with millions of rows, their database queries could impact other tenants sharing the database. The system provides a seamless migration path:

1. **Lock Tenant**: Flag `status = 'MAINTENANCE'` in the global routing table. This rejects all incoming writes with a HTTP `503 Service Temporarily Unavailable` page.
2. **Database Backup (pg_dump)**: Extract the tenant data using a filtered schema dump matching their `tenant_id`.
   ```bash
   pg_dump -h shared-db -U postgres -d platform_db \
     -t customers -t products -t invoices \
     --where="tenant_id='<tenant-uuid>'" -f tenant_backup.sql
   ```
3. **Restore**: Restore the dump into a dedicated PostgreSQL database instance.
4. **Update Routing Metadata**: Update the global tenant registry:
   - `database_url` points to the new dedicated RDS instance.
   - `isolation_type` is changed from `SHARED_RLS` to `DEDICATED_DB`.
5. **Unlock Tenant**: Reset `status = 'ACTIVE'`.
6. **Data Purge**: Delete historical tenant data from the shared database asynchronously during off-peak hours.
