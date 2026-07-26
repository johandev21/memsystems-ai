# memsystems - Agent Instructions

pnpm workspace: `frontend/` (Vite + React 19) + `backend/` (NestJS 11). Turborepo.

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm run dev` | Parallel dev servers (frontend :3000, backend :4000) |
| `pnpm run dev:frontend` | `--filter frontend` |
| `pnpm run dev:backend` | `--filter backend` |
| `pnpm run build` | Build both packages |
| `pnpm run typecheck` | `tsc --noEmit` in both |
| `pnpm run lint` | oxlint (frontend) + ESLint (backend) |
| `pnpm run test` | Vitest (backend only) |

**Quality Gate**: `lint` -> `typecheck` -> `test`.

**Single-package**: `pnpm --filter <name> run <cmd>` (`frontend`, `backend`).

**PowerShell workaround**: `cmd /c "cd /d <pkg-dir> && pnpm run test"`.

## Docs

- [Architecture](docs/architecture.md) — package structure, entrypoints, key patterns
- [Testing](docs/testing.md) — backend test setup, fixtures, DB lifecycle
- [Database](docs/database.md) — schema, drizzle-kit, connections
- [FSD Conventions](docs/fsd-conventions.md) — feature-sliced design rules for frontend

## Skills

Skills from `.agents/skills/` can be loaded via `skill` tool.
