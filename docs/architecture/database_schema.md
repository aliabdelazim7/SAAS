# Database Schema Design & Optimizations

This document details the production-grade PostgreSQL database schema designed for multi-tenancy, high-throughput writes, and optimized query paths.

---

## 1. Relational Database Schema (DDL)

To enforce clean transactional integrity, the system schema is divided into two logical logical scopes: **Global/Control Plan Schema** (tenant registry, pricing plans, subscriptions) and **Tenant Data Schema** (customers, products, invoices, audit logs). In a single shared database structure, these are separated using namespaces (schemas).

```sql
-- Create custom schemas
CREATE SCHEMA IF NOT EXISTS core_platform;
CREATE SCHEMA IF NOT EXISTS tenant_data;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 1.1 Core Platform Tables (Global)

#### Tenants Table
```sql
CREATE TABLE core_platform.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(63) UNIQUE NOT NULL,
    custom_domain VARCHAR(255) UNIQUE,
    industry_type VARCHAR(50) NOT NULL, -- e.g., 'RETAIL', 'RESTAURANT', 'GARAGE'
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'SUSPENDED', 'MAINTENANCE'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### Subscription Plans Table
```sql
CREATE TABLE core_platform.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL, -- 'STARTER', 'BUSINESS', 'PROFESSIONAL', 'ENTERPRISE'
    price_monthly NUMERIC(10, 2) NOT NULL,
    price_yearly NUMERIC(10, 2) NOT NULL,
    stripe_price_id_monthly VARCHAR(100),
    stripe_price_id_yearly VARCHAR(100),
    max_users INT NOT NULL,
    max_warehouses INT NOT NULL,
    max_products INT NOT NULL,
    features JSONB NOT NULL, -- list of modules e.g., {"crm": true, "pos": true, "inventory": true}
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### Tenant Subscriptions Table
```sql
CREATE TABLE core_platform.tenant_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES core_platform.tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES core_platform.subscription_plans(id),
    stripe_subscription_id VARCHAR(100) UNIQUE,
    status VARCHAR(30) NOT NULL, -- 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED'
    billing_cycle VARCHAR(10) NOT NULL, -- 'MONTHLY', 'YEARLY'
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

### 1.2 Tenant Data Tables (Isolated via RLS)

These tables reside in `tenant_data` and all utilize the `tenant_id` column.

#### Users Table
```sql
CREATE TABLE tenant_data.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES core_platform.tenants(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    two_factor_secret VARCHAR(255),
    is_two_factor_enabled BOOLEAN DEFAULT FALSE,
    phone_number VARCHAR(30),
    is_email_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'SUSPENDED', 'INVITED'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### Roles & Permissions Tables
```sql
CREATE TABLE tenant_data.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES core_platform.tenants(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL, -- 'OWNER', 'CASHIER', 'WAREHOUSE_MANAGER', etc.
    description VARCHAR(255),
    is_custom BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tenant_role UNIQUE(tenant_id, name)
);

CREATE TABLE tenant_data.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module VARCHAR(50) NOT NULL, -- 'INVENTORY', 'SALES', 'CRM', etc.
    action VARCHAR(50) NOT NULL, -- 'CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT'
    description VARCHAR(255),
    CONSTRAINT unique_permission UNIQUE(module, action)
);

CREATE TABLE tenant_data.role_permissions (
    role_id UUID NOT NULL REFERENCES tenant_data.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES tenant_data.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE tenant_data.user_roles (
    user_id UUID NOT NULL REFERENCES tenant_data.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES tenant_data.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);
```

#### Customers Table
```sql
CREATE TABLE tenant_data.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES core_platform.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(30),
    tax_number VARCHAR(50),
    credit_limit NUMERIC(12, 2) DEFAULT 0.00,
    outstanding_balance NUMERIC(12, 2) DEFAULT 0.00,
    shipping_address TEXT,
    billing_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### Products & Variants Tables
```sql
CREATE TABLE tenant_data.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES core_platform.tenants(id) ON DELETE CASCADE,
    category_id UUID, -- self-referential or flat category structure
    brand VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_variant_parent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tenant_data.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES core_platform.tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES tenant_data.products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(100),
    price NUMERIC(12, 2) NOT NULL,
    cost_price NUMERIC(12, 2) NOT NULL,
    attributes JSONB NOT NULL, -- e.g., {"color": "Red", "size": "XL"}
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

#### Warehouses & Stock Tables
```sql
CREATE TABLE tenant_data.warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES core_platform.tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tenant_data.inventory_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES core_platform.tenants(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES tenant_data.warehouses(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES tenant_data.product_variants(id) ON DELETE CASCADE,
    quantity NUMERIC(12, 3) NOT NULL DEFAULT 0.000,
    reserved_quantity NUMERIC(12, 3) NOT NULL DEFAULT 0.000, -- for active unpaid sales orders
    reorder_level NUMERIC(12, 3) DEFAULT 10.000,
    CONSTRAINT unique_warehouse_variant UNIQUE(warehouse_id, variant_id)
);
```

#### Invoices & Transaction Tables
```sql
CREATE TABLE tenant_data.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES core_platform.tenants(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES tenant_data.customers(id) ON DELETE SET NULL,
    invoice_number VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL, -- 'DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'VOID'
    sub_total NUMERIC(12, 2) NOT NULL,
    tax_total NUMERIC(12, 2) NOT NULL,
    discount_total NUMERIC(12, 2) DEFAULT 0.00,
    grand_total NUMERIC(12, 2) NOT NULL,
    notes TEXT,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tenant_invoice UNIQUE(tenant_id, invoice_number)
);

CREATE TABLE tenant_data.invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES core_platform.tenants(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES tenant_data.invoices(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES tenant_data.product_variants(id),
    quantity NUMERIC(12, 3) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    tax_rate NUMERIC(5, 2) DEFAULT 15.00,
    tax_amount NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL
);
```

#### Financial Ledgers & Audit Logs
```sql
CREATE TABLE tenant_data.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES core_platform.tenants(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'RENT', 'UTILITIES', 'SALARIES', etc.
    description TEXT,
    expense_date DATE NOT NULL,
    receipt_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tenant_data.audit_logs (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES core_platform.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES tenant_data.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- 'PRODUCT_CREATE', 'INVOICE_DELETE', etc.
    details TEXT,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45) NOT NULL,
    user_agent VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);
```

---

## 2. Indexing Strategy

To speed up lookups in a shared database, indexes are created to optimize filtering by tenant and secondary dimensions.

### 2.1 Tenant Scoping Composite Indexes
Since almost every query starts with `WHERE tenant_id = ?`, all primary lookup indexes are composite, placing `tenant_id` first.

```sql
-- Indexes for customer lookups
CREATE INDEX idx_customers_tenant_phone ON tenant_data.customers(tenant_id, phone);
CREATE INDEX idx_customers_tenant_name ON tenant_data.customers(tenant_id, name);

-- Indexes for product and SKU lookups
CREATE INDEX idx_variants_tenant_sku ON tenant_data.product_variants(tenant_id, sku);
CREATE INDEX idx_variants_tenant_barcode ON tenant_data.product_variants(tenant_id, barcode);

-- Indexes for balance checking
CREATE INDEX idx_balances_tenant_warehouse_variant 
ON tenant_data.inventory_balances(tenant_id, warehouse_id, variant_id);

-- GIN index for quick JSONB attribute searching in variants
CREATE INDEX idx_variants_attributes_gin ON tenant_data.product_variants USING gin (attributes);
```

---

## 3. Database Partitioning & Archival

The `audit_logs` and `invoice_items` tables will eventually contain millions of rows. Left unpartitioned, index size increases beyond RAM limits, degrading query performance.

### 3.1 Time-based Range Partitioning for Audit Logs
We partition the `audit_logs` table dynamically by the `created_at` field:

```sql
-- Define range partitions
CREATE TABLE tenant_data.audit_logs_y2026m06 PARTITION OF tenant_data.audit_logs
    FOR VALUES FROM ('2026-06-01 00:00:00+00') TO ('2026-07-01 00:00:00+00');

CREATE TABLE tenant_data.audit_logs_y2026m07 PARTITION OF tenant_data.audit_logs
    FOR VALUES FROM ('2026-07-01 00:00:00+00') TO ('2026-08-01 00:00:00+00');
```

* **Automation**: We deploy `pg_partman` via a cron job running on the RDS cluster to automatically spin up the next partition month and archive partitions older than 18 months to compressed cold storage (AWS S3 Glacier).

---

## 4. Query Performance Optimizations

1. **Covering Indexes**:
   Index definitions are designed to include commonly selected columns using the `INCLUDE` keyword to support index-only scans, avoiding heap access.
   ```sql
   CREATE INDEX idx_invoices_cover ON tenant_data.invoices(tenant_id, issue_date) 
   INCLUDE (grand_total, status);
   ```
2. **Materialized Views for Reporting**:
   Tenant reports (Sales by Brand/Category) are computed periodically using PostgreSQL materialized views. A refresh cron job runs every 2 hours:
   ```sql
   REFRESH MATERIALIZED VIEW CONCURRENTLY tenant_data.mv_sales_reporting_summary;
   ```
3. **Database Tuning Parameters**:
   - `shared_buffers`: Set to 25% of system RAM.
   - `work_mem`: Set to 64MB (avoids sorting on disk for complex reports).
   - `maintenance_work_mem`: Set to 512MB (improves index creation and VACUUM performance).
