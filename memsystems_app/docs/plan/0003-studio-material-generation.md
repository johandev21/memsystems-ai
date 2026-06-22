# Plan 0003: Studio Study-Material Generation & Folder Assignment

**Status:** Draft
**Owner:** Frontend workspace (notebook page) + generation feature
**Goals:** Wire the Studio panel + expanded study-materials dialog end-to-end so users can (1) create Quiz / Flashcards / Roadmap manually, (2) generate them via LLM with a brief-asking form, and (3) choose a destination folder for either path.

---

## 1. Scope

### In scope (v1)

- Three study-material kinds only: **Quiz**, **Flashcards** (simple_flashcard), **Roadmap**.
- Two creation paths: **manual** (form editor) and **LLM** (brief + source selection + folder).
- Single-step **brief form** for LLM: brief text, source multi-select, folder picker, model selector.
- **Folder picker**: tree-shaped popover listing real folders + "Notebook root" sentinel, with an inline "New folder" affordance.
- **Real data** in the expanded dialog's left tree (folders + materials fetched from API).
- Mobile parity for the expanded dialog (one shared component, layout-adapts).

### Out of scope (v1)

- Editing existing materials in place (route exists, no UI).
- Per-kind **viewers** beyond the most basic read-only rendering (Quiz list, Flashcard front/back list, Roadmap phase list). Viewers are kept minimal; the focus is creation.
- Reports, Slide Decks, Mind Maps (registered as "coming soon" in the UI but not wired).
- Drag-and-drop, rename, move, delete from the tree.
- Quiz re-shuffle, restore, permanent-delete, folder restore.
- Two-step wizard for the brief; live preview during manual editing; optimistic update on LLM completion.
- Folder reparenting, soft-delete from the UI, trash listing.

### User decisions (confirmed)

- **Expanded dialog right pane** behaves as an **inline state machine** that switches between (a) the picker, (b) the manual editor, (c) the LLM generation pane, and (d) the basic viewer.
- **Brief form** is a single step.
- **Manual editors** are minimal viable (title + folder + kind-specific fields + Save).
- **Folder UI** is a tree picker in the tree view + an inline "New folder" affordance.
- **Generation completion** shows a streaming preview in-place; on `{done: true}` the new material is inserted into the left tree and the right pane switches to a basic viewer.

---

## 2. Architecture at a glance

```
┌────────────────────────────────────────────────────────────────────────┐
│  Studio right-side panel  (StudioResources)                            │
│  ─ 6 resource buttons → onClick → opens GenerateBriefDialog for kind   │
│  ─ Inactive kinds (Report/SlideDeck/MindMap) → toast "coming soon"    │
└────────────────────────────────────────────────────────────────────────┘
                                  │ onClick
                                  ▼
            ┌──────────────────────────────────────┐
            │  GenerateBriefDialog                 │
            │  ─ brief (textarea)                  │
            │  ─ sources (SourceMultiSelect)       │
            │  ─ folder (FolderPicker)             │
            │  ─ model (ModelSelector)             │
            │  ─ "Generate" button                 │
            └──────────────────────────────────────┘
                                  │ POST /api/notebooks/[id]/generate
                                  │ (NDJSON stream)
                                  ▼
            ┌──────────────────────────────────────┐
            │  useGenerateStream (lib/generation)  │
            │  accumulates partial JSON,           │
            │  on {done:true} returns final        │
            └──────────────────────────────────────┘
                                  │
                                  ▼
            ┌──────────────────────────────────────┐
            │  GenerationPane (right pane)         │
            │  ─ live skeleton + last-partial text │
            │  ─ on done → invalidate queries +    │
            │    setQueryData → switch to viewer   │
            └──────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│  Expanded study-materials dialog  (ExpandedStudyMaterials)             │
│  ─ LEFT pane: StudyMaterialsTree (real data via useQuery)              │
│  ─ RIGHT pane: <RightPane mode={...}> (state machine)                  │
│      mode="picker"     → the 6 ResourceCard buttons (default)          │
│      mode="manual"     → <ManualEditorPane kind=…>                     │
│      mode="generating" → <GenerationPane kind=… requestId=…>           │
│      mode="viewer"     → <MaterialViewer materialId=…>                 │
│      mode="coming-soon"→ disabled card placeholder                     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data layer

### 3.1 `src/lib/study-materials.ts` (NEW)

Mirrors `src/lib/sources.ts` style. Exports:

- `StudyMaterialDTO` interface (matches API JSON response, snake_case → camelCase).
- `studyMaterialsQueryOptions(notebookId)` → key `["study-materials", notebookId]`.
- `studyMaterialQueryOptions(materialId)` → key `["study-material", materialId]`.
- `listStudyMaterials(notebookId, filters?)` — direct fetch helper for non-React callers.
- `getStudyMaterial(materialId)`.
- `createStudyMaterial(notebookId, { kind, title, content, folderId? })` → POST.
- `createEmptyStudyMaterial(kind)` — pure factory returning the per-kind empty content object (Quiz: 1 empty question, Flashcard: empty front/back, Roadmap: 1 empty phase with 1 empty topic).

**TDD tracer bullet:** test that `createEmptyStudyMaterial("quiz")` returns a value that passes `validateContent("quiz", content)` (round-trip). Test for each of the 3 kinds.

### 3.2 `src/lib/folders.ts` (NEW)

- `FolderDTO` interface.
- `foldersQueryOptions(notebookId)` → key `["study-material-folders", notebookId]`.
- `listFolders(notebookId)`.
- `createFolder(notebookId, { name, parentId? })` → POST.
- Helper: `buildFolderTree(folders: FolderDTO[]): FolderTreeNode[]` (pure, exported) — flattens a flat list into nested children based on `parentId`. Tested directly.

### 3.3 `src/lib/generation.ts` (NEW)

- `GenerateInput` interface (matches `GenerateInput` in `generation.service.ts`).
- `startGeneration(notebookId, input): { requestId: string; stream: AsyncIterable<GenerationEvent> }` — POSTs to `/api/notebooks/[id]/generate`, returns:
  - `requestId` from `X-Request-Id` header.
  - An `AsyncIterable<GenerationEvent>` that reads the NDJSON line-by-line, yielding:
    - `{ type: "partial", content: unknown }` for each partial JSON object.
    - `{ type: "done", requestId }` for the final line.
    - `{ type: "error", error: Error }` for network/parse failures.
- `GenerationEvent` is a discriminated union.

**TDD tracer bullet:** test `startGeneration` against a `Response`-like stub (use `new Response(new ReadableStream({...}), { headers: { "X-Request-Id": "req-1" } })`) to assert the partials are yielded in order and the final `{done:true}` is yielded last.

### 3.4 Test fixtures

Add to `tests/fixtures.ts`:

- `seedStudyMaterial(notebookId, input)` — minimal: `{ id?, kind, title, content, folderId?, deletedAt? }`.
- `seedStudyMaterialFolder(notebookId, input)` — minimal: `{ id?, name, parentId? }`.

These are thin wrappers; no service mocks.

### 3.5 API routes

- The existing routes are sufficient: `POST /api/notebooks/[id]/study-materials`, `POST /api/notebooks/[id]/generate`, `GET /api/notebooks/[id]/folders`, `POST /api/notebooks/[id]/folders`. **No new route handlers needed.**

---

## 4. UI layer

### 4.1 Shared components (NEW)

All under `src/features/notebook/components/studio/`:

| File | Purpose |
|---|---|
| `folder-picker.tsx` | Popover with tree of folders + "Notebook root" sentinel + inline "New folder" input. Calls `useCreateFolder`. Selected value is `string \| null` (null = root). |
| `source-multi-select.tsx` | Multi-select list of the notebook's sources. Uses `sourcesQueryOptions` for the list; selected IDs held in component state. |
| `brief-form.tsx` | The form body used by both `GenerateBriefDialog` and `ManualEditorPane`'s LLM section. Renders: brief textarea, `SourceMultiSelect`, `FolderPicker`, model selector. Pure UI, takes initial values + onChange. |
| `generate-brief-dialog.tsx` | The shadcn `Dialog` that wraps `BriefForm` for the right-side Studio panel buttons. |

### 4.2 Manual editors (NEW, one per kind)

`src/features/notebook/components/studio/editors/`:

- `quiz-editor.tsx` — title + folder + (per-question) prompt, 2-6 options with explanations, "Add question" / "Remove" buttons. Uses `useFieldArray`-style local state (no react-hook-form; keep it light — plain `useState`).
- `flashcard-editor.tsx` — title + folder + list of `{front, back}` pairs with Add/Remove. (Multi-card editing is a stretch — start with **single** front/back pair. PRD already permits this since flashcard content is `{front, back}`. We'll need to revisit `SimpleFlashcardContent` shape if we want multi-card; not in v1.)
- `roadmap-editor.tsx` — title + folder + phases; each phase has title + topics. Add/Remove phase, Add/Remove topic.

All editors:
- Render a `Title` field (required, max 200 chars).
- Render a `FolderPicker` (null = root).
- Render the kind-specific fields.
- On Save: `useCreateStudyMaterial` mutation; on success → invalidate `["study-materials", notebookId]` + close editor + emit `onSaved(materialId)`.
- Local state validated with the per-kind Zod schema on Save (matching the server's `validateContent`).

### 4.3 `ManualEditorPane` (NEW)

A dispatcher in `studio/manual-editor-pane.tsx`:

```ts
function ManualEditorPane({ kind, notebookId, onSaved, onCancel }: Props) {
  if (kind === "quiz") return <QuizEditor ... />;
  if (kind === "simple_flashcard") return <FlashcardEditor ... />;
  if (kind === "roadmap") return <RoadmapEditor ... />;
  return <ComingSoonPane kind={kind} />;
}
```

### 4.4 `GenerationPane` (NEW)

`src/features/notebook/components/studio/generation-pane.tsx`:

- Props: `{ notebookId, kind, requestId, partial: unknown, error?: Error, onComplete: (materialId: string) => void, onCancel: () => void, onRetry: () => void }`.
- Renders a skeleton with the kind's last-partial JSON serialized for inspection (no pretty formatting in v1; just `<pre>`).
- Cancel button: `POST /api/notebooks/[id]/generation-requests/[requestId]/cancel` then `onCancel`.
- On `done`: invalidates `["study-materials", notebookId]`, fetches the new material via `studyMaterialQueryOptions`, calls `onComplete(materialId)`.

### 4.5 `MaterialViewer` (NEW)

`src/features/notebook/components/studio/material-viewer.tsx`:

- Fetches via `studyMaterialQueryOptions(materialId)`.
- Renders a per-kind basic view:
  - **Quiz**: list of questions with options; correct option highlighted.
  - **Flashcard**: single card with `front` visible, click to flip to `back`.
  - **Roadmap**: ordered phases with topic lists.
- Read-only. Close button returns to picker.
- This is intentionally minimal — the goal is to confirm the material is in place, not to be a learning tool.

### 4.6 `RightPane` dispatcher (NEW)

`src/features/notebook/components/studio/right-pane.tsx`:

```ts
type Mode =
  | { kind: "picker" }
  | { kind: "manual"; materialKind: StudyMaterialKind }
  | { kind: "generating"; materialKind: StudyMaterialKind; requestId: string; partial: unknown }
  | { kind: "viewer"; materialId: string }
  | { kind: "coming-soon"; materialKind: StudyMaterialKind };

function RightPane({ notebookId, mode, onModeChange, targetFolderId }: Props) {
  switch (mode.kind) {
    case "picker":       return <PickerPane ... />;
    case "manual":       return <ManualEditorPane kind={mode.materialKind} ... />;
    case "generating":   return <GenerationPane ... />;
    case "viewer":       return <MaterialViewer materialId={mode.materialId} ... />;
    case "coming-soon":  return <ComingSoonPane kind={mode.materialKind} ... />;
  }
}
```

This is the single source of truth for the right pane. `ExpandedStudyMaterials` holds the `mode` state and passes `onModeChange` to the children.

### 4.7 `StudioResources` (MODIFY)

- Filter `RESOURCES` to only enable the 3 in-scope kinds.
- Add `onClick` to each enabled button → `onGenerate(kind)`.
- Pass `onGenerate` as a prop; the parent (`notebooks/[notebookId]/page.tsx`) opens the `GenerateBriefDialog`.
- "Coming soon" kinds render disabled with a tooltip.

### 4.8 `ExpandedStudyMaterials` (MODIFY)

- Right pane becomes `<RightPane mode={mode} onModeChange={setMode} ... />`.
- Left tree becomes a real-data tree (see §4.9).
- `onClick` on `ResourceCard` sets `mode` to `manual` (or `coming-soon`).
- Two buttons in the right pane: "Generate with AI" (opens a popover or switches to the brief form for LLM), "Create manually" (switches to manual). For v1 the cleaner UX is: each `ResourceCard` has two sub-buttons (or a single button that opens a sub-step). The simplest is to **replace the 6-card grid with 6 buttons that each open the `BriefForm` for LLM**, plus a small "Or create manually →" link below that switches to manual.

This is the cleanest match to your decision: "manual creation in the expanded study materials component" and "LLM generation in the buttons that appear inside the studio panel". The expanded dialog's right pane becomes an LLM-or-manual split for each kind.

**Final UX of right pane "picker" state:**

```
[Title: "Create a new study material"]
[Subtitle: "Pick a type"]

[Quiz card]   [Flashcards card]
[Roadmap card] [Report card - disabled: "Coming soon"]
[Slide Deck - disabled]   [Mind Map - disabled]

(when an enabled card is clicked, it becomes highlighted; reveal below:)

[ < Back ]      Quiz:    [Generate with AI]  |  [Create manually]
```

### 4.9 `StudyMaterialsTree` (MODIFY)

- Replace `fileTreeData` mock with a hook: `useStudyMaterialsTree(notebookId)` that:
  - Calls `useQuery(studyMaterialsQueryOptions(notebookId))`.
  - Calls `useQuery(foldersQueryOptions(notebookId))`.
  - Returns a tree-shaped `FileTreeItem[]` (folders interleaved with materials at each level).
- The tree now uses real data but the **shape stays the same** (the existing `FileTreeItem` interface is preserved — add a `onSelectMaterial?: (id: string) => void` prop). The default `onSelectMaterial` calls `onModeChange({ kind: "viewer", materialId: id })` in the parent.
- Folder rows: clicking the chevron toggles open; clicking the label is a no-op for v1.
- Material rows: clicking the label calls `onSelectMaterial(id)`.
- Folders get a small badge with the number of materials they contain (computed from the flat list — pure helper, tested).

**TDD tracer bullet:** test `buildFolderTree(flatList)` directly with no React; then test the hook (component test) by pre-populating the `queryCache` with folders + materials.

### 4.10 `StudyMaterialsPanel` (MODIFY)

- Pass `notebookId` prop through to `StudyMaterialsTree`.
- (No other changes.)

### 4.11 Mobile parity (MODIFY)

`mobile-expanded-study-materials.tsx` (102 lines) is structurally identical to the desktop expanded dialog but in a mobile container. **Refactor it to compose the same `RightPane` dispatcher and the same `StudyMaterialsTree`**; the only difference is the outer shell (Sheet/Drawer vs Dialog) and the panel sizes. The shared logic is in `RightPane` + the tree.

---

## 5. End-to-end flow

### 5.1 Manual flow (inside expanded dialog)

1. User opens expanded dialog. `mode = { kind: "picker" }`.
2. User clicks **Quiz** card. Highlight + reveal "Generate with AI" / "Create manually" sub-actions.
3. User clicks **Create manually** → `mode = { kind: "manual", materialKind: "quiz" }`.
4. `<QuizEditor>` renders. User fills title, folder, questions. Save calls `useCreateStudyMaterial`.
5. On success: invalidate `["study-materials", notebookId]`, `mode = { kind: "viewer", materialId }`.
6. `<MaterialViewer>` renders the new quiz.

### 5.2 LLM flow (from Studio right-side panel)

1. User clicks **Quiz** in the Studio right-side panel.
2. `GenerateBriefDialog` opens (an `shadcn Dialog` overlay, not inside the expanded dialog).
3. User fills brief, picks sources + folder + model, clicks **Generate**.
4. `startGeneration(notebookId, input)` opens the stream.
5. Dialog shows a loading state with the last partial. The `requestId` is captured.
6. On `{ done: true, requestId }`: dialog calls a passed `onComplete` callback, which:
   - Invalidates `["study-materials", notebookId]`.
   - Closes the dialog.
   - If the expanded dialog is open, switches its right pane to the viewer for the new material.
   - Otherwise, the new material appears in the tree and the user can click it.

### 5.3 LLM flow (from expanded dialog)

Same as 5.2 but step 2 is replaced with: the expanded dialog's right pane switches to an inline `BriefForm` and the `GenerationPane` is rendered in-place. No overlay.

---

## 6. Phased implementation (TDD vertical slices)

Each phase is a tracer bullet: one behavior end-to-end, then expand.

### Phase 1 — Query layer (backend already exists)

- **RED:** `tests/component/study-materials-tree.test.tsx` — render the tree with a pre-populated `queryCache` (folders + materials); assert it shows both.
- **GREEN:** add `studyMaterialsQueryOptions` and `foldersQueryOptions`; replace the mock `fileTreeData` in the tree with these queries. (The `vi.hoisted` `queryCache` pattern from `chat-panel.test.tsx` is the template.)
- **RED→GREEN loop:** add `createStudyMaterial` mutation; test it invalidates the right key.

### Phase 2 — Per-kind empty content + Zod input schemas

- **RED:** `tests/lib/study-materials.test.ts` — assert `createEmptyStudyMaterial("quiz")` round-trips through `validateContent("quiz", content)`. Same for flashcard and roadmap.
- **GREEN:** add `createEmptyStudyMaterial` + per-kind Zod input schemas (e.g. `QuizInput = QuizContent.deepPartial()` style).
- **Why this comes second:** all downstream editors and the `GenerateBriefDialog` rely on this factory.

### Phase 3 — Manual editors (one per kind, vertical slice per kind)

- **RED→GREEN for Quiz:** render `<QuizEditor>` in isolation (component test) with a `queryCache` seeded for `["sources", notebookId]` and `["study-material-folders", notebookId]`. Add a question, save → assert `createStudyMaterial` called with the right `content` shape.
- **Same for FlashcardEditor.**
- **Same for RoadmapEditor.**
- (Three small tests, not three big ones; one assertion each round-tripping through the public form.)

### Phase 4 — FolderPicker

- **RED→GREEN:** test that selecting a folder calls `onChange(folderId | null)`; test "New folder" inline creates a folder via `useCreateFolder` and selects it.
- Lives in `studio/folder-picker.tsx`.

### Phase 5 — SourceMultiSelect

- **RED→GREEN:** test that toggling a source updates internal selection; test that the passed `value` prop initialises it.
- Lives in `studio/source-multi-select.tsx`.

### Phase 6 — `lib/generation.ts` + NDJSON consumer

- **RED→GREEN:** unit-test `startGeneration` with a fake `Response` containing a known NDJSON body. Assert partials in order, then `done` last.
- This is the trickiest piece; isolating it makes everything else trivial.

### Phase 7 — `GenerateBriefDialog` (Studio panel)

- **RED→GREEN:** render the dialog with a `queryCache` seeded for sources + folders + models. Fill brief, select source + folder, click Generate → assert `startGeneration` was called with the right input (mock `lib/generation.ts`).
- Mount the dialog from `studio-resources.tsx` `onClick`.

### Phase 8 — `GenerationPane`

- **RED→GREEN:** pass a fake `partial` + `requestId` → assert skeleton + last-partial shown. Pass `error` → assert error message + Retry button calls `onRetry`. Pass `done` → assert `onComplete` called with the new materialId after the `study-material` query resolves.

### Phase 9 — `MaterialViewer` (basic)

- **RED→GREEN:** render with a seeded quiz in the cache; assert questions + options + correct option visible. Same for flashcard (front shown, back shown on click). Same for roadmap (phases + topics).

### Phase 10 — RightPane dispatcher + ExpandedStudyMaterials wiring

- **RED→GREEN:** state-machine test: render `RightPane` in each mode; assert the right child renders. Then a small integration test: in `picker` mode, click Quiz → assert mode transitions to `manual` (or reveals the LLM/manual sub-actions). This is the only test for the dispatcher itself.

### Phase 11 — Mobile parity

- Refactor only, no new tests beyond the desktop ones (same `RightPane` is shared). Add a thin smoke test that `MobileExpandedStudyMaterials` renders the `RightPane` in `picker` mode.

### Phase 12 — Lint + typecheck + full test suite

- `pnpm run lint && pnpm run typecheck && pnpm run test`.
- Fix any fallout.

---

## 7. File-level deliverables (per phase)

| Phase | New files | Modified files | New tests |
|---|---|---|---|
| 1 | `src/lib/study-materials.ts`, `src/lib/folders.ts`, `src/lib/study-materials/tree.ts` (pure `buildFolderTree` helper) | `src/features/notebook/components/study-materials-tree.tsx`, `src/features/notebook/components/study-materials-panel.tsx`, `tests/fixtures.ts` (+ `seedStudyMaterial`, `seedStudyMaterialFolder`) | `tests/component/study-materials-tree.test.tsx` |
| 2 | `src/lib/study-materials/editor-schemas.ts` (per-kind input zod + `createEmptyStudyMaterial`) | — | `tests/lib/study-materials.test.ts` |
| 3 | `src/features/notebook/components/studio/editors/{quiz,flashcard,roadmap}-editor.tsx`, `studio/manual-editor-pane.tsx` | — | `tests/component/quiz-editor.test.tsx`, `flashcard-editor.test.tsx`, `roadmap-editor.test.tsx` |
| 4 | `src/features/notebook/components/studio/folder-picker.tsx` | — | `tests/component/folder-picker.test.tsx` |
| 5 | `src/features/notebook/components/studio/source-multi-select.tsx` | — | `tests/component/source-multi-select.test.tsx` |
| 6 | `src/lib/generation.ts` | — | `tests/lib/generation.test.ts` |
| 7 | `src/features/notebook/components/studio/brief-form.tsx`, `studio/generate-brief-dialog.tsx` | `src/features/notebook/components/studio-resources.tsx`, `src/app/notebooks/[notebookId]/page.tsx` | `tests/component/generate-brief-dialog.test.tsx` |
| 8 | `src/features/notebook/components/studio/generation-pane.tsx` | — | `tests/component/generation-pane.test.tsx` |
| 9 | `src/features/notebook/components/studio/material-viewer.tsx` | — | `tests/component/material-viewer.test.tsx` |
| 10 | `src/features/notebook/components/studio/right-pane.tsx` | `src/features/notebook/components/expanded-study-materials.tsx` | `tests/component/right-pane.test.tsx`, `tests/component/expanded-study-materials.test.tsx` |
| 11 | — | `src/features/notebook/components/mobile-expanded-study-materials.tsx` | `tests/component/mobile-expanded-study-materials.test.tsx` (smoke) |
| 12 | — | — | (run all existing tests) |

**Target:** ~12 new test files, ~25-30 new tests, all green. Total tests should grow from 72 → ~100.

---

## 8. Risk register

| Risk | Mitigation |
|---|---|
| `partialOutputStream` from `ai` SDK may yield deep partials that break JSON-line parsing if the schema is large | The existing route already serializes via `JSON.stringify(partial) + "\n"` server-side. We just need to `JSON.parse` per line. If a parse fails, emit a non-fatal warning event and continue. |
| `useQuery` for `study-materials` returning a large list could be slow | The PRD only requires `?folderId` + `?kind` filters; we'll always fetch the full list for v1 and assemble the tree client-side. If perf becomes a concern, switch to per-folder queries. |
| `RightPane` state machine could get unwieldy with 5 modes | The dispatcher is intentionally shallow (one switch). Adding more modes (e.g. "renaming folder") is a small additive change. |
| `MaterialViewer` is intentionally minimal — could be mistaken for "the full viewer" | The viewer is annotated as read-only confirmation. No learn-mode, no edit, no export. v1's purpose is to close the loop on creation, not replace the eventual full viewer. |
| Mobile dialog uses different outer chrome (Sheet vs Dialog) — refactor could regress the mobile experience | The mobile expanded dialog already mirrors the desktop one line-for-line except the outer wrapper. We extract the shared body and the only diff is the wrapper. Smoke test in Phase 11 catches regressions. |
| Cancellation race: user closes dialog while the LLM is streaming | `GenerateBriefDialog`'s cleanup calls `cancel(requestId)`. The server has the cancel route. On 404, ignore. |

---

## 9. Out-of-scope notes for follow-up

- `POST /api/study-materials/[id]/shuffle` — backend `shuffle` exists, route doesn't; not needed for v1.
- `POST /api/folders/[id]/restore` — service method exists, route doesn't; not needed for v1.
- `PATCH /api/study-materials/[id]/folder` for move — `StudyMaterialService.move` exists, route doesn't; not needed for v1.
- Trash UI — `trash.service.ts` exists with `list`; no UI. Not in v1.
- Reports, Slide Decks, Mind Maps — placeholder disabled state. Will be enabled in a follow-up that extends `manual-editor-pane.tsx` and `material-viewer.tsx` with two new branches each.

---

## 10. Definition of done

- [ ] A user can open the expanded study-materials dialog and create a Quiz / Flashcards / Roadmap manually with a chosen folder.
- [ ] A user can click a Studio right-side panel button (Quiz / Flashcards / Roadmap) and, after filling a brief form, see the material stream into existence and appear in the tree.
- [ ] A user can create folders inline from the folder picker and use them as the destination for both manual and LLM paths.
- [ ] The left tree shows real data (folders + materials) instead of the `fileTreeData` mock.
- [ ] The mobile expanded dialog has feature parity with the desktop.
- [ ] `pnpm run lint && pnpm run typecheck && pnpm run test` is green.
- [ ] No new routes were added (all backend was already in place).
- [ ] No mocking of `db` in any new test; only `streamText`, `connectionService`, and `fetch` are mocked, matching the existing testing policy.
