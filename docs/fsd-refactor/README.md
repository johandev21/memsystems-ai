# FSD v2.1 Refactor Plan

Migrate the `frontend/` codebase from its current structure to Feature-Sliced Design v2.1.

**Tracking issue:** [#2](https://github.com/johandev21/memsystems-ai/issues/2)

## Current State

```
frontend/src/
  components/     # Mixed: UI kit, page-specific, layout, branding, shared
  features/       # 5 domain features, but cross-imports between them
  lib/            # API client, auth, utils
  routes/         # TanStack Router file-based routes (thin)
```

**Key problems:**
- 31+ cross-feature imports violating encapsulation
- `components/` is a catch-all for unrelated concerns
- No public APIs on features (only `features/ai/` has `index.ts`)
- Page-specific code lives in `components/home/` instead of `pages/`

## Target State

```
frontend/src/
  app/            # Providers, router config
  pages/          # Route-level composition (home, notebooks, settings, login)
  widgets/        # Notebook-workspace (composes chat + sources + study-materials)
  features/       # notebook-chat, sources, study-materials, notebooks-settings
  entities/       # Shared domain types if needed (evaluated in Phase 7)
  shared/         # UI kit, utils, API client, auth
```

## Phases

| Phase | Focus | Tickets | GitHub Issues |
|-------|-------|---------|---------------|
| [1 — Foundation](phase-1-foundation/) | Scaffold dirs, path aliases | 2 | [#3](https://github.com/johandev21/memsystems-ai/issues/3), [#4](https://github.com/johandev21/memsystems-ai/issues/4) |
| [2 — Shared Layer](phase-2-shared-layer/) | Move UI kit, utils, API, auth | 3 | [#5](https://github.com/johandev21/memsystems-ai/issues/5)–[#7](https://github.com/johandev21/memsystems-ai/issues/7) |
| [3 — Feature Public APIs](phase-3-feature-apis/) | Add index.ts to all features | 1 | [#8](https://github.com/johandev21/memsystems-ai/issues/8) |
| [4 — Pages Layer](phase-4-pages-layer/) | Move page code to pages/ | 3 | [#9](https://github.com/johandev21/memsystems-ai/issues/9)–[#11](https://github.com/johandev21/memsystems-ai/issues/11) |
| [5 — App Layer](phase-5-app-layer/) | Extract providers, router | 1 | [#12](https://github.com/johandev21/memsystems-ai/issues/12) |
| [6 — Cross-Imports & Widgets](phase-6-cross-imports-widgets/) | Resolve coupling, extract widget | 4 | [#13](https://github.com/johandev21/memsystems-ai/issues/13)–[#16](https://github.com/johandev21/memsystems-ai/issues/16) |
| [7 — Entities Layer](phase-7-entities-layer/) | Extract shared domain types | 1 | [#17](https://github.com/johandev21/memsystems-ai/issues/17) |
| [8 — Cleanup & Validation](phase-8-cleanup-validation/) | Remove legacy, Steiger, audit | 2 | [#18](https://github.com/johandev21/memsystems-ai/issues/18), [#19](https://github.com/johandev21/memsystems-ai/issues/19) |

**Total: 17 tickets across 8 phases.**

## Principles

- Each phase leaves the app buildable and runnable
- Imports are updated in the same ticket as the file move (expand-then-contract)
- Cross-import resolution uses FSD strategies A-D (merge, push to entities, compose from above, public API)
- The `notebooks` feature becomes a `widget` since it composes multiple features
