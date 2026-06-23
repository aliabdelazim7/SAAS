# Stage 1: Build dependencies
FROM node:20-alpine AS builder

# Install build dependencies for native modules (like argon2)
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app
RUN npm install -g pnpm

# Copy workspace config files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy package manifests
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/dto/package.json ./packages/dto/

# Install dependencies (including devDependencies to compile ts)
RUN pnpm install --frozen-lockfile

# Copy codebase
COPY . .

# Generate Prisma Client & Build all workspace dependencies
RUN pnpm --filter @crm/database exec prisma generate
RUN pnpm --filter @crm/dto run build
RUN pnpm --filter @crm/database run build
RUN pnpm --filter @crm/api run build

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
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]
