# Subscription Billing & Gating Engine

This document defines the SaaS monetization architecture, billing cycle synchronization, usage metrics logging, and module gating systems.

---

## 1. Plan Structure & Pricing Mapping

We integrate Stripe as our primary billing processor. Subscriptions map directly to Stripe Product and Price IDs configured across monthly and yearly frequencies.

### Pricing Tiers Definition

| Plan Tier | Price Monthly | Price Yearly | Max Users | Max Warehouses | Max Products | Included Modules |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Starter** | \$29 / mo | \$290 / yr | 3 | 1 | 500 | Customers, Products, Inventory, Sales, POS |
| **Business** | \$79 / mo | \$790 / yr | 10 | 3 | 5,000 | + Purchases, Suppliers, Finance, Expenses |
| **Professional**| \$199 / mo | \$1,990 / yr | 30 | 10 | 25,000 | + HR & Payroll, Projects, Tasks |
| **Enterprise** | Custom | Custom | Unlimited | Unlimited | Unlimited | Full Catalog + Manufacturing, Sync |

---

## 2. Feature Gating & Usage Enforcement

Access to features and limits is governed by a policy engine evaluated at both the UI layer (conditional components) and the API Gateway layer (guards).

### 2.1 Limit Gating Middleware
Before executing resource creation commands (e.g., creating a new product variant, adding a user, or creating a warehouse), the backend checks current database consumption against tier thresholds.

```typescript
import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class MaxProductsGuard implements CanActivate {
  constructor(private readonly db: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId;

    // 1. Fetch current plan limits
    const subscription = await this.db.tenantSubscription.findFirst({
      where: { tenantId, status: 'ACTIVE' },
      include: { plan: true },
    });

    if (!subscription) {
      throw new BadRequestException('Active subscription plan not found.');
    }

    const maxProductsLimit = subscription.plan.maxProducts;

    // 2. Query actual counts
    const currentProductCount = await this.db.productVariant.count({
      where: { tenantId },
    });

    // 3. Evaluate limits
    if (currentProductCount >= maxProductsLimit) {
      throw new BadRequestException(
        `Product limit reached (${maxProductsLimit}). Please upgrade your plan.`
      );
    }

    return true;
  }
}
```

---

## 3. Stripe Webhook Synchronization Engine

To maintain real-time subscription statuses without polling the Stripe API, the platform exposes a secure webhook endpoint: `/v1/billing/webhooks/stripe`.

```
 Stripe Payment Gateway                  API Webhook Router            PostgreSQL DB
          │                                      │                           │
          │─── checkout.session.completed ──────>│                           │
          │                                      │─── Verify Signature ─────>│
          │                                      │─── Update Tenant Status ─>│
          │                                      │    to ACTIVE              │
          │                                      │                           │
          │─── customer.subscription.updated ───>│                           │
          │                                      │─── Parse Plan & Dates ───>│
          │                                      │─── Update End Period ─────>│
          │                                      │                           │
          │─── customer.subscription.deleted ───>│                           │
          │                                      │─── Suspend Tenant ────────>│
          │                                      │    status = PAST_DUE      │
```

### 3.1 Webhook Verification & Handling
The webhook endpoint extracts the raw request buffer and verifies the payload signature using Stripe's endpoint signing secret.

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Request } from 'express';
import Stripe from 'stripe';

@Injectable()
export class StripeWebhookHandler {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

  async handleWebhook(rawBody: Buffer, signature: string) {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object as Stripe.Subscription;
        await this.syncTenantSubscription(sub);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await this.revokeTenantAccess(sub.id);
        break;
      }
    }
  }

  private async syncTenantSubscription(sub: Stripe.Subscription) {
    const tenantId = sub.metadata.tenantId;
    const planId = await this.resolvePlanIdFromPrice(sub.items.data[0].price.id);

    await this.db.tenantSubscription.upsert({
      where: { stripeSubscriptionId: sub.id },
      update: {
        status: this.mapStripeStatus(sub.status),
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        planId,
      },
      create: {
        tenantId,
        planId,
        stripeSubscriptionId: sub.id,
        status: this.mapStripeStatus(sub.status),
        billingCycle: sub.metadata.billingCycle,
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
      },
    });
  }
}
```

---

## 4. Upgrade / Downgrade Flows

* **Upgrades**:
  - Ex: Moving from *Starter* to *Business*.
  - Execution: Computed on a prorated basis via Stripe. Stripe returns the delta charge immediately. The webhook updates the database, granting immediate access to expanded features (e.g., unlocking the Finance module).
* **Downgrades**:
  - Ex: Moving from *Professional* to *Business*.
  - Restriction validation: If the user currently has 5 warehouses, but the target *Business* plan limits warehouses to 3, the backend rejects the downgrade at checkout:
    ```typescript
    if (activeWarehouseCount > targetPlanLimit) {
      throw new DowngradeConflictException("You must archive or delete warehouses before downgrading.");
    }
    ```
  - Grace Period: If successful, the new limits are enforced at the end of the current billing cycle.
