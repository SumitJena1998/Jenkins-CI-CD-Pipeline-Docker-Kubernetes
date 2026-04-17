# ============================================================
# Multi-stage Dockerfile for Node.js Application
# Stage 1: Build dependencies
# Stage 2: Production image (minimal attack surface)
# ============================================================

# --- Stage 1: Build ---
FROM node:18-alpine AS builder

WORKDIR /build

# Copy only package files first (Docker layer caching)
COPY app/package*.json ./

# Install ALL dependencies including dev (needed for build)
RUN npm ci --prefer-offline

# Copy source code
COPY app/ .

# Run build step (if applicable)
RUN npm run build --if-present

# Prune dev dependencies
RUN npm prune --production

# --- Stage 2: Production ---
FROM node:18-alpine AS production

# Security: run as non-root
RUN addgroup -g 1001 -S appgroup && \
    adduser  -u 1001 -S appuser -G appgroup

WORKDIR /app

# Copy built artifacts from builder
COPY --from=builder --chown=appuser:appgroup /build/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /build/src        ./src
COPY --from=builder --chown=appuser:appgroup /build/package.json .

# Security hardening
RUN apk add --no-cache dumb-init && \
    chmod -R 550 /app

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:8080/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "src/server.js"]
