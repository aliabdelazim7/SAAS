# API Architecture & Sync Blueprint

This document specifies the design guidelines, authentication mechanisms, sync protocols, rate limits, and idempotency guarantees for the REST and GraphQL APIs.

---

## 1. Architectural Strategy

The platform exposes two API endpoints:
1. **REST API**: Used for core CRUD actions, standard forms, mobile uploads, integration webhooks, and the high-speed POS system. REST endpoints are optimized for speed, predictability, and compliance.
2. **GraphQL API**: Reserved for complex analytical reports, dynamic dashboard queries, and customer detail screens where the frontend needs to fetch deep trees of nested data (e.g., loading a customer along with their last 10 invoices, pending tasks, and address history in a single round-trip).

---

## 2. API Design & Versioning

### 2.1 Route Structure
All URL paths are versioned in the URI using a lowercase namespace model:
```
https://api.platform.com/v1/{module-name}/{resource-path}
```

Example Endpoints:
* `GET /v1/inventory/warehouses` - Retrieve all warehouses for the authenticated tenant.
* `POST /v1/sales/invoices` - Create a new sales invoice.
* `DELETE /v1/customers/profiles/:id` - Archive a customer record.

### 2.2 Standard Response Envelope
All REST API responses return a structured JSON container. This ensures client apps can parse responses uniformly.

```json
{
  "success": true,
  "data": {
    "id": "764be486-53df-402a-9e12-c2e7b9520cb2",
    "invoice_number": "INV-2026-0001",
    "grand_total": "1250.00"
  },
  "meta": {
    "timestamp": "2026-06-23T16:03:00Z",
    "requestId": "req-987654321"
  }
}
```

OnError Envelope (HTTP status codes `4xx` and `5xx`):
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "The requested product variant does not have enough stock.",
    "details": [
      {
        "variant_id": "8756c9a2-...",
        "requested": 15,
        "available": 5
      }
    ]
  },
  "meta": {
    "timestamp": "2026-06-23T16:03:02Z",
    "requestId": "req-987654322"
  }
}
```

---

## 3. Idempotency Support

To prevent double-billing or duplicated inventory creation (e.g., when a user double-clicks the "Pay" button on a slow mobile connection), all state-mutating requests (`POST`, `PUT`, `PATCH`) support an `Idempotency-Key` header.

### 3.1 Idempotency Key Workflow
```
Client                      API Gateway                   Redis Cache
  │                              │                             │
  │─── POST /sales/invoices ────>│                             │
  │    Header: Idempotency-Key   │                             │
  │                              │─── Check Key exists? ──────>│
  │                              │<── Returns None ────────────│
  │                              │                             │
  │                              │─── Set key status: IN_PROG ─>│
  │                              │                             │
  │                              │─── [Processes Invoice]      │
  │                              │                             │
  │                              │─── Cache Response ─────────>│
  │                              │    Update status: DONE      │
  │<── Returns 201 Created ──────│                             │
  │                              │                             │
  │─── POST /sales/invoices ────>│                             │
  │    (DUPLICATE SUBMISSION)    │                             │
  │                              │─── Check Key exists? ──────>│
  │                              │<── Returns Cached Resp ─────│
  │<── Returns 201 Created ──────│                             │
```

1. **Client Generation**: The client generates a unique UUIDv4 key for the transaction and attaches it as `Idempotency-Key: <uuid>`.
2. **Gateway Interceptor**: NestJS interceptor checks if the key exists in Redis:
   - *If exists and state is `IN_PROGRESS`*: Reject request with `409 Conflict` (request is currently processing).
   - *If exists and state is `RESOLVED`*: Instantly return the cached response payload (headers, status code, body) without hitting the database.
   - *If key doesn't exist*: Write the key to Redis with a state of `IN_PROGRESS` and an expiration time of 24 hours. Proceed to business logic.
3. **Execution Completion**: Once the controller completes execution, the interceptor saves the output response to Redis and transitions the key status to `RESOLVED`.

---

## 4. Rate Limiting Strategy

The platform implements rate limiting at two layers using Redis Token Bucket filters:

### 4.1 IP-Based Rate Limiting (Public / Unauthenticated)
* **Threshold**: 100 requests per 15 minutes per IP address.
* **Scope**: Registration, sign-in, public product catalogs, and subscription checking.
* **Header Response**:
  ```http
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 98
  X-RateLimit-Reset: 1782299834
  ```

### 4.2 Tenant-Based Rate Limiting (Authenticated)
* **Starter Tier**: 500 requests per minute per Tenant context.
* **Business/Professional Tiers**: 2,000 requests per minute per Tenant context.
* **Enterprise Tier**: 10,000 requests per minute per Tenant context.
* **Mitigation**: Exceeding rate limits triggers a `429 Too Many Requests` response.

---

## 5. Mobile Synchronization Sync Protocol

The mobile application uses an offline-first strategy. Local database modifications are queued locally and synchronized with the backend using a specialized synchronization protocol.

### 5.1 Endpoint: `POST /v1/sync/pull`
Fetches all database changes made since the client's last synchronization timestamp.

* **Payload Input**:
  ```json
  {
    "lastPulledAt": 1782290000000,
    "schemaVersion": 1
  }
  ```
* **Response Output**:
  ```json
  {
    "success": true,
    "data": {
      "changes": {
        "customers": {
          "created": [],
          "updated": [
            {
              "id": "e5b8d28a-79a0-4d51-87ab-8f9cd061bfd1",
              "name": "Jane Doe Updated",
              "phone": "+966500000000"
            }
          ],
          "deleted": ["b1129bc4-3b1a-4712-bc78-831ab001ac44"]
        },
        "product_variants": {
          "created": [],
          "updated": [],
          "deleted": []
        }
      },
      "timestamp": 1782299840000
    }
  }
  ```

### 5.2 Endpoint: `POST /v1/sync/push`
Pushes local client modifications to the backend database.

* **Payload Input**:
  ```json
  {
    "changes": {
      "customers": {
        "created": [
          {
            "id": "6732f912-32a1-4322-990a-c11df034ee0b",
            "name": "New Local Customer",
            "phone": "+966511111111",
            "created_at": "2026-06-23T16:03:00.000Z"
          }
        ],
        "updated": [],
        "deleted": []
      }
    },
    "lastPulledAt": 1782290000000
  }
  ```
* **Response Output**:
  - Code `200 OK` on successful validation.
  - In case of conflicts (e.g., both client and server updated the same row), the server resolves the conflict (defaulting to "Server Wins" for financial transaction records and "Last Write Wins" for customer files) and notifies the client via the return object to override its local DB.
