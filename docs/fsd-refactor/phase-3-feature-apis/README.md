# Phase 3: Feature Public APIs

Every FSD slice must export through an `index.ts`. Currently only `features/ai/` has one.

**Goal:** Each feature has a single `index.ts` that defines its public contract.

## Tickets

### [#8](https://github.com/johandev21/memsystems-ai/issues/8) — Add public API (index.ts) to all features

**What:** Create `index.ts` for `notebook-chat`, `notebooks`, `sources`, and `study-materials`. Update every cross-feature import to go through barrels.

**Blocked by:** #7
