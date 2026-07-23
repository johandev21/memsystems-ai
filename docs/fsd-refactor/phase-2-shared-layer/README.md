# Phase 2: Shared Layer

Move all infrastructure code (UI kit, utilities, API client, auth) into `shared/`. This is a wide refactor — expand by creating the new locations, then update all imports, then remove the old locations.

**Goal:** All non-business infrastructure lives in `shared/` with segment-based organization.

## Tickets

### [#5](https://github.com/johandev21/memsystems-ai/issues/5) — Migrate UI kit to shared/ui

**What:** Move `components/ui/` (29 shadcn components), `components/shared/` (confirm-delete-dialog, spinner), and `components/branding/` (logo, notebook-icon) into `shared/ui/`. Update every import.

**Blocked by:** #3

### [#6](https://github.com/johandev21/memsystems-ai/issues/6) — Migrate infrastructure to shared/lib, shared/api, shared/auth

**What:** Move `lib/utils.ts` to `shared/lib/`. Move `lib/api-client/` to `shared/api/`. Move `lib/auth/` to `shared/auth/`. Create barrel files. Update all imports.

**Blocked by:** #3

### [#7](https://github.com/johandev21/memsystems-ai/issues/7) — Remove legacy components/ and lib/ directories

**What:** After all imports migrated, delete `components/` and `lib/`. Relocate `components/ai-elements/` to `features/ai/ui/`.

**Blocked by:** #5, #6
