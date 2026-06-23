# SaaS Monetization & Financial Metrics Strategy

This document details the pricing structures, subscription mechanics, value-added monetization streams, and key performance metric (KPI) equations used to monitor the financial health of the SaaS platform.

---

## 1. Multi-Dimensional Revenue Model

To build a resilient commercial SaaS company, we avoid relying solely on subscription fees. The platform uses a hybrid pricing model:

```
                            ┌────────────────────────┐
                            │  Total Platform Revenue│
                            └───────────┬────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
  ┌───────────────────┐        ┌───────────────────┐        ┌───────────────────┐
  │ Subscription Fees │        │ Payment processing│        │  Usage Add-ons    │
  │ (Core Tiers)      │        │ Transaction Fees  │        │  (Surcharges)     │
  ├───────────────────┤        ├───────────────────┤        ├───────────────────┤
  │ - Starter         │        │ - 0.5% surcharge  │        │ - WhatsApp packs  │
  │ - Business        │        │   on external POS │        │ - Extra S3 storage│
  │ - Professional    │        │   gateways        │        │ - Custom API      │
  │ - Enterprise      │        │ - Built-in tap-to-│        │   access keys     │
  │                   │        │   phone solutions │        │                   │
  └───────────────────┘        └───────────────────┘        └───────────────────┘
```

1. **SaaS Subscriptions (Tiered Access)**:
   - *Starter ($29/mo)*, *Business ($79/mo)*, *Professional ($199/mo)*, and *Enterprise (Custom/Volume)*.
2. **Payment Processing & POS Surcharges (FinTech Monetization)**:
   - The platform integrates directly with local card processing channels.
   - For standard card payments, we charge a flat fee of **$0.10 + 0.5%** on top of the gateway transaction fee.
   - For high-volume POS clients, this transaction-fee margin generates stable cash flows that grow with tenant sales volumes.
3. **Usage-Based Add-ons (Utility Surcharges)**:
   - *WhatsApp Notifications*: $10 package per 1,000 automated template notifications (order receipts, invoice links, payment alerts).
   - *Extra Warehouses / Storage*: $15 per additional warehouse location; $5 per 10GB S3 object storage space.
   - *Custom APIs*: Enterprise API access keys billed at $99/mo for ERP data synchronizations with external Shopify/Salla shops.

---

## 2. SaaS Metrics Definitions & Mathematical Equations

To monitor financial performance, the global administration dashboard collects, aggregates, and calculates the following key business metrics:

### 2.1 Monthly Recurring Revenue (MRR)
MRR represents the predictable recurring revenue components normalized to a monthly cycle.

$$\text{MRR} = \sum_{i=1}^{n} \text{Active Subscription Price}_i$$

*If a user signs up for an annual plan ($790/yr), their contribution to MRR is calculated as: $790 / 12 = \$65.83/mo$.*

### 2.2 Customer Acquisition Cost (CAC)
CAC measures the total sales and marketing spend required to acquire a single paying tenant.

$$\text{CAC} = \frac{\text{Total Marketing & Sales Spend (within period)}}{\text{Number of New Paying Tenants acquired (within period)}}$$

### 2.3 Churn Rate (Customer Churn)
Churn measures the percentage of tenants who cancel or downgrade their subscriptions within a given month.

$$\text{Churn Rate} = \frac{\text{Tenants Canceled (within month)}}{\text{Total Active Tenants (at start of month)}} \times 100$$

### 2.4 Average Revenue Per User/Tenant (ARPU)
ARPU calculates the average total monthly income (subscriptions + transaction margins + add-ons) generated per active tenant.

$$\text{ARPU} = \frac{\text{Total Platform Revenue (in month)}}{\text{Total Active Tenants (in month)}}$$

### 2.5 Customer Lifetime Value (LTV)
LTV projects the total revenue a tenant will generate before churning from the platform.

$$\text{LTV} = \frac{\text{ARPU}}{\text{Churn Rate}}$$

### 2.6 Financial Health Index (LTV to CAC Ratio)
This ratio measures customer acquisition unit economics. An elite SaaS company maintains:

$$\frac{\text{LTV}}{\text{CAC}} \ge 3$$

---

## 3. Database Analytical Views (SQL)

To aggregate these metrics efficiently without scanning millions of transaction lines on every dashboard load, we deploy a materialized view:

```sql
CREATE MATERIALIZED VIEW core_platform.mv_financial_metrics_summary AS
SELECT
    COUNT(DISTINCT ts.tenant_id) as active_tenants,
    SUM(
      CASE 
        WHEN ts.billing_cycle = 'YEARLY' THEN sp.price_yearly / 12.0
        ELSE sp.price_monthly
      END
    ) as total_subscription_mrr,
    COALESCE(AVG(sp.price_monthly), 0) as average_arpu
FROM core_platform.tenant_subscriptions ts
JOIN core_platform.subscription_plans sp ON ts.plan_id = sp.id
WHERE ts.status = 'ACTIVE'
WITH NO DATA;

-- Refresh rule run nightly
CREATE UNIQUE INDEX idx_mv_financial_metrics_ref ON core_platform.mv_financial_metrics_summary(active_tenants);
```
This summary is queryable in milliseconds to load graphs for company leadership.
