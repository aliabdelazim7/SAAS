# Security Architecture Design

This document details the security layers, encryption protocols, access controls, audit trail configurations, and data integrity safeguards designed to protect the multi-tenant SaaS application.

---

## 1. Authentication & Token Management

The system enforces a split-token architecture using short-lived Access Tokens and long-lived Refresh Tokens.

```
 Client App                        API Gate / Auth Server                 Database / Redis
     │                                       │                                   │
     │─── User Credentials + 2FA OTP ───────>│                                   │
     │                                       │─── Verify password & OTP ────────>│
     │                                       │─── Generate tokens ──────────────>│
     │                                       │─── Cache Refresh Token ──────────>│
     │                                       │    in Redis (TTL 7 days)          │
     │<── Access Token (JWT, TTL 15m) ───────│                                   │
     │    Set-Cookie: Refresh Token ─────────│                                   │
     │    (HttpOnly, SameSite=Strict)        │                                   │
```

1. **Access Token**:
   - *Format*: JSON Web Token (JWT) signed using RS256 (asymmetric cryptography).
   - *Lifetime*: 15 minutes.
   - *Storage (Client)*: Memory only (not stored in localStorage to prevent XSS exfiltration).
2. **Refresh Token**:
   - *Format*: Random cryptographically secure 64-character hash.
   - *Lifetime*: 7 days (sliding window).
   - *Storage (Client)*: Encrypted `HttpOnly`, `Secure`, `SameSite=Strict` cookie to block CSRF and XSS access.
   - *Storage (Server)*: Cached in Redis linked to the user and device fingerprint to support immediate remote logout capabilities:
     `Key: auth:refresh_token:<token_hash> -> Value: { userId, tenantId, userAgent, ip }`

---

## 2. Two-Factor Authentication (2FA)

Users can enable 2FA on their profiles.
* **Mechanism**: Time-based One-Time Password (TOTP) based on **RFC 6238**.
* **Setup Flow**:
  1. The API generates a cryptographically secure random base32 secret.
  2. Creates a Google Authenticator compatible provisioning URL: `otpauth://totp/ERP:{email}?secret={secret}&issuer=ERPPlatform`.
  3. Renders a QR code in the browser.
  4. The user inputs their first code. The backend verifies it using `otplib` and saves the secret encrypted with AES-256-GCM in the user's database record.
* **Enforcement Guard**: When 2FA is active, initial login returns a temporary token (`JWT_2FA_PENDING`). All API endpoints (except `/auth/verify-2fa`) reject requests with a `403 Authenticate 2FA` code.

---

## 3. Data Encryption Architecture

### 3.1 Encryption in Transit
- **Enforcement**: TLS 1.3 is enforced at the Cloudflare CDN / NGINX layer.
- **Settings**: Weak ciphers (RC4, 3DES) are disabled. Strict Transport Security (HSTS) headers are set on all domains.
  ```http
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
  ```

### 3.2 Encryption at Rest
- **Database Layer**: Transparent Data Encryption (TDE) using AWS KMS managed keys is enabled on the RDS Aurora PostgreSQL instances.
- **Application Layer Field Encryption**: Sensitive data (such as API tokens, payment integrations secrets, and national ID cards) is encrypted before being stored in the database.
- **Implementation**: AES-256-GCM with a dynamic initialization vector (IV) prepended to the ciphertext.
  ```typescript
  import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

  const ALGORITHM = 'aes-256-gcm';
  const KEY = Buffer.from(process.env.ENCRYPTION_KEY_32_BYTE, 'utf-8');

  export function encrypt(text: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }
  ```

---

## 4. Comprehensive Audit & Activity Logging

To maintain security compliance, every state-mutating request executes an audit trail trigger captured via a NestJS Interceptor.

* **Audit Fields Capture**:
  - `tenant_id`, `user_id`, `action` (e.g., `PRODUCT_DELETE`, `INVOICE_CREATE`, `USER_SUSPEND`).
  - `ip_address` (resolved via `X-Forwarded-For`).
  - `user_agent` (parsed for browser, OS, and device type).
  - `old_value`, `new_value` (JSONB diffs showing changes made to columns).
* **Storage Optimization**: Written to partitioned tables asynchronously (dispatched via a queue to minimize API request blocking time).

---

## 5. Session Management & IP Monitoring

* **Concurrent Session Limits**: Configurable by Tenant Owners. Default settings limit active sessions to 3 concurrent devices per user.
* **Anomaly Detection**:
  - A background process analyzes IP addresses.
  - If a user session is accessed from IP A and then from IP B (different country) within 1 hour (Impossible Travel Detection), the system instantly invalidates all sessions, blocks the user, and sends a warning email:
    ```typescript
    await this.redisClient.del(`auth:refresh_token:${userRefreshTokenKey}`);
    await this.db.user.update({ where: { id }, data: { status: 'BLOCKED' } });
    ```

---

## 6. OWASP Mitigation Standards

1. **SQL Injection (SQLi)**: Prevented by Prisma ORM which compiles all queries to parameterized statements. Raw queries are banned except for specific RLS configurations, where values are explicitly escaped using `$executeRaw` or typecast constraints.
2. **Cross-Site Scripting (XSS)**:
   - Next.js sanitizes React expressions by default.
   - Content Security Policy (CSP) header is configured:
     ```http
     Content-Security-Policy: default-src 'self'; script-src 'self' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
     ```
3. **Cross-Site Request Forgery (CSRF)**: Blocked by using `SameSite=Strict` cookies for the refresh token and validating CORS origins.
4. **Security Headers**: API gateway returns key OWASP headers:
   ```http
   X-Frame-Options: DENY
   X-Content-Type-Options: nosniff
   Referrer-Policy: strict-origin-when-cross-origin
   ```
