# syntax=docker/dockerfile:1.7

# ── Stage 1: build (frontend + backend, depois prune das devDeps) ────────────
FROM node:20-alpine AS builder

# better-sqlite3 precisa de toolchain nativo
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Manifests primeiro p/ aproveitar cache de camada
COPY package.json package-lock.json* ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Instala TODAS as deps (inclui dev)
RUN npm install

# Código
COPY backend ./backend
COPY frontend ./frontend

# Builda backend (tsc) e frontend (vite)
RUN npm --workspace backend run build && \
    npm --workspace frontend run build

# Remove deps de desenvolvimento (Vite, tsc, vitest, tsx etc) — better-sqlite3 (prod) permanece
RUN npm prune --omit=dev

# ── Stage 2: runtime mínimo ──────────────────────────────────────────────────
FROM node:20-alpine AS runtime

# tini = init pequeno; wget = healthcheck
RUN apk add --no-cache tini wget && \
    addgroup -S app && adduser -S app -G app && \
    mkdir -p /app/data && chown -R app:app /app

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    DB_PATH=/app/data/ceunuvens.db \
    FRONTEND_DIR=/app/public

# Manifests + node_modules (prod-only) com better-sqlite3 já compilado p/ alpine.
# npm workspaces faz hoist de todas as deps p/ /app/node_modules — backend/node_modules
# normalmente não existe, então o Node resolve módulos subindo até o root.
COPY --from=builder --chown=app:app /app/package.json /app/package-lock.json* ./
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/backend/package.json ./backend/

# Build do backend (JS gerado pelo tsc)
COPY --from=builder --chown=app:app /app/backend/dist ./backend/dist

# Build do frontend (estáticos)
COPY --from=builder --chown=app:app /app/frontend/dist ./public

USER app
EXPOSE 3000

# Volume p/ persistência do SQLite (montar /app/data no EasyPanel)
VOLUME ["/app/data"]

# EasyPanel/qualquer plataforma pode injetar PORT diferente — healthcheck respeita.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-3000}/health" || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "backend/dist/server.js"]
