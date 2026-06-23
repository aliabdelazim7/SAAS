# DevOps & CI/CD Infrastructure Plan

This document details the multi-environment layout, infrastructure provisioning (IaC), container configurations, CI/CD pipelines, backup systems, monitoring networks, and disaster recovery strategies.

---

## 1. Multi-Environment Topology

The application relies on three completely isolated cloud environments deployed across multiple availability zones:

| Feature | Development (Dev) | Staging (Pre-Prod) | Production (Prod) |
| :--- | :--- | :--- | :--- |
| **Hosting Platform** | Local Docker Compose | AWS ECS Fargate (Single AZ) | AWS EKS (Kubernetes - Multi-AZ) |
| **Database Instance**| Docker PostgreSQL (v16) | RDS PostgreSQL Aurora (Single node)| RDS Aurora Serverless v2 (Multi-AZ) |
| **Cache Cluster** | Docker Redis (Single) | AWS ElastiCache Redis (Single Node) | AWS ElastiCache Redis (Replication Group)|
| **Domains** | `*.dev.local` | `*.staging.platform.com` | `*.platform.com` & Custom Domains |
| **Scaling** | None | Auto-scaling (1-2 containers) | Auto-scaling (3-15 replicas per pod) |

---

## 2. Docker Container Configurations

We construct multi-stage Dockerfiles to optimize image building, ensuring fast build cycles and minimal container disk footprint.

### 2.1 Backend App Dockerfile (`apps/api/Dockerfile`)
```dockerfile
# Stage 1: Build dependencies
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/dto/package.json ./packages/dto/
RUN pnpm install --frozen-lockfile

# Copy codebase
COPY . .
RUN pnpm --filter db prisma generate
RUN pnpm --filter api build

# Stage 2: Runner Image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g pnpm
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/dto ./packages/dto
RUN pnpm install --prod --frozen-lockfile

EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
```

---

## 3. Infrastructure as Code (IaC) - Terraform Layout

Terraform manages all AWS resources, guaranteeing consistency across Staging and Production.

```tf
# infra/terraform/main.tf
provider "aws" {
  region = var.aws_region
}

# 1. Multi-AZ VPC Configuration
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  name = "saas-production-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = false # High availability in Prod
}

# 2. Database Serverless Cluster
resource "aws_rds_cluster" "aurora" {
  cluster_identifier      = "production-aurora-db"
  engine                  = "aurora-postgresql"
  engine_version          = "16.1"
  database_name           = "platform_db"
  master_username         = "super_admin"
  master_password         = var.db_password
  vpc_security_group_ids  = [aws_security_group.db_sg.id]
  db_subnet_group_name    = module.vpc.database_subnet_group_name
  backup_retention_period = 30
  preferred_backup_window = "02:00-03:00"
  storage_encrypted       = true
  deletion_protection     = true
}
```

---

## 4. Continuous Integration & Deployment (CI/CD)

We use **GitHub Actions** to automate our delivery pipelines.

```yaml
# .github/workflows/deploy-production.yml
name: Deploy Production API

on:
  push:
    branches:
      - main
    paths:
      - 'apps/api/**'
      - 'packages/**'

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run Linter
        run: pnpm lint

      - name: Run Tests
        run: pnpm test

  build-and-push-docker:
    needs: build-and-test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build, tag, and push image to Amazon ECR
        run: |
          docker build -t ${{ steps.login-ecr.outputs.registry }}/platform-api:latest -f apps/api/Dockerfile .
          docker push ${{ steps.login-ecr.outputs.registry }}/platform-api:latest

      - name: Deploy to Kubernetes EKS Cluster
        run: |
          aws eks update-kubeconfig --name production-eks-cluster
          kubectl rollout restart deployment/api-deployment
```

---

## 5. Disaster Recovery & Backups

To guarantee compliance and mitigate data loss risks, we implement a comprehensive backup strategy.

### 5.1 Recovery Parameters
* **Recovery Point Objective (RPO)**: $\le 5\text{ minutes}$.
* **Recovery Time Objective (RTO)**: $\le 15\text{ minutes}$.

### 5.2 Backup Execution Details
1. **Continuous Backups**: AWS Aurora is configured for Point-in-Time Recovery (PITR). Database transactions logs are archived every 5 minutes, allowing restore to any second within the retention window (30 days).
2. **Cross-Region Replication**: Every night, a snapshot of the database cluster is replicated to a secondary AWS region (e.g., from `us-east-1` to `eu-west-1`).
3. **Daily Object Storage Snapshots**: AWS S3 buckets (which hold invoices, receipt images, contracts) are configured with versioning, cross-region replication, and MFA-delete rules to block ransom attacks.

---

## 6. Observability, Monitoring & Log Aggregation

We implement a three-pillar observability pipeline using OpenTelemetry:

```
                      ┌──────────────────────┐
                      │ Application Clusters │
                      └──────────┬───────────┘
                                 │ Metrics, Logs, Traces
            ┌────────────────────┼────────────────────┐
            ▼                    ▼                    ▼
     ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
     │ Prometheus  │      │ Winston/Pino│      │ OpenTelemetry│
     │  (Metrics)  │      │   (Logs)    │      │  (Tracing)  │
     └──────┬──────┘      └──────┬──────┘      └──────┬──────┘
            │                    │                    │
            └───────────────┐    │    ┌───────────────┘
                            ▼    ▼    ▼
                         ┌───────────────┐
                         │ Grafana Stack │
                         └───────────────┘
```

1. **Structured Logging**: Winston/Pino logs are outputted as JSON strings.
   - *Production Format*: `{"level":"error","timestamp":"2026-06-23T16:03:00.000Z","message":"Invoice compilation failed","tenantId":"...","userId":"...","errStack":"..."}`
   - *Collection*: AWS CloudWatch Agent scrapes container console output, forwarding logs to AWS OpenSearch for querying.
2. **APM & Tracing (OpenTelemetry)**: APM collects trace data to diagnose slow database transactions or API response bottlenecks.
3. **Application Alerting (Sentry)**: Uncaught exceptions in Next.js or NestJS are pushed to Sentry. Sentry pages DevOps engineers if error counts exceed 2% within a 5-minute rolling window.
