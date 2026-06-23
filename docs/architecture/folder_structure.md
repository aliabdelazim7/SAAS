# Folder Structure Monorepo Layout

To facilitate code reuse (such as sharing validation types, DTO structures, and API client interfaces between Next.js, NestJS, and React Native), the repository is organized as a **PNPM Workspace Monorepo**.

---

## 1. Monorepo Directory Tree

Below is the directory structure for development, deployment, and infrastructure configurations:

```
/ (Monorepo Root)
├── apps/
│   ├── api/                       # NestJS Backend API
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   └── app.module.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── web/                       # Next.js Frontend App
│   │   ├── src/
│   │   │   ├── app/               # Next.js App Router (pages & middleware)
│   │   │   ├── components/        # UI components (shadcn/ui layout)
│   │   │   └── hooks/             # Client state hooks (TanStack query)
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tailwind.config.js
│   │
│   └── mobile/                    # React Native Mobile App (Expo)
│       ├── src/
│       │   ├── components/        # Mobile-specific UI elements
│       │   ├── database/          # WatermelonDB models & schema
│       │   └── screens/           # Expo router navigations
│       ├── app.json
│       ├── package.json
│       └── tsconfig.json
│
├── packages/                      # Shared internal workspaces
│   ├── database/                  # Shared database schema & client
│   │   ├── prisma/
│   │   │   └── schema.prisma      # Unified database schema
│   │   ├── index.ts               # Database clients exporter
│   │   └── package.json
│   │
│   ├── dto/                       # Shared DTOs & validation schemas (zod)
│   │   ├── src/
│   │   │   ├── auth.dto.ts
│   │   │   └── invoice.dto.ts
│   │   ├── index.ts
│   │   └── package.json
│   │
│   ├── eslint-config/             # Shared lint rules
│   │   └── index.js
│   │
│   └── tsconfig/                  # Shared tsconfig bases
│       ├── base.json
│       ├── nextjs.json
│       └── nestjs.json
│
├── infra/                         # Infrastructure Configurations
│   ├── docker/                    # Docker Compose services (Dev)
│   │   ├── docker-compose.yml
│   │   └── postgres.conf
│   │
│   └── terraform/                 # Infrastructure as Code (AWS RDS/ECS)
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
│
├── .gitignore
├── package.json                   # Root package.json configurations
├── pnpm-lock.yaml
└── pnpm-workspace.yaml            # PNPM workspaces configuration
```

---

## 2. Configuration Files

### 2.1 pnpm-workspace.yaml
Defines workspace directories so pnpm can resolve internal symlinks efficiently:

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### 2.2 Root package.json
Enables tasks to be executed across all sub-apps from the monorepo root:

```json
{
  "name": "platform-monorepo",
  "version": "1.0.0",
  "private": true,
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  },
  "scripts": {
    "dev:api": "pnpm --filter api dev",
    "dev:web": "pnpm --filter web dev",
    "dev:mobile": "pnpm --filter mobile start",
    "build:api": "pnpm --filter api build",
    "build:web": "pnpm --filter web build",
    "lint": "pnpm -r lint",
    "test": "pnpm -r test",
    "db:migrate": "pnpm --filter db prisma migrate dev",
    "db:generate": "pnpm --filter db prisma generate"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "turbo": "^2.0.4"
  }
}
```

### 2.3 TurboRepo Integration
We utilize **Turborepo** to orchestrate pipelines, cache task builds, and speed up CI/CD runs.
Below is the root `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "lint": {},
    "test": {
      "dependsOn": ["build"]
    },
    "db:generate": {
      "cache": false
    }
  }
}
```

---

## 3. Deployment Build Strategies

* **Multi-Stage Dockerfiles**:
  Docker files inside `apps/api` and `apps/web` use pnpm workspaces pruning to copy only the required files and dependencies for that application to keep the production image size small.
* **Asset Optimization**:
  `apps/web` Next.js is configured for standalone output:
  ```javascript
  // apps/web/next.config.js
  module.exports = {
    output: 'standalone',
  };
  ```
  This copies only files needed for production, reducing image sizes from ~1.5GB to <120MB.
