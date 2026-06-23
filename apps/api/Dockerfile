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

# Prune devDependencies to keep the image small
RUN CI=true pnpm prune --prod

# Stage 2: Runner Image
FROM node:22-alpine AS runner

# Install libc6-compat for native modules like argon2 at runtime
RUN apk add --no-cache libc6-compat

WORKDIR /app
ENV NODE_ENV=production

# Copy everything from builder (including pruned node_modules and generated prisma clients)
COPY --from=builder /app ./

EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]

