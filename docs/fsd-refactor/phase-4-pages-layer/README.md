# Phase 4: Pages Layer

Move page-specific code out of `components/` and into `pages/`.

**Goal:** Each route has a corresponding page slice under `pages/`.

## Tickets

### [#9](https://github.com/johandev21/memsystems-ai/issues/9) — Extract home page to pages/home

**What:** Move `components/home/` into `pages/home/ui/`. Update route.

**Blocked by:** #7

### [#10](https://github.com/johandev21/memsystems-ai/issues/10) — Extract notebooks list page to pages/notebooks

**What:** Move inline notebooks list logic from route into `pages/notebooks/ui/`.

**Blocked by:** #7

### [#11](https://github.com/johandev21/memsystems-ai/issues/11) — Extract settings & login pages

**What:** Move settings (333 lines) and login inline logic into `pages/settings/ui/` and `pages/login/ui/`.

**Blocked by:** #7
