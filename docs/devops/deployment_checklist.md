# Production Deployment Checklist

This document serves as the pre-launch deployment checklist. All checks must be signed off by their respective leads (Architect, Security, DevOps, Database, QA) before exposing the production environment to live tenants.

---

## 1. Cloud & Network Infrastructure Hardening

- [ ] **Multi-AZ VPC Isolation**: Verify public, private, and database subnets are isolated. EKS node clusters reside in private subnets; database RDS instances are strictly in isolated DB subnets with no public IP allocation.
- [ ] **NAT Gateways**: NAT gateways are configured across at least two Availability Zones to guarantee outbound internet access redundancy.
- [ ] **AWS security groups**:
  - `Database Security Group` only allows ingress traffic from the `EKS cluster SG` on port `5432`.
  - `EKS Node SG` only accepts requests from the `ALB (Application Load Balancer) SG` on HTTP/HTTPS ports.
- [ ] **SSL / TLS Certificate Binding**: Let's Encrypt or AWS Certificate Manager (ACM) wildcards bind to `*.platform.com` and `platform.com`. Enforce TLS 1.3 only; disable TLS 1.0 and 1.1 ciphers.
- [ ] **Dynamic Subdomain Routing**: Cloudflare DNS rules configure wildcard CNAME: `*.platform.com -> ingress.platform.com` to support automatic tenant subdomains.

---

## 2. Database & Connection Management Validation

- [ ] **PgBouncer Connection Pooling**: Transaction pooling is active. Execute load test verifying that 5,000 parallel client HTTP requests consume no more than 40 active database connections on the PostgreSQL backend.
- [ ] **Prisma RLS Verification**: Execute audit scripts confirming that executing a select query without assigning a session tenant ID variable returns 0 rows due to Row-Level Security policies.
- [ ] **Auto-migrations Pipeline**: Validate that the deployment runner executes database migrations (`prisma migrate deploy`) during the build phase before rolling updates are deployed to the pods.
- [ ] **Point-In-Time Recovery (PITR)**: Verify AWS Aurora continuous backups status is active. Run a test recovery restoration restoring data to a specific minute from the previous day.
- [ ] **Chronological Partitioning**: Verify `pg_partman` partition generator schedules are registered and active.

---

## 3. Application Configuration & Variable Setup

- [ ] **Node Environment flags**: Confirm all EKS deployments contain env variable `NODE_ENV=production`.
- [ ] **Next.js Standalone build**: Verify frontend image uses standalone node outputs, reducing container size to under 120MB.
- [ ] **External API Key Encryption**: Confirm all secret keys (Stripe secrets, SendGrid templates, Twilio tokens, Sentry DSNs) are retrieved from AWS Secrets Manager rather than stored in plain text environment files.
- [ ] **CORS Configuration**: Verify CORS settings on the API container restrict origins to the main domain and authenticated wildcard subdomains:
  - Allowed: `https://*.platform.com`, `https://platform.com`.
  - Rejected: all other origins.
- [ ] **SMTP / SMS / WhatsApp Channels**: Check template identifiers match active production configurations; run test sign-up verifying OTP arrives in under 10 seconds.

---

## 4. Security & Compliance Verification

- [ ] **Penetration Test Execution**: Run vulnerability scanners (e.g., OWASP ZAP) against all endpoints. Fix all critical and high-priority security issues.
- [ ] **Headers check**: Verify security headers are returned in API requests:
  - `Content-Security-Policy`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Strict-Transport-Security`
- [ ] **Rate Limiting Check**: Run automated script sending 500 requests per minute from a single IP to public login endpoints; verify system responds with `429 Too Many Requests`.
- [ ] **Audit Logs Test**: Perform 10 state changes (create user, delete product, update invoice) and verify that the `audit_logs` table records correct IP, User Agent, Tenant ID, and JSONB diff values.

---

## 5. Operations & Monitoring System Setup

- [ ] **Sentry integration**: Verify error events successfully log from Web, Mobile, and API modules to their respective Sentry dashboards.
- [ ] **Alerting Thresholds**: Grafana rules set up alerts to dispatch PagerDuty notifications when:
  - Container CPU or Memory usage exceeds 85% for more than 5 minutes.
  - API HTTP `5xx` error rate exceeds 2% of total traffic.
  - Database disk queue depth increases beyond threshold limits.
- [ ] **Kube-state-metrics**: Pod deployment charts are active on Prometheus, capturing restarts and node statuses.
