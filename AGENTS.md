# memsystems - Global Agent Instructions

Next.js monorepo application. This file defines router and configuration for agents.

## 1. Directory Structure

- **App (`memsystems_app/`)**: Next.js App Router + TanStack Query application.

## 2. Global Standards

- **Package Manager**: Use `pnpm` exclusively (never `npm`, `yarn`, or `bun`). Run `pnpm install` and `pnpm run <script>`.
- **Import alias**: `@/*` -> `memsystems_app/src/*`.
- **Validation**: Zod.
- **Linting/Formatting**: Biome v2.2.0 (spaces, no tabs).
- **Clean Code**: Feature domain organization, small cohesive/loosely-coupled files, readable and maintainable.

## 3. Commands (from `memsystems_app/`)

| Command | Purpose |
|---------|---------|
| `pnpm run dev` | Start dev server (port 3000) |
| `pnpm run build` | Production build |
| `pnpm run typecheck` | TypeScript check |
| `pnpm run lint` / `format` | Biome lint / format |
| `pnpm run test` | Run Vitest suite (requires `pnpm run test:db:setup` once) |
| `pnpm run test:watch` / `test:ui` | Vitest watch mode / UI mode |
| `pnpm run test:db:setup` | Create `memsystems_test` DB & push schema |

## 4. Next.js: Docs

Read docs in `node_modules/next/dist/docs/` before Next.js coding.

## 5. Testing

- **Vitest**: 72 tests across 7 files, all green.
- **Database**: Real PostgreSQL at `postgresql://postgres:superuser@localhost:5432/memsystems_test`. Set up via `pnpm run test:db:setup`. Never mock DB; reset via `tests/db.ts`.
- **Layout**: `memsystems_app/tests/` containing `backend/`, `component/`, `setup.ts`, `db.ts`, `fixtures.ts`, `__mocks__/`.
- **Mocking**: External only (auth, LLM, S3, scraper, fetch). Never mock DB. Use `useChat` + MSW or QueryClient cache for components.
- **Verification**:
  - *Small UI changes*: Tests optional. Run `typecheck` and `lint`/`format`.
  - *Logic/Backend/API changes*: Run full verification (`pnpm run lint && pnpm run typecheck && pnpm run test`).
- **TDD**: Vertical slices, RED -> GREEN. Integration tests in `tests/backend/` and `tests/component/` catch runtime bugs.
- **PowerShell**: `pnpm run test` fails with `ERR_PNPM_NO_PKG_MANIFEST`. Workaround: `cmd /c "cd /d C:\Users\johan\Documents\Github\memsystems-ai\memsystems_app && pnpm run test"`.
- **Paths**: Repo has both `memsems_app` (typo) and `memsystems_app` (correct). Tests must go to `memsystems_app/tests/`.
- Full strategy: `docs/testing-plan.md`.

## 6. General Notes

- Prefer reading executable source code over READMEs.
- Routes: Next.js App Router (`src/app/api/.../route.ts`).
- Services: Flat per-file in `src/features/`.
- DB/Auth: Drizzle ORM + PG (`src/database/`), Better Auth (`src/lib/auth.ts` / `src/proxy.ts`).
- **LLM sandbox**: Chat calls run read-only `plan` agent in sandbox at `os.tmpdir()/memsystems-llm-cwd` (no shell access, edits, web search). Model selection is allow-listed against `opencodeProvider.listModels()`.
