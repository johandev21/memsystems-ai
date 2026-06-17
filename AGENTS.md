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

## 4. Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

## 5. General Notes
- Prefer reading actual executable source code over README text, as the repository may still contain boilerplate template README content.
- All route handlers use Next.js App Router (`src/app/api/.../route.ts`).
- Feature services are in `src/features/` with a flat service-per-file pattern.
- Database: Drizzle ORM + PostgreSQL via `src/database/`.
- Auth: Better Auth via `src/lib/auth.ts` + `src/proxy.ts`.
