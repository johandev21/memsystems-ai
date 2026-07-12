# memsystems - Agent Instructions

Next.js App Router application at `memsystems_app/`. Single app (no monorepo).

## Commands (from `memsystems_app/`)

| Command | Purpose |
|---------|---------|
| `pnpm run dev` | Dev server (port 3000) |
| `pnpm run build` | Production build |
| `pnpm run typecheck` | `tsc --noEmit` |
| `pnpm run lint` | Biome lint |
| `pnpm run format` | Biome format `--write` |
| `pnpm run test` | Vitest (requires `pnpm run test:db:setup` once) |
| `pnpm run test:watch` / `test:ui` | Vitest watch / UI mode |
| `pnpm run test:db:setup` | Create `memsystems_test` DB + `drizzle-kit push` schema |

**PowerShell**: `pnpm run test` fails. Workaround:
`cmd /c "cd /d C:\Users\johan\Documents\Github\memsystems-ai\memsystems_app && pnpm run test"`

## Tech Stack

- **Framework**: Next.js 16 + React 19
- **Language**: TypeScript 7 strict (native Go port, 8-12x faster), import alias `@/*` -> `./src/*`
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`), `tw-animate-css`, shadcn/ui
- **Database**: PostgreSQL via Drizzle ORM (`node-postgres` Pool, timezone UTC)
- **Auth**: Better Auth (Google OAuth only, DB-backed sessions — no JWT)
- **AI**: OpenCode-only (`ai-sdk-provider-opencode-sdk`). Operator-configured (no per-user keys). Chat runs read-only `plan` agent in `os.tmpdir()/memsystems-llm-cwd` (no shell/edit/search). Model allow-listed against `opencodeProvider.listModels()`.
- **Storage**: S3-compatible (MinIO dev, R2 prod). `next.config.ts` marks `pg`, `drizzle-orm`, S3 SDK, `jsdom`, `pdf-parse`, `mammoth` as `serverExternalPackages`.
- **Build**: Next.js built-in type-check disabled (`typescript.ignoreBuildErrors: true`) — rely on `pnpm run typecheck` separately (TS 7 native binary not yet supported by Next.js programmatic API).

## Testing

- **Vitest** + **real PostgreSQL** (`postgresql://postgres:superuser@localhost:5432/memsystems_test`). Never mock DB.
- **Pool**: `forks` (Windows workaround for thread crash). **No file parallelism** — tests share one test DB, reset before each test via `TRUNCATE ... CASCADE`.
- **Setup**: `tests/setup.ts` loads `.env.test`, calls `ensureTestDatabase()`, resets DB before each test.
- **Mocks**: External-only (auth, LLM, S3, scraper, fetch). MSW for component tests. `server-only` mocked by `vitest.config.ts` alias.
- **Test layout**: `tests/backend/` (12 files), `tests/component/` (15 files), `tests/db.ts` (helpers), `tests/fixtures.ts` (seeders).
- **When to test**: Only run tests when implementing new features that change business logic. Skip for UI-only changes, refactors, or fixes with no behavioral change.

## Quality

- **React Doctor**: Run `npx react-doctor@latest` from `memsystems_app/` to scan for security, performance, and correctness issues. Aim for a score of **≥ 90**. Run with `--diff` to scan only changes. See [react.doctor/docs](https://react.doctor/docs/overview/quickstart) for full docs.

## Architecture

- **Routes**: App Router `src/app/api/.../route.ts`
- **Services**: Flat files in `src/features/{feature}/` e.g. `src/features/notebook-chat/`, `src/features/sources/`
- **DB schema**: `src/database/schema.ts` + `auth-schema.ts`, combined via Drizzle `drizzle()`
- **Domain glossary**: `CONTEXT.md` (Notebook, Source, Study Material, SRS/SM-2, etc.)
- **Decisions**: `docs/adr/` (DB sessions, OpenCode-only AI)

## Conventions

- **Package manager**: `pnpm` only
- **Lint/Format**: Biome v2.2.0 (space indent, no tabs; `organizeImports` on assist)
- **Validation**: Zod
- **CSS**: `globals.css` at `src/app/` with `@import "tailwindcss"`, `@source` for external packages
