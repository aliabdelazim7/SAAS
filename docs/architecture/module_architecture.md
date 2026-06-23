# Module Marketplace & Extensible Plugin Architecture

This document defines the architectural patterns for dynamically enabling/disabling modules, extending database schemas, registering plugin hooks, and validating module permissions against subscription tiers.

---

## 1. Modular Architecture Framework

The platform acts as a core registry that exposes micro-hooks. Each feature area (e.g., Inventory, POS, CRM, WhatsApp integration) is built as a self-contained NestJS module that implements the standard `SaaSModule` lifecycle interface.

```
┌────────────────────────────────────────────────────────┐
│                   Core SaaS Platform                   │
└───────┬───────────────────┬───────────────────┬────────┘
        │ Register          │ Initialize Hooks  │ Route Guard
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  CRM Module  │    │ POS Module   │    │ WhatsApp Mod │
├──────────────┤    ├──────────────┤    ├──────────────┤
│- UI Hooks    │    │- Barcode API │    │- Webhook Rec │
│- Schema Ext  │    │- Cash Drawers│    │- Message Q   │
└──────────────┘    └──────────────┘    └──────────────┘
```

### 1.1 Module Interface Definition
Every marketplace module exports a manifest file detailing metadata, dependencies, billing details, and installation hooks.

```typescript
export interface ModuleManifest {
  id: string;                      // unique key e.g., 'crm-premium'
  name: string;                    // display name
  version: string;
  minSubscriptionPlan: string;    // 'STARTER', 'BUSINESS', 'PROFESSIONAL', 'ENTERPRISE'
  dependencies: string[];          // list of required module IDs e.g. ['sales']
  onInstall: (tenantId: string) => Promise<void>;
  onUninstall: (tenantId: string) => Promise<void>;
}
```

---

## 2. Dynamic DB Schema Extension Pattern

To prevent dynamic migrations from breaking database stability across thousands of tenants, we use a hybrid approach to store module-specific variables and structures:

1. **Static Table Pre-allocation**:
   Modules that require large, relational tables (e.g., POS logs or Inventory line items) have their schema pre-allocated in the main PostgreSQL migrations. RLS guards access, and tables remain empty for tenants who have not activated the module.
2. **Dynamic Key-Value settings**:
   Small, module-specific configurations are stored in a dedicated key-value table:
   ```sql
   CREATE TABLE tenant_data.module_settings (
       id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
       tenant_id UUID NOT NULL REFERENCES core_platform.tenants(id) ON DELETE CASCADE,
       module_id VARCHAR(50) NOT NULL,
       settings_key VARCHAR(100) NOT NULL,
       settings_value TEXT NOT NULL, -- or JSONB
       CONSTRAINT unique_tenant_module_key UNIQUE(tenant_id, module_id, settings_key)
   );
   ```
3. **JSONB Custom Fields Extension**:
   Core transactional entities (Customers, Products, Invoices) include an `attributes` JSONB column. Modules write and query custom fields without executing database DDL alterations:
   - Example: The Tailoring Shop module adds `{ "measurements": { "shoulder": 45, "sleeve": 62 } }` to the `customers.attributes` column.

---

## 3. Module Gating Guard

To prevent API access to disabled modules, we enforce a NestJS Guard.

```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ModuleEnabledGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private db: DatabaseService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModule = this.reflector.get<string>('moduleName', context.getHandler());
    
    // If endpoint has no module designation, proceed
    if (!requiredModule) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId;

    // Check if the tenant has this module active (checking subscription tier rules)
    const isModuleActive = await this.checkModuleActivation(tenantId, requiredModule);

    if (!isModuleActive) {
      throw new ForbiddenException(
        `The module '${requiredModule}' is not activated. Please verify your subscription plan.`
      );
    }

    return true;
  }

  private async checkModuleActivation(tenantId: string, moduleName: string): Promise<boolean> {
    // 1. Query the tenant's current subscription details
    const activeSub = await this.db.tenantSubscription.findFirst({
      where: { tenantId, status: 'ACTIVE' },
      include: { plan: true },
    });

    if (!activeSub) return false;

    // 2. Plan configuration details contains enabled modules checklist
    // e.g. {"crm": true, "pos": true, "inventory": true}
    const features = activeSub.plan.features as Record<string, boolean>;
    
    return !!features[moduleName];
  }
}
```

---

## 4. Onboarding & Installation Lifecycles

When a Tenant Owner installs a module from the dashboard marketplace:

1. **Dependency check**: The backend validates that all dependency modules are active. For example, installing the `POS` module requires that the `Sales` and `Inventory` modules are already installed.
2. **Hook Trigger**: The plugin controller executes the module's `onInstall` hook:
   - Configures default database values (Chart of Accounts presets, Default Warehouse location).
   - Generates default custom roles (e.g., Cashier role on POS installation).
3. **Cache Invalidation**: The tenant's dynamic metadata cache in Redis is flushed, forcing the frontend UI to reload navigation links on the next heartbeat request.
4. **Billing Updates**: If the module is a paid add-on, the billing service triggers Stripe's subscription update API to add the item to the next billing invoice.
