# Phase 7: Entities Layer

Evaluate whether shared domain types warrant an `entities/` layer.

**Goal:** Extract shared domain types only if used in 2+ places with stable boundaries.

## Tickets

### [#17](https://github.com/johandev21/memsystems-ai/issues/17) — Evaluate and extract shared domain types

**What:** Audit domain types. Extract `Notebook`, `Source`, `StudyMaterialKind` to `entities/` if multi-consumer.

**Blocked by:** #15, #16
