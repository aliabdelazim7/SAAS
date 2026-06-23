# Enterprise Role-Based Access Control (RBAC) Design

This document details the architecture, matrix definition, and implementation patterns for the Role-Based Access Control (RBAC) engine. The system supports system roles, fine-grained action permissions, and custom tenant roles.

---

## 1. Role & Permission Matrix

Permissions are structured as `{Module}:{Action}` tuples. Action verbs include: `VIEW`, `CREATE`, `EDIT`, `DELETE`, `EXPORT`, `APPROVE`, `PRINT`, `MANAGE`.

Below is the default platform permissions mapping:

| Role | CRM / Customers | Products & Variants | Inventory & Stock | Sales & POS | Purchases & Suppliers | HR & Payroll | Finance / Ledgers | Custom Roles |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Owner** | MANAGE | MANAGE | MANAGE | MANAGE | MANAGE | MANAGE | MANAGE | MANAGE |
| **Admin** | VIEW, CREATE, EDIT, EXPORT | VIEW, CREATE, EDIT, EXPORT | VIEW, CREATE, EDIT, EXPORT | VIEW, CREATE, EDIT, EXPORT | VIEW, CREATE, EDIT, EXPORT | VIEW, CREATE, EDIT | VIEW, CREATE, EDIT | VIEW, CREATE, EDIT |
| **Manager** | VIEW, CREATE, EDIT, EXPORT | VIEW, CREATE, EDIT | VIEW, CREATE, EDIT, APPROVE | VIEW, CREATE, EDIT, APPROVE | VIEW, CREATE, EDIT, APPROVE | VIEW | VIEW, CREATE | No Access |
| **Sales** | VIEW, CREATE, EDIT | VIEW | VIEW | VIEW, CREATE, EDIT, PRINT | No Access | No Access | No Access | No Access |
| **Cashier** | VIEW, CREATE | VIEW | No Access | VIEW, CREATE, PRINT (POS Only) | No Access | No Access | No Access | No Access |
| **Warehouse** | No Access | VIEW | VIEW, CREATE, EDIT (Transfers) | No Access | VIEW, CREATE (Receipts) | No Access | No Access | No Access |
| **Accountant** | VIEW | VIEW | VIEW | VIEW | VIEW | VIEW | VIEW, CREATE, EDIT, EXPORT | No Access |
| **Employee** | No Access | No Access | No Access | No Access | No Access | VIEW (Self details) | No Access | No Access |

*Note: `MANAGE` is a wildcard permission that grants all actions on that specific module.*

---

## 2. Dynamic Database Entity Schema

Custom roles can be created by Tenant Owners. The database structure links users, roles, and permissions dynamically (as defined in the DDL schema in the [Database Schema Design](file:///e:/CRM/CRM%20SAAS/docs/architecture/database_schema.md)):

* **`roles`**: Contains tenant roles, labeled by name with `is_custom = true` for user-defined configs.
* **`permissions`**: Static system definitions (e.g., `inventory:create`, `sales:approve`).
* **`role_permissions`**: Joins roles to actions.
* **`user_roles`**: Joins users to their assigned roles.

---

## 3. NestJS RBAC Guards & Middleware Enforcement

Access control checks are executed in NestJS using a custom decorator and a global guard.

### 3.1 Permission Decorator
```typescript
import { SetMetadata } from '@nestjs/common';

export interface RequiredPermission {
  module: string;
  action: string;
}

export const RequirePermission = (module: string, action: string) =>
  SetMetadata('permission', { module, action });
```

### 3.2 Permission Guard Implementation
The guard retrieves the permission requirements from the execution handler, fetches the authenticated user's permissions, and determines access eligibility.

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from './rbac.service';
import { RequiredPermission } from './permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RbacService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<RequiredPermission>(
      'permission',
      context.getHandler()
    );

    // If no permission metadata is set, the endpoint is open to authenticated users
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Set by AuthGuard
    const tenantId = request.tenantId; // Set by TenantMiddleware

    if (!user) {
      return false;
    }

    // Check permissions
    const hasPermission = await this.rbacService.userHasPermission(
      user.id,
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
```

---

## 4. Redis Permission Caching Strategy

Querying user roles, role joins, permission mappings, and custom policies from PostgreSQL on every API execution introduces significant query overhead and latency. To mitigate this, user permissions are cached in Redis.

```
                      ┌───────────────────────┐
                      │ API Request Evaluator │
                      └───────────┬───────────┘
                                  │
                  ┌───────────────┴───────────────┐
                  ▼                               ▼
        ┌──────────────────┐            ┌──────────────────┐
        │   Redis Cache    │            │  PostgreSQL DB   │
        │                  │            │                  │
        │ - Keys:          │            │ - User joins     │
        │  user:perms:{id} │            │ - Role joins     │
        │                  │            │ - Tenant policies│
        └────────┬─────────┘            └────────┬─────────┘
                 │                               │
                 │ Cache Hit                     │ Cache Miss
                 ▼                               ▼
       [Authorize / Reject]              [Query perms, write]
                                         [to Redis, evaluate]
```

### 4.1 Redis Caching Keys
* **Key Format**: `tenant:{tenantId}:user:{userId}:permissions`
* **Data Structure**: Redis Set containing permission strings (e.g., `["inventory:create", "sales:view", "sales:print"]`).
* **TTL**: 24 Hours.

### 4.2 Cache Invalidation Policy
Whenever a role's permissions are updated, or a user's role assignments change:
1. The RBAC backend identifies all users assigned to the affected role.
2. The backend sends a delete command to Redis for those user keys:
   ```typescript
   await this.redisClient.del(`tenant:${tenantId}:user:${userId}:permissions`);
   ```
3. On the next incoming API request, a cache miss occurs, forcing the system to query PostgreSQL, rebuild the permission cache array, write it to Redis, and evaluate access.
4. If a tenant is suspended, the global connection middleware sets a tenant-block key, blocking all authorization pipelines for the tenant immediately.
