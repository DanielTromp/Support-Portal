# ── Build stage ──────────────────────────────────────────────────────────────
FROM docker.io/node:22-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json next.config.mjs tailwind.config.ts postcss.config.mjs ./
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY next-env.d.ts ./

RUN npm run build

# ── Production stage ────────────────────────────────────────────────────────
FROM docker.io/node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/src/lib/version.ts ./src/lib/version.ts
COPY --from=builder /app/src/lib/migrations.ts ./src/lib/migrations.ts
COPY --from=builder /app/scripts ./scripts

# Data directory for FAQ JSON + SQLite DB (volume mount point)
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

CMD ["node_modules/.bin/next", "start", "-p", "3000"]
