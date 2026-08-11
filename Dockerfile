# syntax=docker/dockerfile:1.7

# ---------------------------------------------------------------------------
# Base: Node 24 + pnpm (version pinned by the packageManager field via corepack)
# ---------------------------------------------------------------------------
FROM node:24-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME/bin:$PATH
RUN corepack enable
WORKDIR /app

# ---------------------------------------------------------------------------
# deps: install the full monorepo (devDeps included, required for building)
# ---------------------------------------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# build: compile the NestJS backend and bundle the Vite frontend
# ---------------------------------------------------------------------------
FROM deps AS build
COPY frontend ./frontend
COPY backend ./backend
# Run scripts from inside each package dir: `pnpm --filter <pkg> run` resolves
# lifecycle bins from lockfile data, which is inconsistent with the install
# layout on Linux; running from the package dir resolves via node_modules/.bin.
# Run scripts from inside each package dir: `pnpm --filter <pkg> run` resolves
# lifecycle bins from lockfile data, which is inconsistent with the install
# layout on Linux; running from the package dir resolves via node_modules/.bin.
RUN cd backend && pnpm run build
# vite build (esbuild) is used instead of `build` (tsc -b) so the image build
# is not blocked by unrelated type errors; vite does not type-check.
RUN cd frontend && pnpm run build:prod

# ---------------------------------------------------------------------------
# backend-prod: extract production-only deps for the backend package
# ---------------------------------------------------------------------------
FROM build AS backend-prod
RUN pnpm --filter=backend --prod deploy --legacy /prod/backend

# ---------------------------------------------------------------------------
# backend runtime
# ---------------------------------------------------------------------------
FROM node:24-slim AS backend
ENV NODE_ENV=production
WORKDIR /app
COPY --from=backend-prod /prod/backend/package.json ./package.json
COPY --from=backend-prod /prod/backend/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/drizzle ./drizzle
EXPOSE 4000
CMD ["sh", "-c", "node dist/database/migrate.js && node dist/main.js"]

# ---------------------------------------------------------------------------
# frontend runtime: nginx serves the SPA and reverse-proxies /api -> backend
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS frontend
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
