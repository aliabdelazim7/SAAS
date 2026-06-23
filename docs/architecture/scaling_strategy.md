# Scaling & High-Performance Strategy

This document details the strategies for scaling the SaaS platform to support tens of thousands of concurrent tenants, handle high-frequency transactional writes, optimize caching tiers, and manage database shard expansions.

---

## 1. Multi-Tier Caching Architecture

Caching is deployed across three layers to shield the database and reduce response times:

```
                    ┌──────────────────────────────┐
                    │     HTTP Client / Browser    │
                    └──────────────┬───────────────┘
                                   │ CDN Cache (Edge HTML, JS, CSS)
                                   ▼
                    ┌──────────────────────────────┐
                    │        Cloudflare CDN        │
                    └──────────────┬───────────────┘
                                   │ API Request
                                   ▼
                    ┌──────────────────────────────┐
                    │      NestJS App Node        │
                    └──────────────┬───────────────┘
                                   │ Redis Query Cache (TTL 10m)
                                   ▼
                    ┌──────────────────────────────┐
                    │      Redis Cache Cluster     │
                    └──────────────┬───────────────┘
                                   │ DB Query (Cache Miss)
                                   ▼
                    ┌──────────────────────────────┐
                    │   PostgreSQL Master / Replica│
                    └──────────────────────────────┘
```

### 1.1 Edge Caching (CDN)
- **Static Assets**: Product gallery thumbnails, CSS bundles, JS packages, and localization files (JSON locales) are cached at Cloudflare edge locations with a 30-day TTL.
- **Dynamic Content Routing**: Edge rules rewrite tenant paths (e.g., `tenant-a.com/dashboard` reads static shell layout from CDN and fetches dynamic data from API origin).

### 1.2 Redis Application Cache
- **Session Cache**: JWT signature verify states and blocklists.
- **Entity Cache**: Frequently accessed, slow-changing entities (e.g., plan configurations, tenant preferences, module status indicators).
- **Query Cache**: Database select queries (such as listing product catalogs or warehouse settings) are cached for 10 minutes.
- **Cache-Invalidate-On-Write**: Whenever a product is created or updated, the corresponding cache key is purged:
  ```typescript
  async updateProduct(productId: string, data: UpdateProductDto) {
    const updated = await this.db.productVariant.update({ where: { id: productId }, data });
    await this.redis.del(`tenant:${updated.tenantId}:products:list`);
    return updated;
  }
  ```

---

## 2. Database Read / Write Scaling

PostgreSQL scaling separates write transactions from read operations.

### 2.1 Write Path Optimization
* **Connection Pooling**: PgBouncer sits before PostgreSQL in **Transaction Mode**, scaling connection handling without spawning a dedicated OS process per client connection.
* **Bulk Writes**: Financial postings, inventory movement registers, and batch sync payloads from mobile clients are processed in batches rather than individual `INSERT` commands:
  ```sql
  INSERT INTO tenant_data.inventory_balances (tenant_id, warehouse_id, variant_id, quantity)
  VALUES 
      ('t1', 'w1', 'v1', 10),
      ('t1', 'w1', 'v2', 15)
  ON CONFLICT (warehouse_id, variant_id) DO UPDATE SET quantity = inventory_balances.quantity + EXCLUDED.quantity;
  ```

### 2.2 Read Replicas Routing
* The application maintains two database connection pools: `WriterConnection` (pointing to the Aurora PostgreSQL Writer instance) and `ReaderConnection` (pointing to the Aurora Reader endpoint).
* Controllers route read queries (e.g., reports, lists) to the reader pool:
  ```typescript
  const dbReader = this.dbService.getReaderConnection();
  return dbReader.invoice.findMany({ where: { tenantId } });
  ```
* **Replication Lag Mitigation**: If a client updates a record (writes to Writer) and immediately refreshes the page (reads from Reader), replica lag (typically < 20ms) could cause the client to see the old record.
  - *Solution*: A session key `last_write_timestamp` is stored in the client's cookie. If the current time minus `last_write_timestamp` is < 1 second, the read request is routed directly to the Writer database to guarantee read-your-own-write consistency.

---

## 3. Kubernetes Auto-Scaling Rules

Application servers deploy on AWS EKS (Elastic Kubernetes Service) with Horizontal Pod Autoscaler (HPA) configured:

```yaml
# infra/kubernetes/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
  namespace: saas-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-deployment
  minReplicas: 3
  maxReplicas: 15
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0 # scale up immediately
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300 # scale down slowly to prevent flapping
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
```

---

## 4. Database Sharding & Partition Expansion

When a single Aurora database cluster reaches resource limits (e.g., 64TB database storage volume or connection pool exhaustion):

### 4.1 Sharding Strategy
We shard the shared database logical schema horizontally across multiple physical PostgreSQL nodes based on the `tenant_id` UUID.

```
                          ┌───────────────────────────┐
                          │    API Router / Gateway   │
                          └─────────────┬─────────────┘
                                        │
             ┌──────────────────────────┼──────────────────────────┐
             ▼                          ▼                          ▼
   ┌───────────────────┐      ┌───────────────────┐      ┌───────────────────┐
   │  DB Shard Node 1  │      │  DB Shard Node 2  │      │  DB Shard Node 3  │
   ├───────────────────┤      ├───────────────────┤      ├───────────────────┤
   │ Tenants:          │      │ Tenants:          │      │ Tenants:          │
   │ UUID starts 0 - 5 │      │ UUID starts 6 - a │      │ UUID starts b - f │
   └───────────────────┘      └───────────────────┘      └───────────────────┘
```

1. **Shard Key Selection**: `tenant_id` UUID is the shard key.
2. **Metadata routing table**: The API gateway maintains a routing map cached in Redis:
   `Key: tenant:route:{tenantId} -> Value: { shardHost: 'shard-db-02.rds.amazonaws.com' }`
3. **Connection Management**: Upon incoming requests, the dynamic datasource selector reads the shard destination and instantiates/retrieves the client connection pool for that database node.
4. **Data Aggregation (Cross-Tenant Queries)**: Operations that require querying multiple shards (e.g., global administrator reporting) are executed asynchronously via a background analytical warehouse (e.g., Snowflake or AWS Redshift) populated via CDC (Change Data Capture) pipelines.
