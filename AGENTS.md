# memsystems - Agent Instructions

pnpm workspace monorepo with two packages: `frontend/` (Next.js App Router) and `backend/` (NestJS API).

## Commands

Run from repo root. Each also works from the package directory with `pnpm run`.

| Command | Purpose |
|---------|---------|
| `pnpm run dev` | Parallel dev servers (frontend :3000, backend :4000) |
| `pnpm run dev:frontend` | Next.js dev server only (`--filter frontend`) |
| `pnpm run dev:backend` | NestJS dev server only (`--filter backend`) |
| `pnpm run build` | Build both packages recursively |
| `pnpm run typecheck` | `tsc --noEmit` in both packages |
| `pnpm run lint` | Biome check (frontend) + ESLint (backend) |
| `pnpm run test` | Vitest run in both packages |

**Single-package**: `pnpm --filter <name> run <cmd>` (names: `frontend`, `backend`).

**PowerShell workaround**: `cmd /c "cd /d <pkg-dir> && pnpm run test"`.

**Quality Gate**: `lint` -> `typecheck` -> `test` (fastest first). Build is CI-only.

## frontend (Next.js Frontend)

- **Framework**: Next.js 16 + React 19. Import alias `@/*` -> `./src/*`.
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`), `tw-animate-css`, shadcn/ui.
- **Validation**: Zod.
- **Auth**: Better Auth (Google OAuth, DB-backed sessions). Re-exported from `@/lib/auth` -> `server.ts`. Session via `getSession()` in route handler wrapper `withRoute()`.
- **API client**: `src/lib/api-client/` -- typed functions built on `createQueryOptions`/`apiPost`/`apiDelete` from `factory.ts`.
- **i18n**: `next-intl` with `messages/{en,es,pt}.json`. Locale stored in `NEXT_LOCALE` cookie.
- **Build**: `typescript.ignoreBuildErrors: true`. Rely on separate `pnpm run typecheck`.
- **Domain errors**: `src/lib/errors/` -- `DomainError` base class with HTTP `status` property.
- **Routes**: `src/app/api/{feature}/route.ts`. Pattern: Zod schema + `withRoute()` wrapper. Notebook-nested: `src/app/api/notebooks/[id]/{chat,sources,study-materials,folders,generate}/`.
- **Services**: Flat files in `src/features/{feature}/` -- bundles service logic, components, hooks.
- **Lint/Format**: Biome v2.2.0, space indent (width 2), `organizeImports` on assist.

## backend (NestJS API)

- **Framework**: NestJS 11 (Express platform). Decorators, modules, dependency injection.
- **Global prefix**: `api` (port 4000, `0.0.0.0`). CORS origin from `CLIENT_URL` env.
- **Validation**: Zod via `ZodValidationPipe` in `common/pipes/zod-validation.pipe.ts`.
- **Auth**: `AuthGuard` guard + `@CurrentUser()` decorator in `modules/auth/`.
- **Error handling**: Global `DomainExceptionFilter` catches `DomainError` (from `common/errors/domain-error.ts`) with `{error, code}` JSON response.
- **Modules**: `modules/{ai,auth,chat,database,notebooks,sources,storage,study-materials}/`.
- **Env loading**: `ConfigModule` reads `[../frontend/.env.local, .env.local, ../.env.local, .env]`.
- **Lint/Format**: ESLint + Prettier (not Biome).
- **Build**: `nest build` -> `dist/`. `tsconfig.build.json` excludes test files.
- **Legacy**: `test/` dir has unused Jest e2e config. All active tests are in `tests/` (Vitest).

## Testing (both packages)

- **Vitest + real PostgreSQL** (`postgresql://postgres:superuser@localhost:5432/memsystems_test`). Never mock DB.
- **Pool**: `forks` (Windows workaround). **No file parallelism** -- tests share one test DB.
- **Setup**: `tests/setup.ts` loads `.env.test`, calls `ensureTestDatabase()`, resets DB (`TRUNCATE ... CASCADE`) each test (`beforeEach`).
- **DB init**: `pnpm run test:db:setup` must run once before first test (creates DB + `CREATE EXTENSION vector`).
- **Fixtures**: `tests/fixtures.ts` -- `seedUser`, `seedNotebook`, `seedChatMessage`, `seedSource`, `seedStudyMaterial`. Import `db` from `tests/db.ts`.
- **External mocks only**: S3, auth, LLM, scraper, fetch. `server-only` is aliased to `tests/__mocks__/server-only.ts`.
- **Component tests** (frontend only): Use `// @vitest-environment jsdom` doc-comment. MSW for API mocks. `next-intl` auto-mocked in setup.ts.
- **Env loading**: `vitest.config.ts` loads `.env.test` via `dotenv.config`. `drizzle.config.ts` loads `.env.local`.

## Database

- **PostgreSQL + Drizzle ORM** (node-postgres Pool, timezone UTC).
- **Schema**: `src/database/schema.ts` + `auth-schema.ts` (same path in both packages -- shared schema).
- **Push changes**: `pnpm exec drizzle-kit push` (reads `.env.local`).

## AI & Storage

- **AI**: OpenAI (per-user API key) + OpenCode (operator-configured). Provider interface in `src/features/ai/provider.ts` (frontend) or `modules/ai/` (backend).
- **Storage**: S3-compatible (MinIO dev, R2 prod). Falls back to local filesystem when `DEV_STORAGE_DIR` env is set.

## Skills

Skills from `mattpocock/skills` and `kadajett/agent-nestjs-skills` are installed in `.agents/skills/`. Load via `skill` tool when a task matches.
