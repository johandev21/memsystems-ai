# Architecture Refactoring Plan

## Overview

Refactor the codebase to follow clean code practices and improve folder structure. The plan is organized into 9 phases, ordered by impact/risk.

**Repo root**: `memsystems_app/`
**Current branch**: (confirm before starting)

---

## Phase 0 — Fix `notebook/` vs `notebooks/` naming inconsistency

**Problem**: `src/features/notebook/` (singular, UI-only) and `src/features/notebooks/` (plural, service-only) split the same entity under different names. Every other feature bundles services + components under one directory.

**Steps**:

1. Move all contents of `src/features/notebook/` into `src/features/notebooks/`:
   - `components/ → features/notebooks/components/`
   - `hooks/ → features/notebooks/hooks/`
   - `notebook.css → features/notebooks/notebook.css`

2. Delete `src/features/notebook/` (empty directory)

3. Update ALL import paths referencing `@/features/notebook/` to `@/features/notebooks/`. Affected files (14 references):

   | File | Import |
   |------|--------|
   | `features/notebook-chat/components/chat-panel.tsx:24` | `NotebookBanner` |
   | `features/notebook-chat/components/chat-panel-header.tsx:4` | `NotebookSettingsDialog` |
   | `features/notebook-chat/components/composer.tsx:10` | `useTextareaAutosize` |
   | `features/notebook-chat/components/composer.tsx:11` | `ModelSelector` |
   | `features/sources/components/add-source-dialog.tsx:34` | `useTextareaAutosize` |
   | `features/study-materials/components/generation/BriefForm.tsx:8` | `useTextareaAutosize` |
   | `features/study-materials/components/generation/BriefForm.tsx:11` | `DialogModelSelector` |
   | `features/study-materials/components/generation/BriefForm.tsx:12` | `FolderPicker` |
   | `features/study-materials/components/generation/BriefForm.tsx:13` | `SourceMultiSelect` |
   | `features/study-materials/components/editors/EditorShell.tsx:11` | `FolderPicker` |
   | `features/study-materials/components/tree/expanded-study-materials.tsx:25` | right-pane imports |
   | `features/study-materials/components/tree/mobile-expanded-study-materials.tsx:21` | right-pane imports |
   | `app/notebooks/[notebookId]/page.tsx:24` | `MobileNotebookLayout` |
   | `app/notebooks/[notebookId]/page.tsx:27` | `StudioResources` |

4. Remove the existing `src/features/notebooks/notebook.service.ts` import references are already correct (they use `@/features/notebooks/notebook.service`).

5. Run `pnpm run typecheck && pnpm run lint` to verify.

---

## Phase 1 — Organize `src/lib/`

**Problem**: `src/lib/` is a dumping ground with 21 files mixing API client wrappers, storage backends, utilities, error types, a cron job, crypto, and loggers. No subdirectory organization.

**Steps**:

1. Create the following subdirectory structure under `src/lib/`:

```
src/lib/
  utils/
    index.ts          -- cn(), getApiUrl(), getFetchOptions(), fetchApi() (moved from utils.ts)
  errors/
    domain-error.ts   -- DomainError + subclasses (moved from errors.ts)
    api-error.ts      -- toErrorResponse() (moved from api-error.ts)
  auth/
    server.ts         -- betterAuth instance + getSession() (moved from auth.ts, session.ts)
    client.ts         -- authClient (moved from auth-client.ts)
  logging/
    logger.ts         -- server Logger (moved from logger.ts)
    client-logger.ts  -- client ClientLogger (moved from client-logger.ts)
    correlation.ts    -- correlationStorage (moved from correlation-storage.ts)
  crypto/
    index.ts          -- encrypt/decrypt (moved from crypto.ts)
  storage/
    local-fs.ts       -- (unchanged, already here)
    s3-backend.ts     -- (unchanged, already here)
    s3-client.ts      -- (unchanged, already here)
  jobs/
    hard-purge-trash.ts  -- (moved from lib/jobs/hard-purge-trash.ts)
  api-client/
    factory.ts        -- createQueryOptions(), createMutation() shared helpers
    chat.ts           -- (reduced using factory)
    folders.ts        -- (reduced using factory)
    generation.ts     -- (keep as-is, has genuine business logic)
    models.ts         -- (reduced using factory)
    notebooks.ts      -- (reduced using factory)
    sources.ts        -- (reduced using factory)
    study-materials.ts -- (reduced using factory)
```

2. Create `src/lib/api-client/factory.ts`:

```typescript
import { queryOptions, type QueryOptions } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";

interface ApiError {
  error?: string;
}

function createApiError(res: Response): string {
  return `Request failed (${res.status})`;
}

export function createQueryOptions<TData>(
  queryKey: string[],
  url: string,
  options?: {
    staleTime?: number;
    refetchOnMount?: boolean | "always";
  },
): QueryOptions<TData> {
  return queryOptions({
    queryKey,
    queryFn: async () => {
      const res = await fetchApi(url);
      if (!res.ok) throw new Error(createApiError(res));
      return res.json() as Promise<TData>;
    },
    staleTime: options?.staleTime ?? 30_000,
    refetchOnMount: options?.refetchOnMount,
  });
}

export async function apiPost<TInput, TResponse>(
  url: string,
  input: TInput,
): Promise<TResponse> {
  const res = await fetchApi(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = (await res.json().catch(() => ({}))) as ApiError;
  if (!res.ok) {
    throw new Error(data.error ?? createApiError(res));
  }
  return data as TResponse;
}

export async function apiDelete(url: string): Promise<void> {
  const res = await fetchApi(url, { method: "DELETE" });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as ApiError;
    throw new Error(data.error ?? createApiError(res));
  }
}
```

3. Refactor each `api-client/*.ts` file to use the factory. Example for `sources.ts`:

```typescript
import { createQueryOptions, apiPost, apiDelete } from "./factory";
import type { Source } from "@/features/notebooks/shapes";

export const sourcesQueryOptions = (notebookId: string) =>
  createQueryOptions<Source[]>(["sources", notebookId], `/api/notebooks/${notebookId}/sources`);

export const createTextSource = (notebookId: string, input: { title: string; rawText: string }) =>
  apiPost(`/api/notebooks/${notebookId}/sources/text`, input);

export const deleteSource = (sourceId: string) =>
  apiDelete(`/api/sources/${sourceId}`);
```

4. Update ALL import paths referencing the old `@/lib/*` locations. Use grep to find every reference:
   - `@/lib/api-error` → `@/lib/errors/api-error`
   - `@/lib/errors` → `@/lib/errors/domain-error`
   - `@/lib/auth` → `@/lib/auth/server`
   - `@/lib/auth-client` → `@/lib/auth/client`
   - `@/lib/session` → `@/lib/auth/server` (export `getSession` from same file as `auth`)
   - `@/lib/correlation-storage` → `@/lib/logging/correlation`
   - `@/lib/chat` → `@/lib/api-client/chat`
   - `@/lib/folders` → `@/lib/api-client/folders`
   - `@/lib/generation` → `@/lib/api-client/generation`
   - `@/lib/models` → `@/lib/api-client/models`
   - `@/lib/notebooks` → `@/lib/api-client/notebooks`
   - `@/lib/sources` → `@/lib/api-client/sources`
   - `@/lib/study-materials` → `@/lib/api-client/study-materials`
   - `@/lib/logger` → `@/lib/logging/logger`
   - `@/lib/client-logger` → `@/lib/logging/client-logger`
   - `@/lib/crypto` → `@/lib/crypto`

5. Update `components.json` alias `@/lib/utils` → `@/lib/utils/index`.

6. Run `pnpm run typecheck && pnpm run lint`.

---

## Phase 2 — Route middleware & error handling

**Problem**: Auth check duplicated 49 times across 33 route files. Error handling inconsistent (only 14/33 routes use `toErrorResponse`). Two Zod validation styles (`.parse()` vs `safeParse()`).

**Steps**:

1. Create `src/app/api/_shared/route-utils.ts`:

```typescript
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { DomainError } from "@/lib/errors/domain-error";
import { getSession } from "@/lib/auth/server";

export type RouteHandler<TParams = void> = (
  req: Request,
  context: { params: Promise<TParams>; session: NonNullable<Awaited<ReturnType<typeof getSession>>> },
) => Promise<Response>;

export async function withRoute<TParams>(
  req: Request,
  context: { params: Promise<TParams> },
  handler: RouteHandler<TParams>,
): Promise<Response> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return await handler(req, { params: context.params, session });
  } catch (err) {
    if (err instanceof DomainError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof ZodError) {
      const details = err.issues.map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
        return `${path}: ${issue.message}`;
      });
      return NextResponse.json({ error: details.join("; ") }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function parseBody<T>(req: Request, schema: Zod.Schema<T>): Promise<T> {
  const body = await req.json();
  return schema.parse(body);
}
```

2. Refactor EVERY route file to use `withRoute`. Pattern:

```typescript
// BEFORE (old style)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const result = await service.get(session.user.id, id);
    return NextResponse.json(result);
  } catch (err) {
    return toErrorResponse(err);
  }
}

// AFTER (new style)
export const GET = (req: Request, context: { params: Promise<{ id: string }> }) =>
  withRoute(req, context, async ({ params, session }) => {
    const { id } = await params;
    const result = await service.get(session.user.id, id);
    return NextResponse.json(result);
  });
```

3. For the 4 routes that contain inline business logic (`notebooks/route.ts` GET, `chat/route.ts` POST, `banner/route.ts` POST, `generate/route.ts` POST):
   - Extract logic into the respective service file
   - Then apply `withRoute`

4. Remove `import { toErrorResponse } from "@/lib/api-error"` and `import { getSession } from "@/lib/session"` from all route files.

5. Delete `src/lib/api-error.ts` (moved into `route-utils.ts`).

6. Run `pnpm run typecheck && pnpm run lint`.

**Route files to update (33 files)**:

```
app/api/ai/connection/route.ts
app/api/ai/models/route.ts
app/api/cards/route.ts
app/api/cards/[id]/review/route.ts
app/api/folders/[id]/route.ts
app/api/note-types/route.ts
app/api/note-types/[id]/route.ts
app/api/notes/route.ts
app/api/notes/[id]/route.ts
app/api/notebooks/route.ts
app/api/notebooks/[id]/route.ts
app/api/notebooks/[id]/banner/route.ts
app/api/notebooks/[id]/chat/route.ts
app/api/notebooks/[id]/folders/route.ts
app/api/notebooks/[id]/generate/route.ts
app/api/notebooks/[id]/generation-requests/[requestId]/cancel/route.ts
app/api/notebooks/[id]/sources/route.ts
app/api/notebooks/[id]/sources/file/route.ts
app/api/notebooks/[id]/sources/text/route.ts
app/api/notebooks/[id]/sources/url/route.ts
app/api/notebooks/[id]/study-materials/route.ts
app/api/notebooks/[id]/trash/route.ts
app/api/promote/route.ts
app/api/sources/[id]/route.ts
app/api/sources/[id]/download/route.ts
app/api/study-materials/[id]/route.ts
app/api/study-materials/[id]/restore/route.ts
app/api/study-materials/[id]/trash/route.ts
app/api/tags/route.ts
app/api/tags/[id]/route.ts
```

(Exclude `app/api/auth/[...all]/route.ts` — it delegates to Better Auth.)

---

## Phase 3 — Decompose `generation.service.ts` (878 lines)

**Problem**: The largest file in the codebase. `generate()` is ~280 lines, `normalizeContent()` is ~348 lines. Native structured output path and fallback path duplicate ~150 lines.

**Steps**:

1. Create `src/features/notebooks/generation/` directory.

2. Extract `content-normalizer.ts`:

```typescript
// Takes AI raw output and normalizes to each study material kind's shape
export function normalizeQuizContent(content: unknown): QuizContent { ... }
export function normalizeFlashcardContent(content: unknown): SimpleFlashcardContent { ... }
export function normalizeReportContent(content: unknown): ReportContent { ... }
export function normalizeRoadmapContent(content: unknown): RoadmapContent { ... }
export function normalizeSlideDeckContent(content: unknown): SlideDeckContent { ... }
export function normalizeMindMapContent(content: unknown): MindMapContent { ... }

export function normalizeContent(kind: StudyMaterialKind, content: unknown): object {
  switch (kind) {
    case "quiz": return normalizeQuizContent(content);
    case "simple_flashcard": return normalizeFlashcardContent(content);
    // ...
  }
}
```

3. Extract `prompt-builder.ts`:

```typescript
export function buildSystemPrompt(kind: StudyMaterialKind, sourceTexts: string[]): string { ... }
export function buildGenerateTitlePrompt(kind: StudyMaterialKind, content: object): string { ... }
```

4. Extract `stream-handler.ts`:

```typescript
export function createGenerationStream(
  aiStream: AsyncIterable<string>,
  onPartial: (chunk: string) => void,
  onDone: (requestId: string, materialId?: string) => void,
  onError: (error: Error) => void,
): ReadableStream { ... }
```

5. Extract `request-manager.ts`:

```typescript
export class GenerationRequestManager {
  async create(userId: string, notebookId: string, input: StartGenerationInput): Promise<string> { ... }
  async markCompleted(requestId: string, materialId?: string): Promise<void> { ... }
  async markFailed(requestId: string, error: string): Promise<void> { ... }
  async cancel(userId: string, requestId: string): Promise<void> { ... }
}
```

6. Strip `generation.service.ts` to an orchestrator (~80 lines):

```typescript
export class GenerationService {
  constructor(
    private readonly requestManager = new GenerationRequestManager(),
    private readonly streamHandler = new StreamHandler(),
  ) {}

  async generate(userId: string, notebookId: string, input: StartGenerationInput) {
    await this.assertNotebookOwner(userId, notebookId);
    this.connectionService.requireConnected(userId, input.model);
    const sourceTexts = await this.fetchSourceTexts(userId, notebookId, input.sourceIds);
    const requestId = await this.requestManager.create(userId, notebookId, input);
    const { stream, requestIdPromise } = this.streamHandler.createStream(
      userId, input, sourceTexts, requestId,
      (result) => this.requestManager.markCompleted(requestId, result.materialId),
      (error) => this.requestManager.markFailed(requestId, error),
    );
    return { stream, requestId: requestIdPromise };
  }

  async cancel(userId: string, requestId: string) {
    return this.requestManager.cancel(userId, requestId);
  }
}
```

7. Run `pnpm run typecheck && pnpm run lint` and `pnpm run test` (backend tests for generation).

---

## Phase 4 — Decompose oversized components

### 4a. `chat-message-list.tsx` (508 lines)

Extract into separate files within `features/notebook-chat/components/`:

| File | Content |
|------|---------|
| `custom-code-block.tsx` | `CustomCodeBlock` component (~105 lines) |
| `cited-sources.tsx` | `CitedSources` component (~50 lines) |
| `message-actions.tsx` | `MessageActions` component (~30 lines) |
| `user-message.tsx` | `UserMessage` component |
| `assistant-message.tsx` | `AssistantMessage` component |
| `streamdown-components.ts` | The `streamdownComponents` object |

### 4b. `study-materials-tree.tsx` (558 lines)

Extract:

| File | Content |
|------|---------|
| `tree-node.tsx` | Single tree node rendering |
| `confirm-delete-dialog.tsx` | Shared delete confirmation dialog |
| `study-materials-tree-helpers.ts` | Pure helper functions (already partially exists) |

### 4c. `chat-panel.tsx` (317 lines)

Extract `useChatPanel.ts` hook:

```typescript
export function useChatPanel(notebookId: string) {
  // model selection + localStorage
  // chat history loading
  // connection status
  // submit/regenerate handlers
  // all state management
  return {
    messages, connectionStatus, model, setModel,
    handleSubmit, handleRegenerate, handleCopy,
    isPending, clearHistory,
  };
}
```

### 4d. `add-source-dialog.tsx` (401 lines)

Extract:

| File | Content |
|------|---------|
| `file-upload-mode.tsx` | File drag-and-drop + validation |
| `url-input-mode.tsx` | URL input + title |
| `text-input-mode.tsx` | Text paste + title |

### 4e. `home/page.tsx` (252 lines)

Extract sections from the page into `components/home/`:
- `notebooks-section.tsx` — notebook grid + create button
- `stats-section.tsx` — stat cards
- `decks-section.tsx` — deck cards (replace mock data with real queries)

### 4f. `notebooks/[notebookId]/page.tsx` (251 lines)

Move `DesktopLayout` into its own file at `features/notebooks/components/desktop-layout.tsx`.

### 4g. `activity-calendar.tsx` (295 lines)

Extract pure calendar logic into `components/home/calendar-engine.ts`:
```typescript
export function generateCalendar(year: number, month: number): Date[][] { ... }
export function computeActivityLevel(count: number): 0 | 1 | 2 | 3 | 4 { ... }
```

Keep only rendering in the component.

---

## Phase 5 — Eliminate duplicate patterns

### 5a. `kindLabel()` map

Extract to `src/features/study-materials/shapes/kind-labels.ts`:

```typescript
export const KIND_LABELS: Record<StudyMaterialKind, string> = {
  quiz: "Quiz",
  simple_flashcard: "Flashcard",
  report: "Report",
  roadmap: "Roadmap",
  slide_deck: "Slide Deck",
  mind_map: "Mind Map",
};
```

Update all 3 occurrences (`EditorShell.tsx`, `GenerateBriefDialog.tsx`, `BackgroundGenerationStatus.tsx`).

### 5b. Model localStorage logic

Create `src/features/notebooks/hooks/use-model-persistence.ts`:

```typescript
const STORAGE_KEY = "memsystems-selected-model";

export function useModelPersistence(notebookId: string) {
  const [model, setModel] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    return localStorage.getItem(`${STORAGE_KEY}-${notebookId}`) ?? undefined;
  });

  const persistModel = useCallback((id: string) => {
    localStorage.setItem(`${STORAGE_KEY}-${notebookId}`, id);
    setModel(id);
  }, [notebookId]);

  return { model, setModel: persistModel };
}
```

Update `chat-panel.tsx` and `GenerateBriefDialog.tsx` to use this hook.

### 5c. User dropdown menu

Extract to `src/components/layout/user-menu.tsx`:

```typescript
export function UserMenu() {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut({ fetchOptions: { onSuccess: () => router.push("/login") } });
  };

  if (!session) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar>
          <AvatarImage src={session.user.image ?? undefined} />
          <AvatarFallback>{session.user.name.charAt(0)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => router.push("/settings")}>
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

Replace in `app-header.tsx` and `notebook-header.tsx`.

### 5d. Delete confirmation dialog

Create `src/components/shared/confirm-delete-dialog.tsx`:

```typescript
interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ConfirmDeleteDialog({ ... }: ConfirmDeleteDialogProps) { ... }
```

Replace in `study-materials-tree.tsx` (2 instances) and `sources-panel.tsx` (1 instance).

### 5e. `assertNotebookOwner` pattern

Create `src/features/notebooks/ownership.ts`:

```typescript
import { db } from "@/database/connection";
import { notebooks } from "@/database/schema";
import { eq, and } from "drizzle-orm";
import { ForbiddenError, NotFoundError } from "@/lib/errors/domain-error";

export async function assertNotebookOwner(userId: string, notebookId: string): Promise<void> {
  const [notebook] = await db
    .select({ id: notebooks.id })
    .from(notebooks)
    .where(and(eq(notebooks.id, notebookId), eq(notebooks.userId, userId)))
    .limit(1);
  if (!notebook) throw new NotFoundError("Notebook");
}
```

Replace all private `assertNotebookOwner` methods in services (`source.service.ts`, `study-material.service.ts`, `study-material-folder.service.ts`, `trash.service.ts`, `notebook-chat.service.ts`, `generation.service.ts`, `notebook.service.ts`).

---

## Phase 6 — Organize components directory

**Problem**: `components/ui/` has 62 files mixing 38 standard shadcn components with 24 custom components.

**Steps**:

1. Move custom components out of `ui/`:

| Component | Move to |
|-----------|---------|
| `bubble.tsx` | `components/chat/bubble.tsx` |
| `message.tsx` | `components/chat/message.tsx` |
| `message-scroller.tsx` | `components/chat/message-scroller.tsx` |
| `attachment.tsx` | `components/chat/attachment.tsx` |
| `marker.tsx` | `components/chat/marker.tsx` |
| `combobox.tsx` | `components/shared/combobox.tsx` |
| `field.tsx` | `components/shared/field.tsx` |
| `empty.tsx` | `components/shared/empty.tsx` |
| `item.tsx` | `components/shared/item.tsx` |
| `input-group.tsx` | `components/shared/input-group.tsx` |
| `button-group.tsx` | `components/shared/button-group.tsx` |
| `direction.tsx` | `components/shared/direction.tsx` |
| `kbd.tsx` | `components/shared/kbd.tsx` |
| `native-select.tsx` | `components/shared/native-select.tsx` |
| `spinner.tsx` | `components/shared/spinner.tsx` |
| `logo.tsx` | `components/branding/logo.tsx` |
| `notebook-icon.tsx` | `components/branding/notebook-icon.tsx` |

2. Update ALL import paths across the codebase (grep for `@/components/ui/` + each component name).

3. Run `pnpm run typecheck && pnpm run lint`.

---

## Phase 7 — Add barrel exports for features

**Problem**: No `index.ts` files in features. All consumers use deep import paths.

**Steps**:

For each feature directory, create an `index.ts` that exports the public API (services + public components). Do NOT re-export internal helpers or private components.

Example for `features/notebooks/index.ts`:

```typescript
// Services
export { NotebookService } from "./notebook.service";

// Components
export { NotebookBanner } from "./components/notebook-banner";
export { NotebookSettingsDialog } from "./components/notebook-settings-dialog";
export { ModelSelector, DialogModelSelector } from "./components/model-selector";
export { MobileNotebookLayout } from "./components/mobile-notebook-layout";
export { StudioResources } from "./components/studio-resources";
export { FolderPicker } from "./components/studio/folder-picker";
export { PickerPane } from "./components/studio/picker-pane";
export { RightPane } from "./components/studio/right-pane";
export { SourceMultiSelect } from "./components/studio/source-multi-select";

// Hooks
export { useTextareaAutosize } from "./hooks/use-textarea-autosize";
```

Do this for each feature: `notebooks`, `notebook-chat`, `sources`, `srs`, `study-materials`, `rag`, `ai`, `generation`.

Update consumers to use the barrel where it improves readability (not strictly required).

---

## Phase 8 — Technical debt

### 8a. Raw SQL in RAG services

**Files**: `indexing.service.ts`, `retrieval.service.ts` use `sql.raw()` with string-interpolated vector arrays.

**Fix**: Replace with Drizzle parameterized query pattern or use the `sql` template tag properly:

```typescript
// Before
await db.execute(sql`
  INSERT INTO source_chunks (id, source_id, content, embedding, chunk_index)
  VALUES ${sql.raw(values.join(", "))}
`);

// After
await db.insert(sourceChunks).values(chunks);
```

Note: pgvector support may require Drizzle's `sql` template tag with proper vector casting.

### 8b. `deck-card.tsx` server/client bug

**File**: `src/components/home/deck-card.tsx` uses `useTranslations` (client hook) without `"use client"` directive.

**Fix**: Add `"use client"` at the top of the file.

### 8c. `connection.service.ts` module-level mutable state

**File**: `src/features/ai/connection.service.ts` has module-level `cachedResult`, `cachedAt`, `cachedModels`, `openaiHealthCache`.

**Fix**: Extract caching logic into a `Cache` helper class:

```typescript
class TtlCache<T> {
  private value: T | null = null;
  private timestamp = 0;

  constructor(private readonly ttlMs: number) {}

  get(): T | null {
    if (this.value === null) return null;
    if (Date.now() - this.timestamp > this.ttlMs) return null;
    return this.value;
  }

  set(value: T): void {
    this.value = value;
    this.timestamp = Date.now();
  }

  invalidate(): void {
    this.value = null;
    this.timestamp = 0;
  }
}
```

### 8d. Dead code removal

- `home/page.tsx:23` — `_getBanner` function (unused)
- `study-materials-tree.tsx:534` — `fileTreeData` mock export (marked legacy)
- `stat-card.tsx` — `statusColor` prop (both variants return identical values)
- `MaterialViewer.tsx:29` — `console.log` debug artifact
- `generation.ts` — inline `StudyMaterialKind` type (duplicates `shapes/index.ts`)

### 8e. Unify generation.ts `StudyMaterialKind`

**File**: `src/lib/generation.ts` defines its own `StudyMaterialKind` type inline.

**Fix**: Import from `@/features/study-materials/shapes` instead:

```typescript
import type { StudyMaterialKind } from "@/features/study-materials/shapes";
```

---

## Execution order (recommended)

| Step | Phase | Files touched | Test command |
|------|-------|---------------|-------------|
| 1 | Phase 0 | ~14 imports + 2 dirs | `typecheck`, `lint` |
| 2 | Phase 2 | 31 route files + 1 new file | `typecheck`, `lint`, `test` |
| 3 | Phase 3 | 1 file → 5 files | `typecheck`, `lint`, `test` |
| 4 | Phase 1 | ~21 files move + imports | `typecheck`, `lint` |
| 5 | Phase 5 | 5-10 files | `typecheck`, `lint`, `test` |
| 6 | Phase 4 | 6 large components | `typecheck`, `lint`, `test` |
| 7 | Phase 6 | ~17 component moves + imports | `typecheck`, `lint` |
| 8 | Phase 7 | ~9 index.ts files | `typecheck`, `lint` |
| 9 | Phase 8 | 6-8 small fixes | `typecheck`, `lint`, `test` |

Run `pnpm run test` (via `cmd /c "cd /d memsystems_app && pnpm run test"`) after each phase that touches business logic (Phases 2, 3, 5, 8).
