# Phase 5: App Layer

Extract app-wide providers and router configuration into `app/`.

**Goal:** `app/` owns providers, router setup, and global configuration.

## Tickets

### [#12](https://github.com/johandev21/memsystems-ai/issues/12) — Extract providers and router to app/

**What:** Move QueryClient + ThemeProvider + Toaster from `__root.tsx` into `app/providers/`. Move router config into `app/`.

**Blocked by:** #9, #10, #11
