# Phase 6: Cross-Import Resolution & Widgets

The core architectural phase. The `notebooks` feature acts as a composition layer — it belongs in `widgets/`.

**Goal:** Zero cross-imports between features. `notebooks` becomes `widgets/notebook-workspace`.

## Tickets

### [#13](https://github.com/johandev21/memsystems-ai/issues/13) — Extract notebook-workspace widget

**What:** Move workspace container and layouts into `widgets/notebook-workspace/`.

**Blocked by:** #8, #9, #10

### [#14](https://github.com/johandev21/memsystems-ai/issues/14) — Resolve model-persistence cross-import

**What:** Ensure `useModelPersistence` is in the `notebooks` public API.

**Blocked by:** #13

### [#15](https://github.com/johandev21/memsystems-ai/issues/15) — Resolve notebook-chat → notebooks UI imports

**What:** Update notebook-chat to import notebook UI through barrel.

**Blocked by:** #13, #14

### [#16](https://github.com/johandev21/memsystems-ai/issues/16) — Resolve study-materials → notebooks UI imports

**What:** Update study-materials to import notebook UI through barrel. Relocate `ai-elements/`.

**Blocked by:** #13, #14
