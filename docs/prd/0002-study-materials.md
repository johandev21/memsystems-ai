# PRD-0002: Study Materials, Folders, and Trash

> **Status:** Ready for build. This PRD specifies the next module after Notebooks and Sources.
> **Triage label:** `ready-for-agent`.
> **Parent PRD:** [PRD-0001](./0001-mvp-backend.md) — memsystems MVP Backend. PRD-0001 captures cross-cutting decisions (architecture, providers, encryption, SRS, generation); this PRD captures the build-level detail for the Study Materials module.
> **No issue tracker is configured yet.** When one is set up, this PRD should be sliced into issues via the `to-issues` skill.

## Problem Statement

The User needs to view, create, edit, organize, and delete the six kinds of Study Materials inside a Notebook. Folders provide a tree-shaped organizational layer that NotebookLM does not have. Trash provides a safety net for accidental deletions. Per-kind content shapes, locked during planning, enable rich, varied rendering in the frontend.

Currently, `study_materials` exists as a schema with a `kind` enum and a `content` JSONB column, but there is no controller, no service, no folder table, no soft-delete plumbing, and no validated content shapes. The frontend has Studio buttons and a tree shell but no real data flow.

## Solution

Build the Study Materials module as a single feature under `backend/app/src/features/study-materials/`, plus a `jobs/` directory for the daily hard-purge cron. The module ships behind the existing `auth` macro; no new auth flows.

1. **Schema migration** — extend `study_materials` with `title`, `folder_id`, and `deleted_at`; create `study_material_folders`; drop `study_materials.origin_simple_flashcard_id` (kept only on `notes`).
2. **Per-kind shape module** — TypeBox schemas for all six kinds, plus a discriminated-union validator keyed on `kind`.
3. **Folder service + controller** — full CRUD, soft delete with cascade to children, restore, rename, reparent.
4. **Study material service + controller** — full CRUD, soft delete, restore (with the walk-up rule), edit, move between folders, re-shuffle for Quizzes.
5. **Trash service + controller** — list per-Notebook trash, hard-delete, restore (delegate to folder/material restore).
6. **Hard-purge cron** — daily job (Bun scheduler) that hard-deletes rows with `deleted_at` older than 30 days.
7. **Integration tests** — against a real Postgres; cover the full surface plus the walk-up restore rule.

## User Stories

(PRD-0001 carries the User-facing stories 13-28 for Study Materials, Folders, and Trash. The stories below are the build-facing breakdown that maps to endpoints, services, and tests.)

1. As a User, I want to create a Study Material of any kind manually, with a title and a body, so that I can author content without using AI.
2. As a User, I want to update the title and the body of a Study Material, so that I can fix mistakes.
3. As a User, I want to delete a Study Material and have it appear in the Trash, so that I can recover it if I deleted by mistake.
4. As a User, I want to restore a Study Material from the Trash back to its folder (or to the Notebook root if its folder is also in the Trash), so that I can undo a deletion.
5. As a User, I want to permanently delete a Study Material from the Trash, so that I can clean up.
6. As a User, I want to create a Folder, name it, and place it at the Notebook root or inside another Folder, so that I can organize my Study Materials.
7. As a User, I want to rename and reparent a Folder, so that I can keep my organization current.
8. As a User, I want to delete a Folder and have all of its descendants appear in the Trash, so that I can recover any of them later.
9. As a User, I want to restore a Folder from the Trash, so that I can recover my organization.
10. As a User, I want to move a Study Material from one Folder to another (or to the Notebook root), so that I can reorganize.
11. As a User, I want a Quiz's options to be re-shuffled on demand, so that I can regenerate variety without rewriting the Quiz.
12. As a User, I want the server to reject an invalid Study Material body (e.g. a Quiz with 7 options, or a Roadmap with 4 nesting levels), so that I cannot corrupt my data.
13. As a User, I want the server to reject an unauthenticated request to any Study Material, Folder, or Trash endpoint, so that my data is private.

## Implementation Decisions

### Module layout

```
backend/app/src/features/study-materials/
├── shapes/
│   ├── quiz.ts
│   ├── simple-flashcard.ts
│   ├── report.ts
│   ├── roadmap.ts
│   ├── slide-deck.ts
│   ├── mind-map.ts
│   └── index.ts              # discriminated union + per-kind lookup
├── study-material.controller.ts
├── study-material.service.ts
├── study-material.repository.ts   # Drizzle queries (separation per backend AGENTS.md)
├── study-material-folder.controller.ts
├── study-material-folder.service.ts
├── study-material-folder.repository.ts
├── trash.controller.ts
├── trash.service.ts
└── index.ts                      # mounts the three controllers under the notebook prefix

backend/app/src/jobs/
└── hard-purge-trash.ts           # Bun-scheduled daily job
```

The three controllers are mounted at the notebook scope:

```
.notebookScope
  .use(studyMaterialController)        # /notebooks/:notebookId/study-materials/...
  .use(studyMaterialFolderController)  # /notebooks/:notebookId/folders/...
  .use(trashController)                # /notebooks/:notebookId/trash/...
```

### Database schema changes

A single Drizzle migration adds the following:

**`study_materials` (extend):**
- `title` — `varchar(200) NOT NULL`. Indexed.
- `folder_id` — `varchar` (nullable), FK to `study_material_folders.id`, `ON DELETE SET NULL`.
- `deleted_at` — `timestamp` (nullable). Indexed.
- DROP `origin_simple_flashcard_id` (kept on `notes` only).

**`study_material_folders` (new):**
- `id` — `varchar`, primary key, cuid.
- `notebook_id` — `varchar NOT NULL`, FK to `notebooks.id`, `ON DELETE CASCADE`. Indexed.
- `parent_id` — `varchar` (nullable), self-FK to `study_material_folders.id`, `ON DELETE CASCADE`. Indexed.
- `name` — `varchar(200) NOT NULL`.
- `created_at` — `timestamp NOT NULL DEFAULT now()`.
- `updated_at` — `timestamp NOT NULL DEFAULT now()` with `$onUpdate`.
- `deleted_at` — `timestamp` (nullable). Indexed.

**`generation_requests` (extend):**
- `target_folder_id` — `varchar` (nullable), FK to `study_material_folders.id`, `ON DELETE SET NULL`. Indexed.

The migration is one-shot. Existing rows (if any) need a backfill strategy for `title` (e.g. default to `"Untitled"` plus the row id).

### Per-kind content shapes

Every kind has a row-level `title` column. The body lives in `content` JSONB. The validation strategy is: pick the per-kind TypeBox schema based on the request's `kind` field and validate the `content` against it. A request whose `content` does not match the declared `kind` produces a 400.

#### Quiz

```ts
const QuizQuestionOption = t.Object({
  text: t.String({ minLength: 1, maxLength: 2000 }),
  explanation: t.String({ minLength: 1, maxLength: 2000 }),
});

const QuizQuestion = t.Object({
  id: t.String(),                                       // cuid
  prompt: t.String({ minLength: 1, maxLength: 2000 }),
  options: t.Array(QuizQuestionOption, { minItems: 2, maxItems: 6 }),
  correctOptionIndex: t.Integer({ minimum: 0 }),        // single correct, 0-based
});

const QuizContent = t.Object({
  questions: t.Array(QuizQuestion, { minItems: 1, maxItems: 50 }),
});
```

- 4 options by default; allowed range 2-6 (validated at the schema level).
- Exactly one correct answer per question (`correctOptionIndex` is a single integer, not an array).
- Every option carries a rationale: "this is correct because…" or "this is wrong because…".
- Options must be randomized at generation. A pure `shuffleQuizOptions(content)` function in the service is the single source of truth for the random-order policy. The function is also exposed as the `POST /study-materials/:smId/shuffle` endpoint for manual re-shuffles.

#### Simple Flashcard

```ts
const SimpleFlashcardContent = t.Object({
  front: t.String({ minLength: 1, maxLength: 10000 }),
  back: t.String({ minLength: 1, maxLength: 10000 }),
});
```

- Both fields are markdown (GFM).
- No cloze syntax, no hints, no auto-reverse.

#### Report

```ts
const ReportSection = t.Object({
  id: t.String(),
  heading: t.String({ minLength: 1, maxLength: 200 }),
  body: t.String({ minLength: 1, maxLength: 50000 }),
});

const ReportContent = t.Object({
  summary: t.Optional(t.String({ maxLength: 1000 })),
  sections: t.Array(ReportSection, { minItems: 1, maxItems: 50 }),
});
```

- Optional one-liner summary drives the cover view.
- Flat section list; sub-headings live in the markdown `body` of each section.

#### Roadmap

```ts
const RoadmapTopic = t.Object({
  id: t.String(),
  title: t.String({ minLength: 1, maxLength: 200 }),
  description: t.Optional(t.String({ maxLength: 5000 })),
  estimatedMinutes: t.Optional(t.Integer({ minimum: 0 })),
  order: t.Integer({ minimum: 0 }),
});

const RoadmapPhase = t.Object({
  id: t.String(),
  title: t.String({ minLength: 1, maxLength: 200 }),
  description: t.Optional(t.String({ maxLength: 5000 })),
  color: t.Optional(t.String({ pattern: "^#[0-9A-Fa-f]{6}$" })),
  order: t.Integer({ minimum: 0 }),
  topics: t.Array(RoadmapTopic, { maxItems: 100 }),
});

const RoadmapContent = t.Object({
  description: t.Optional(t.String({ maxLength: 5000 })),
  phases: t.Array(RoadmapPhase, { minItems: 1, maxItems: 20 }),
});
```

- 2 levels only (phases + topics). No subtopic nesting.
- Per-phase `color` is an optional hex string.
- Per-topic `estimatedMinutes` is an optional integer for timeline views.
- Array index is the source of truth for order; the explicit `order` field is kept for forward compatibility with a future "shuffle topics" feature.

#### Slide Deck

```ts
const SlideDeckSlide = t.Object({
  id: t.String(),
  title: t.String({ minLength: 1, maxLength: 200 }),
  body: t.String({ minLength: 1, maxLength: 10000 }),
  notes: t.Optional(t.String({ maxLength: 10000 })),
});

const SlideDeckContent = t.Object({
  slides: t.Array(SlideDeckSlide, { minItems: 1, maxItems: 100 }),
});
```

- All `body` fields are markdown (GFM).
- Optional `notes` per slide for speaker notes.

#### Mind Map

```ts
const MindMapNode = t.Object({
  id: t.String(),
  label: t.String({ minLength: 1, maxLength: 500 }),
  color: t.Optional(t.String({ pattern: "^#[0-9A-Fa-f]{6}$" })),
  position: t.Optional(t.Object({
    x: t.Number(),
    y: t.Number(),
  })),
});

const MindMapEdge = t.Object({
  id: t.String(),
  sourceId: t.String(),
  targetId: t.String(),
  label: t.Optional(t.String({ maxLength: 200 })),
  directed: t.Optional(t.Boolean()),   // default true
});

const MindMapContent = t.Object({
  rootId: t.Optional(t.String()),
  nodes: t.Array(MindMapNode, { minItems: 1, maxItems: 500 }),
  edges: t.Array(MindMapEdge, { maxItems: 2000 }),
});
```

- Optional `rootId` hints tree/radial layouts; absent, the graph is free-form.
- Optional per-node `color` (hex) for visual grouping.
- Optional per-node `position` (stored x/y) lets the User drag-and-drop and persist the layout; missing positions are computed by the frontend.
- Per-edge `directed` flag, default `true`. `false` means undirected association.

### Discriminated union

The service exposes a single `validateContent(kind, content)` function that picks the right TypeBox schema for the kind. The `content` payload is validated *against the kind declared by the request* — a Quiz-shaped body submitted with `kind: "report"` is rejected.

### Folders

- One Folder belongs to one Notebook (`notebooks.id` FK).
- One Folder has at most one parent (`parent_id` self-FK, nullable for root-level).
- Folders nest to any depth; no max-depth constraint.
- Folder names are not unique within a parent.
- Soft delete: setting `deleted_at` on a parent does **not** cascade-soft-delete its children (children get their own `deleted_at` set if the User explicitly deletes them or recursively deletes via the service). However, the **service** exposes a `deleteFolder` that walks the descendants and sets `deleted_at` on the whole subtree, so the User only has to click once.
- Restoring a Folder restores only the Folder itself; children stay in Trash and are restored individually.

### Soft delete and Trash

- Both `study_materials` and `study_material_folders` carry a nullable `deleted_at` timestamp.
- All default service queries filter `WHERE deleted_at IS NULL`.
- A per-Notebook `GET /notebooks/:notebookId/trash` returns soft-deleted Folders and Study Materials, tagged with their kind.
- Items are recoverable for **30 days**.
- A daily cron (`backend/app/src/jobs/hard-purge-trash.ts`) hard-deletes rows whose `deleted_at` is older than 30 days. The job is registered in `index.ts` with the Bun scheduler (interval 24h). The job body is a single SQL `DELETE ... WHERE deleted_at < now() - interval '30 days'` against both tables.

### Restore semantics

Restoring a Study Material:

1. Load the material from Trash.
2. If `folder_id` is null → restore to Notebook root (`folder_id = null`).
3. If `folder_id` is set and the folder is alive (`deleted_at IS NULL`) → restore to that folder.
4. If `folder_id` is set and the folder is in Trash → walk up the `parent_id` chain until the first folder with `deleted_at IS NULL`. If found, restore to that folder. If the chain ends with no alive ancestor, restore to Notebook root.
5. Set `deleted_at = null`. No cascade-restore of folders.

Restoring a Folder: the Folder returns; descendants stay in Trash. The User restores each child individually.

### Endpoint surface

All routes require the `auth` macro. The `:notebookId` path param is validated against `user.id` (the Notebook must belong to the authenticated User) inside the service layer; ownership mismatches return 403.

**Study materials** (under `/notebooks/:notebookId/study-materials`):
- `GET    /` — list active study materials. Query: `folderId?: string`, `kind?: StudyMaterialKind`. Returns an array ordered by `created_at DESC`.
- `POST   /` — create. Body: `{ kind, title, content, folderId?: string }`. Validates `content` against `kind`. Persists.
- `GET    /:smId` — read one.
- `PATCH  /:smId` — update. Body: `{ title?: string, content?: object }`. If `content` is present, the `kind` is the row's current kind; validation runs against it.
- `DELETE /:smId` — soft delete. Sets `deleted_at`. Returns the soft-deleted row.
- `POST   /:smId/restore` — restore. Returns the restored row.
- `DELETE /:smId/permanent` — hard delete. Returns 204. (Also exposed under `/trash/study-materials/:smId` for symmetry; pick one and document it.)
- `POST   /:smId/shuffle` — re-shuffle options. Quiz only. Returns the updated Quiz content.
- `PATCH  /:smId/folder` — move. Body: `{ folderId: string | null }`. Validates that the target folder belongs to the same Notebook and is not in Trash.

**Folders** (under `/notebooks/:notebookId/folders`):
- `GET    /` — list active folder tree. Returns a flat array of folders; the frontend assembles the tree. (Or returns a nested tree; pick one and document it. Default: flat with `parent_id` so the frontend controls layout.)
- `POST   /` — create. Body: `{ name, parentId?: string }`. Validates that `parentId` belongs to the same Notebook.
- `PATCH  /:folderId` — update. Body: `{ name?: string, parentId?: string | null }`. Rejects cycles (a folder cannot be reparented under one of its descendants).
- `DELETE /:folderId` — soft delete the folder and all descendants.
- `POST   /:folderId/restore` — restore the folder (children stay in Trash).

**Trash** (under `/notebooks/:notebookId/trash`):
- `GET    /` — list all soft-deleted items (folders + study materials), tagged with kind and `deleted_at`.
- `DELETE /study-materials/:smId` — hard delete.
- `DELETE /folders/:folderId` — hard delete. (Children that are not in Trash are unaffected; children that are in Trash remain soft-deleted and will be hard-purged on schedule.)

### Domain errors

Reuse the existing `DomainError` hierarchy in `backend/app/src/errors.ts`:
- `NotFoundError` — folder or study material does not exist or is in another Notebook.
- `ForbiddenError` — Notebook does not belong to the authenticated User.
- `BadRequestError` — `content` fails per-kind validation, the target folder is in Trash, a reparent would create a cycle, etc.

Controllers map these to 404 / 403 / 400 via `.onError`, following the existing `notebook.controller.ts` pattern.

### AI generation integration

The existing `generation_requests` table gains a `target_folder_id` column. The (future) `generation` module's endpoint accepts an optional `folderId` and writes the generated Study Materials with that `folder_id`. If `folderId` is omitted, generated materials land in the Notebook root. The Generation module's PRD should reference this column.

## Testing Decisions

- **External behavior only.** Tests assert on HTTP API responses (status, body shape). They do not assert on internal Drizzle query shapes or service call sequences. This matches PRD-0001's testing decisions.
- **Primary seam:** the HTTP API (Elysia controllers, via `app.handle(new Request(...))` in tests).
- **Secondary seam:** pure functions are unit-tested in isolation. The only one in this module is `shuffleQuizOptions(content)`. It must be a deterministic-but-random function (seedable for tests) that returns a new content object with each question's options reordered.
- **Integration tests** run against a real Postgres (test database). Each test gets a fresh schema state via Drizzle's `drizzle-kit push` or a transactional rollback.
- **Test surface:**
  - `study-material.service` — create, read, update, soft delete, restore (with the walk-up rule), move between folders, shuffle, list with `folderId`/`kind` filters, validation errors.
  - `study-material-folder.service` — create, rename, reparent, soft delete with cascade, restore, cycle prevention.
  - `trash.service` — list, hard-delete, restore-dispatch.
  - `hard-purge-trash` job — assert that rows older than 30 days are deleted, rows newer than 30 days remain.
  - `auth` macro — one integration test that an unauthenticated request returns 401.
  - `validateContent` — unit tests for each per-kind schema. At minimum: a valid Quiz passes, a Quiz with 7 options fails, a Report with an empty sections array fails, a Mind Map edge referencing a non-existent node fails (if we add referential-integrity checks at validation time; otherwise skip).
- **Prior art:** `backend/app/tests/unit/source-extraction.test.ts` and `web-scraper.test.ts` for unit-test patterns. The notebook and source services are integrated-tested through the existing dev-storage and source controllers. The pattern is: spin up the app in-process, hit the controller, assert the response.

## Out of Scope

- AI generation endpoints (covered by the future `generation` module; only the schema column is added here).
- Bulk operations on Study Materials (multi-select delete, multi-select move).
- Nested-folder contents in the Trash listing (the Trash is flat; the frontend expands soft-deleted folders client-side).
- Sharing Folders between Notebooks or between Users.
- Tagging Study Materials (only Notes are tagged in MVP).
- A `study_materials.origin_simple_flashcard_id` field — dropped, no Study Material is ever the target of a promotion.
- A `mind-map` layout algorithm on the server (positions are stored when present; otherwise the frontend computes a layout).
- A "real-time" websocket-based update for collaborative editing (single-User editing only in MVP).
- Folder move with descendants (the current `PATCH /folders/:folderId` reparents only the named folder; moving a whole subtree is a future feature).
- Configurable 30-day grace period (hard-coded in MVP; configurable in a future "settings" feature).

## Further Notes

- The frontend's `study-materials-tree.tsx` is mock data today; the real data shape is finalized in this PRD. The backend's `GET /folders` and `GET /study-materials` responses are the source of truth for the tree.
- `shuffleQuizOptions` is intentionally a pure function: same input shape, different output order per call. It is also called automatically by the (future) `generation` module for every Quiz it emits. The fact that re-shuffle is a separate endpoint is so the User can regenerate variety on existing Quizzes.
- The `origin_simple_flashcard_id` removal is non-breaking because, per PRD-0001, no Study Material is ever the target of a promotion. Promotion creates Notes, not other Study Materials. The column is documented in the migration as `DROP COLUMN origin_simple_flashcard_id` with a one-line comment explaining the rationale.
- The 30-day hard-purge cron is registered in `backend/app/src/index.ts`. The job itself is a thin function in `backend/app/src/jobs/hard-purge-trash.ts` that runs `DELETE ... WHERE deleted_at < now() - interval '30 days'` against both tables. The cron is a placeholder for future operational work (logging, retry, alerting).
- The `auth` macro is the only auth gate. No new auth flows are introduced.
- The `to-issues` skill should slice this PRD into: (1) schema migration, (2) per-kind shape module, (3) folder service + controller, (4) study material service + controller, (5) trash service + controller, (6) hard-purge cron, (7) test suite. Each is an independently-grabbable issue.
