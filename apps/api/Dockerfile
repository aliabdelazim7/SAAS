# Stage 1: Build dependencies
FROM node:22-alpine AS builder


# Install build dependencies for native modules (like argon2)
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app
RUN npm install -g pnpm

# Set inject-workspace-packages to true to enable pnpm deploy in workspaces without symlinks
RUN echo "inject-workspace-packages=true" > .npmrc

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

# Deploy to a production-ready clean directory (copies workspace dependencies physically)
RUN pnpm --filter @crm/api --prod deploy /app/deploy

# Run prisma generate in the deployed folder to ensure client files are present
RUN cd /app/deploy && npx prisma generate --schema=node_modules/@crm/database/prisma/schema.prisma

# Stage 2: Runner Image
FROM node:22-alpine AS runner

# Install libc6-compat for native modules like argon2 at runtime
RUN apk add --no-cache libc6-compat

WORKDIR /app
ENV NODE_ENV=production

# Copy from deploy directory of builder (flat structure with no parent symlinks)
COPY --from=builder /app/deploy ./

EXPOSE 4000
CMD ["node", "dist/main.js"]

