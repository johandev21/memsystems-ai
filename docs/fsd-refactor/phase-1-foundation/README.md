# Phase 1: Foundation

Scaffold the FSD directory structure and configure path aliases so that all subsequent phases can use `@/shared/`, `@/pages/`, etc.

**Goal:** Empty but valid FSD skeleton that builds and typechecks.

## Tickets

### [#3](https://github.com/johandev21/memsystems-ai/issues/3) — Scaffold FSD directories & configure path aliases

**What:** Create the FSD directory skeleton (`app/`, `pages/`, `widgets/`, `features/`, `entities/`, `shared/`) under `src/`. Add path aliases in `tsconfig.app.json` and `vite.config.ts` for each layer. The existing `features/` directory stays in place. The existing `@/*` alias remains for backwards compatibility during migration.

**Blocked by:** None — can start immediately.

### [#4](https://github.com/johandev21/memsystems-ai/issues/4) — Verify dev server starts with new structure

**What:** Run the dev server (`pnpm run dev:frontend`) to confirm the empty FSD directories don't break anything.

**Blocked by:** #3
