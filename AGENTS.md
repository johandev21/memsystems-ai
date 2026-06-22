# memsystems - Global Agent Instructions

This monorepo contains a single Next.js application. This file serves as the global router and baseline configuration for agents working in this repository.

## 1. Directory Structure

All application code lives in `memsystems_app/`:

- **App (`memsystems_app/`)**: Next.js App Router + TanStack Query application.

## 2. Global Standards

- **Package Manager (pnpm)**: We exclusively use **pnpm**. Never use `npm`, `yarn`, or `bun`. Always run `pnpm install` and `pnpm run <script>`.
- **Import alias**: `@/*` maps to `memsystems_app/src/*`.
- **Validation**: Zod (not TypeBox).
- **Linting/Formatting**: Biome v2.2.0 (space indent, not tabs).
- **Clean Code Philosophy**: 
  - Organize code logically by **feature domain** rather than purely by technical type. 
  - Keep files small, highly cohesive, and loosely coupled.
  - Prioritize readability and maintainability.

## 3. Commands (run from `memsystems_app/`)

| Command | Purpose |
|---------|---------|
| `pnpm run dev` | Start dev server (port 3000) |
| `pnpm run build` | Production build |
| `pnpm run typecheck` | TypeScript check only (fast) |
| `pnpm run lint` | Biome lint |
| `pnpm run format` | Biome format |
| `pnpm run test` | Run Vitest suite (requires `pnpm run test:db:setup` once) |
| `pnpm run test:watch` | Vitest watch mode |
| `pnpm run test:ui` | Vitest with interactive UI |
| `pnpm run test:db:setup` | One-time: create `memsystems_test` DB and push schema |

## 4. Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

## 5. Testing

- **Test framework**: Vitest (`pnpm run test`). 72 tests across 7 files, all green.
- **Test database**: real Postgres at `postgresql://postgres:superuser@localhost:5432/memsystems_test`. Set up once with `pnpm run test:db:setup`. NEVER mock the db — use the real test DB and reset state via `tests/db.ts`.
- **Test layout**: `memsystems_app/tests/` with `backend/`, `component/`, `setup.ts`, `db.ts`, `fixtures.ts`, `__mocks__/`.
- **Mocking policy**: only at external boundaries (auth, LLM, S3, scraper, fetch). Never mock the db. Use real `useChat` + MSW or pre-populated QueryClient cache for component tests.
- **Before any commit**, agents must run: `pnpm run lint && pnpm run typecheck && pnpm run test`.
- **TDD**: vertical slices, one test at a time, RED → GREEN. Bugs that compile but misbehave are caught by integration tests in `tests/backend/` and `tests/component/`.
- **PowerShell caveat**: `pnpm run test` from PowerShell fails with `ERR_PNPM_NO_PKG_MANIFEST`. Workaround: `cmd /c "cd /d C:\Users\johan\Documents\Github\memsystems-ai\memsystems_app && pnpm run test"`.
- **Path typo trap**: the repo has BOTH `memsems_app` (typo) and `memsystems_app` (correct). All test writes MUST go to `memsystems_app/tests/`.
- Full test strategy and history: `docs/testing-plan.md`.

## 6. General Notes
- Prefer reading actual executable source code over README text, as the repository may still contain boilerplate template README content.
- All route handlers use Next.js App Router (`src/app/api/.../route.ts`).
- Feature services are in `src/features/` with a flat service-per-file pattern.
- Database: Drizzle ORM + PostgreSQL via `src/database/`.
- Auth: Better Auth via `src/lib/auth.ts` + `src/proxy.ts`.
- **LLM sandbox**: every chat call runs the OpenCode `plan` agent (read-only) inside an empty sandbox at `os.tmpdir()/memsystems-llm-cwd`. The model cannot read the app repo, run shell commands, edit files, or web-search. The `model` field in `POST /api/notebooks/[id]/chat` is allow-listed against `opencodeProvider.listModels()` — clients cannot pick a model the UI doesn't advertise.
