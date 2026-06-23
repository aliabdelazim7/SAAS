# Risks & Mitigations Assessment

This document assesses the major security, scalability, business, operational, and compliance risks facing the SaaS ERP/CRM platform, outlining pre-emptive architectural and operational mitigation protocols.

---

## 1. Security Risks & Mitigations

### 1.1 Tenant Data Contamination (Data Leakage)
* **Risk**: A developer error in a SQL query (e.g., omitting the `WHERE tenant_id = x` clause) exposes private financial files or customer lists of Tenant A to Tenant B.
* **Impact**: Critical brand damage, lawsuits, contract breaches, and tenant churn.
* **Mitigation**:
  1. **PostgreSQL Row-Level Security (RLS)** is enabled on all tenant-scoped tables. RLS operates at the database engine level, intercepting queries and rejecting records that do not match the transaction's session variable `app.current_tenant_id`.
  2. **Automated Unit Testing**: The CI/CD pipeline runs multi-tenant integration test suites:
     ```typescript
     // Test tries to query Tenant B's customer using Tenant A's session token
     const response = await request(app)
       .get('/v1/customers/profiles/tenant-b-customer-uuid')
       .set('Authorization', `Bearer ${tenantAToken}`);
     expect(response.status).toBe(404); // Database must act as if the record does not exist
     ```

### 1.2 Brute Force Auth & Credential Stuffing
* **Risk**: Automated botnets perform credential stuffing or brute-force user passwords.
* **Impact**: User account hijack, unauthorized access to billing and customer profiles.
* **Mitigation**:
  1. Enforce **Rate Limiting** at the IP and email level using Redis token buckets: maximum of 5 failed login attempts per email in 15 minutes.
  2. Block IP addresses automatically for 24 hours if they trigger more than 50 invalid logins across different accounts.
  3. Support **Mandatory 2FA** for administrative and owner roles.

---

## 2. Scalability & Data Volume Risks

### 2.1 Write Bottlenecks on Primary Database
* **Risk**: During peak sales hours (e.g., Black Friday), thousands of retail shops and POS systems simultaneously commit sales transactions, causing database connection exhaustion and write locks.
* **Impact**: POS terminals freeze, failed sales, customer frustration.
* **Mitigation**:
  1. **Command-Query Responsibility Segregation (CQRS)**: Write queries are separated from read reports.
  2. **Read-Replica Routing**: Query operations (e.g., listing product directories, searching customer histories, compiling monthly sales charts) are routed to AWS Aurora Read Replicas, leaving the Primary Writer DB free to handle incoming sales transactions.
  3. **Queue-Buffered Writes (Asynchronous Posting)**: Non-critical transaction ledger logs are pushed to a Redis BullMQ queue, written to the database asynchronously by worker nodes rather than blocking the checkout API response.

### 2.2 Audit Trail Table Bloat
* **Risk**: Tracking every single action (e.g., user login, product view, stock check) creates millions of rows weekly, bloating database indexes and slowing down all transaction queries.
* **Impact**: Overall database degradation, increased server storage bills.
* **Mitigation**:
  1. **Range Partitioning**: Partition the `audit_logs` table by month.
  2. **Data Offloading**: A weekly cron job automatically exports audit logs older than 90 days to Amazon S3 Glacier as compressed CSV files, purging them from the live PostgreSQL instance.

---

## 3. Business, Compliance & Operational Risks

### 3.1 Local Tax Compliance Violations (e.g., ZATCA, GST, VAT)
* **Risk**: The SaaS platform fails to adhere to local billing laws (e.g., missing mandatory QR codes, invalid PDF structures, or failing to report tax lines).
* **Impact**: Fines by national tax authorities, tenant churn, and legal bans.
* **Mitigation**:
  1. Implement **localization-specific validation schemas**. If the tenant is registered in Saudi Arabia, the invoice module enforces cryptographic signature generation and ZATCA Phase 2 XML compliance.
  2. Partner with regional accounting advisors to review tax engine logic updates every quarter.

### 3.2 Offline Transaction Fraud
* **Risk**: While operating in mobile Offline Mode, a cashier modifies prices locally in the SQLite database to process unauthorized discounts.
* **Impact**: Direct financial loss for the business owner.
* **Mitigation**:
  1. **Price Validation on Sync**: When the mobile client synchronizes offline sales with the backend, the API validates the price of each item against the product master catalog.
  2. **Discrepancy Flags**: Any sales record containing a custom price or unauthorized discount is flagged. The sync engine completes the order (to avoid breaking customer checkouts) but triggers an immediate "Price Discrepancy" alert to the Store Owner's dashboard.
