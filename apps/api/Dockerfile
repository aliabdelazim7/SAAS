# Stage 1: Build dependencies
FROM node:22-alpine AS builder


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
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g pnpm

# Copy workspace config files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy package manifests (so pnpm knows what to install)
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/dto/package.json ./packages/dto/

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy compiled outputs and package files from builder stage
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/dto ./packages/dto

# Generate Prisma Client inside runner (needed for runtime db access)
RUN pnpm --filter @crm/database exec prisma generate

EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]

