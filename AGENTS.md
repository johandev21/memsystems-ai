# memsystems - Agent Instructions

Next.js App Router application at `memsystems_app/`. Single app (no monorepo).

## Commands (from `memsystems_app/`)

| Command | Purpose |
|---------|---------|
| `pnpm run dev` | Dev server (port 3000) |
| `pnpm run build` | Production build (type-check skipped -- see below) |
| `pnpm run typecheck` | `tsc --noEmit` |
| `pnpm run lint` | Biome check |
| `pnpm run format` | Biome format `--write` |
| `pnpm run test` | Vitest run |
| `pnpm run test:watch` / `test:ui` | Vitest watch / UI mode |
| `pnpm run test:db:setup` | Create `memsystems_test` DB + `drizzle-kit push` |

**PowerShell**: `pnpm run test` fails. Workaround:
`cmd /c "cd /d C:\Users\johan\Documents\Github\memsystems-ai\memsystems_app && pnpm run test"`

## Quality Gate

Always run these before pushing (fastest first): `lint` -> `typecheck` -> `test`. Build is for CI only.

## Tech Stack

- **Framework**: Next.js 16 + React 19
- **Language**: TypeScript 7 strict, import alias `@/*` -> `./src/*`
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`), `tw-animate-css`, shadcn/ui
- **Database**: PostgreSQL via Drizzle ORM (`node-postgres` Pool, timezone UTC). Schema in `src/database/schema.ts` + `auth-schema.ts`. To push schema changes: `pnpm exec drizzle-kit push` (reads `.env.local`).
- **Auth**: Better Auth (Google OAuth, DB-backed sessions). Session checked via `getSession()` in route handler wrapper `withRoute()`.
- **AI**: Two providers -- OpenAI (per-user API key) and OpenCode (operator-configured). OpenCode runs read-only `plan` agent in `os.tmpdir()/memsystems-llm-cwd` with all write/exec tools denied. Provider interface in `src/features/ai/provider.ts`.
- **Storage**: S3-compatible (MinIO dev, R2 prod). Falls back to local filesystem when `DEV_STORAGE_DIR` env is set.
- **Build**: Next.js built-in type-check disabled (`typescript.ignoreBuildErrors: true`). Rely on separate `pnpm run typecheck`.
- **i18n**: `next-intl` with `messages/{en,es,pt}.json`. Locale stored in `NEXT_LOCALE` cookie.

## Testing

- **Vitest** + **real PostgreSQL** (`postgresql://postgres:superuser@localhost:5432/memsystems_test`). Never mock DB.
- **Pool**: `forks` (Windows workaround). **No file parallelism** -- tests share one test DB, reset via `TRUNCATE ... CASCADE` before each test.
- **Setup**: `tests/setup.ts` loads `.env.test`, calls `ensureTestDatabase()` (creates DB + `CREATE EXTENSION vector`), resets DB each test. Call `pnpm run test:db:setup` once before first run.
- **Mocks**: External-only (S3, auth, LLM, scraper, fetch). `server-only` mocked by Vitest alias to `tests/__mocks__/server-only.ts`. MSW for component tests.
- **Component tests**: Use `// @vitest-environment jsdom` doc-comment on every test file. MSW handles API mocks. `next-intl` auto-mocked in setup.ts.
- **Fixtures**: Seed helpers in `tests/fixtures.ts` (`seedUser`, `seedNotebook`, `seedChatMessage`, `seedSource`, `seedStudyMaterial`). Import `db` from `tests/db.ts` in tests.
- **Test layout**: `tests/backend/` (services + routes), `tests/component/` (React components).

## Architecture

- **Routes**: `src/app/api/{feature}/route.ts`. Pattern: Zod schema validation + `withRoute()` wrapper (injects session, handles errors) from `src/app/api/_shared/route-utils.ts`. API routes nested under notebooks: `src/app/api/notebooks/[id]/{chat,sources,study-materials,folders,generate}/`.
- **Services**: Flat files in `src/features/{feature}/` -- each feature bundles service logic, components, and hooks. Exception: `generation/` holds `prompts/` only; generation logic lives in `study-materials/` and `notebooks/`.
- **API client**: `src/lib/api-client/` -- typed functions built on `createQueryOptions`/`apiPost`/`apiDelete` from `factory.ts`.
- **Domain errors**: `src/lib/errors/` -- `DomainError` base class with HTTP `status` property. Re-exported from `index.ts`.
- **Auth re-exports**: `src/lib/auth/index.ts` re-exports from `server.ts`. `import { auth, getSession } from "@/lib/auth"`.

## Conventions

- **Package manager**: `pnpm` only
- **Lint/Format**: Biome v2.2.0, space indent (width 2), `organizeImports` on assist
- **Validation**: Zod
- **CSS**: `src/app/globals.css` with `@import "tailwindcss"`, `@source` for external packages
- **Env loading**: `drizzle.config.ts` loads `.env.local`; `vitest.config.ts` loads `.env.test` via `dotenv.config`.
