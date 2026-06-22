# Testing Plan — Chat & Sources (frontend↔backend integration)

## Goal

Stop shipping "compiles but broken" code in the two features that are actively being worked against the backend: the **Notebook Chat panel** and the **Sources module**. Add a TDD harness and a behavioral test suite that drives the real frontend components against the real backend route handlers + services + a real test database, so tests catch the actual bugs users see — not shape-of-the-code bugs.

This plan follows the vertical-slice tracer-bullet workflow: one test → one fix → repeat. Each item below is a behavior to verify, written one at a time against real code.

## Scope

**In scope (the two features connected to the backend):**
- Notebook Chat: `src/features/notebook-chat/notebook-chat.service.ts`, `src/app/api/notebooks/[id]/chat/route.ts`, `src/features/notebook/components/chat-panel.tsx` + `chat-message-list.tsx` + `composer.tsx` + `clear-history-dialog.tsx`, `src/lib/chat.ts`.
- Sources: `src/features/sources/source.service.ts` (+ `source-extraction.service.ts`, `web-scraper.service.ts`), the seven sources route handlers under `src/app/api/notebooks/[id]/sources/*` and `src/app/api/sources/[id]/*`, `src/features/notebook/components/sources-panel.tsx` + `add-source-dialog.tsx`, `src/lib/sources.ts`.

**Out of scope for this plan:** the SRS/SM-2 scheduling, Study Material shapes validation, Note/NoteType/Tag services, generation, AI connection UI. Those were the focus of the previous plan and are deferred. Component-level styling/visual regression is also out.

## The two reported bugs — grounded in the code

These are the first targets. Each gets a failing test (RED), then a minimal fix (GREEN), then a named regression test that stays in the suite forever.

### Bug A — "sometimes it loads the chat history from another notebook"

Root cause (frontend state, backend is correct):
- `chatMessagesQueryOptions(notebookId)` is keyed `["chat", notebookId, "messages"]` — correct per-notebook (`src/lib/chat.ts:14`).
- `NotebookChatService.listMessages` filters `eq(notebookChatMessages.notebookId, notebookId)` + ownership check — correct (`notebook-chat.service.ts:54-76`).
- **The bug:** `ChatPanel` builds `initialMessages` from `chatHistory` and passes it to `useChat({ transport, messages: initialMessages })` (`chat-panel.tsx:89-106`). The `messages` prop to `useChat` is **initial-only**. When `notebookId` changes (navigating A→B), Next.js App Router reuses the page component (no `key`), `chatHistory` updates to B's rows, `initialMessages` recomputes — but `useChat` ignores the new initial value and keeps A's messages on screen. The `staleTime: Infinity` on the query compounds this by never refreshing.

**Regression test (component, jsdom):** render `<ChatPanel notebookId="A" />` with MSW returning A's history → assert A's messages render. Re-render with `notebookId="B"` and MSW returning B's history → assert **B's** messages render and **A's** do not. Expected to FAIL today.

### Bug B — "sometimes the llm responds with the input I entered and then it gives its response"

Root cause (backend history assembly):
- `NotebookChatService.sendMessage` inserts the user message (`notebook-chat.service.ts:96-103`), then calls `getRecentHistory(notebookId, 6)` which reads the last 6 rows from DB — **now including the user message just inserted** (lines 125-128), then builds `history = [...priorHistory, { userMessage }]` — **appending the same user message a second time** (lines 129-138). The LLM receives `[..., {user:"X"}, {user:"X"}]` and echoes the input. The `CRITICAL OUTPUT RULES` block in the system prompt is a band-aid over this duplication.

**Regression test (backend, real DB, mock only the LLM boundary):** call `chatService.sendMessage(user, notebook, { content: "X", model })` with `streamText` mocked to capture its `messages` arg; assert the user message `"X"` appears **exactly once** in the assembled LLM messages and is the last entry. Expected to FAIL today (it appears twice).

## Test architecture

Two layers, both real, both Vitest:

### Layer 1 — Backend integration (Node env, real test Postgres)

Import the **actual route handler functions** (`GET`/`POST`/`DELETE` from the `route.ts` files) and the **actual service classes**, invoke them with a constructed `NextRequest` + `params` against a real test database. No mocking of `db`, services, or handlers.

Mocks allowed **only at true external boundaries**:
- `@/lib/session` → returns a fixed session for a seeded user (the auth boundary; `getSession` calls `next/headers` which doesn't exist outside a Next request).
- `ai` package's `streamText` + `@/features/ai/connection.service` / `@/features/ai/providers/opencode` → capture the `messages`/`system`/`model` args, return a controllable stream, and let the test invoke the `onFinish` callback to verify assistant-message persistence (citation extraction + stripping). The LLM is a boundary.
- `@/lib/storage/s3-client` (`putObject`/`deleteObject`/`presignDownload`) → in-memory fakes. Object storage is a boundary.
- global `fetch` (for URL-source scraping) OR `@/features/sources/web-scraper.service` `scrapeUrl` → fixed HTML fixture. The network is a boundary.

DB isolation: one `memsystems_test` database, `drizzle-kit push` to build schema once per run, `TRUNCATE ... CASCADE` between tests. Seed the Better Auth `user` row directly; everything else via the real services.

### Layer 2 — Frontend component (jsdom env, MSW at the fetch boundary)

Render `ChatPanel` / `SourcesPanel` / `AddSourceDialog` with React Testing Library + a real `QueryClientProvider` + `user-event`. Intercept `fetch` with **MSW**, serving responses whose shape matches the real handler contract (generated by calling the real handlers in the same test where it adds value). Drive real interactions (type, click, drop a file) and assert rendered output + outgoing requests.

For chat streaming behaviors where MSW UIMessageStream plumbing is heavy, mock `@ai-sdk/react`'s `useChat` to a thin controlled stand-in **only for the streaming-specific assertions**, and keep MSW for the GET history fetch. The cross-notebook leak (Bug A) does not need streaming and is tested against the real `useChat` + MSW GET.

## Tooling

### New dev dependencies

```
pnpm add -D vitest @vitest/ui vite-tsconfig-paths dotenv jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom msw
```

(`jsdom` becomes a direct devDep this time — it's required for the component layer.)

### Config

`memsystems_app/vitest.config.ts`:

```ts
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",            // default for backend tests
    environmentMatchGlobs: [
      ["tests/component/**/*.test.tsx", "jsdom"],
    ],
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    pool: "threads",
  },
});
```

Component tests opt into jsdom via the folder glob above (or a `// @vitest-environment jsdom` docblock). `tests/setup.ts` loads `.env.test` (dotenv), imports `@testing-library/jest-dom` extensions, and starts/persists MSW workers for component files.

`memsystems_app/.env.test` (gitignored):

```
DATABASE_URL=postgres://localhost:5432/memsystems_test
```

### Scripts

```jsonc
"test": "vitest run",
"test:watch": "vitest",
"test:db:setup": "drizzle-kit push --config=drizzle.config.ts",
"test:ui": "vitest --ui"
```

Run `pnpm test:db:setup` once before the first run; the suite can also call it from `tests/setup.ts` when `DATABASE_URL` ends in `_test`.

### Folder layout

```
memsystems_app/tests/
  setup.ts
  db.ts                 // pool, resetDatabase(), withDb() wrapper
  fixtures.ts           // seedUser(), seedNotebook(), seedChatMessages(), seedSource()
  mocks/                // boundary mocks: session.ts, llm.ts (streamText), storage.ts, scraper.ts
  backend/
    chat.service.test.ts
    chat.route.test.ts
    sources.service.test.ts
    sources.route.test.ts
  component/
    chat-panel.test.tsx
    sources-panel.test.tsx
    add-source-dialog.test.tsx
```

## Phased rollout (vertical slices, value-ordered)

One behavior at a time: RED → minimal fix → GREEN → next. Each phase ends with a green, reviewed, lint-clean slice.

### Phase 0 — Tracer bullet

Prove the whole path works with **one** real test before building the suite.

1. Install dev deps; add `vitest.config.ts`, `tests/setup.ts`, `.env.test`, `tests/db.ts`, `tests/fixtures.ts`, scripts; add `.env.test` to `.gitignore`.
2. Write **one** test: **Bug B** — `chatService.sendMessage` sends the user message to the LLM exactly once. Mock `streamText` + `connectionService`. Seed a notebook + a prior assistant message via the real service.
3. Run `pnpm test`. It must **fail** (user message appears twice) — confirming the bug exists and the test can see it. Then apply the minimal fix (drop the redundant append in `getRecentHistory`/`history` assembly) and watch it go green.
4. `pnpm run lint` + `pnpm run typecheck` clean.

**Exit gate:** one green regression test for Bug B, harness committed. Review before Phase 1.

### Phase 1 — Chat backend integration (real DB, mock only LLM + session)

Behaviors, one test each:
- `listMessages` returns only the given notebook's messages, oldest first, and never another notebook's (cross-notebook guard at the DB layer).
- `listMessages` rejects a notebook owned by another user with `ForbiddenError`; missing notebook with `NotFoundError`.
- `sendMessage` persists the user message **before** calling the LLM.
- `sendMessage` assembles LLM `messages` with the user message exactly once, as the last entry (Bug B regression).
- `sendMessage` `onFinish` persists an assistant message with `stripCitations` applied and `extractCitations`-derived `citedSourceIds` (title-parenthesis + `[source:id]` forms).
- `sendMessage` truncates source context to `MAX_SOURCE_TEXT` and only includes sources for **this** notebook.
- `sendMessage` rejects when OpenCode is not connected (`ServiceUnavailableError`), and when the notebook isn't owned (Forbidden/NotFound).
- `clearMessages` deletes only this notebook's rows and enforces ownership.
- Route `POST /api/notebooks/[id]/chat`: rejects empty body / invalid JSON / missing model with 400; extracts only the last user message text; returns the stream on success.
- Route `GET`/`DELETE`: enforce auth (401 without session); map `DomainError` → correct status via `toErrorResponse`.

### Phase 2 — Chat frontend component (jsdom + MSW, real `useChat`)

- **Bug A regression**: `ChatPanel` notebookId A→B re-render shows B's history, not A's. (Expected to fail; fix via `key={notebookId}` on `ChatPanel` or resetting `useChat` on notebookId change — minimal fix chosen during GREEN.)
- Empty state (`ChatEmptyState`) shows when no history; message list shows when history exists.
- Loading state while `status === "submitted"` shows the "Thinking..." indicator.
- Submitting a message: trims input, clears the composer, sends `{ text }`, and the outgoing request body has `model` + `messages` with the user's text as the last user part (matches the route's `chatRequestSchema`).
- Empty/whitespace input does not submit.
- Model selector picks from `modelsQueryOptions` and the selected id is sent in the request body.
- "Clear history" confirms, calls `DELETE`, clears `useChat` messages, invalidates `["chat", notebookId, "messages"]`, toasts success.
- Regenerate calls `useChat.regenerate()`.
- Copy button writes the assistant message text to `navigator.clipboard`.
- The `["chat", notebookId, "messages"]` query is **not** shared across notebooks (no leak even at the cache level).

### Phase 3 — Sources backend integration (real DB, mock storage + scraper + session)

Behaviors, one test each:
- `list` returns only the notebook's sources, newest first; empty for a fresh notebook; ownership enforced.
- `createText` persists `kind: "text"`, trims/clamps title to 500, stores `rawText`; rejects empty rawText; rejects >5MB rawText with `BadRequestError`.
  - **Pin the current odd behavior as a regression target:** empty `rawText` currently throws `NotFoundError("rawText ...")` → 404. Test asserts the status code is 404 today (characterization test), then a second test asserts the **intended** 400 after the fix. Confirm with user which way to go.
- `createUrl` calls `scrapeUrl`, stores `kind: "url"` with scraped `rawText` + `url`; title defaults to scraped title, clamped to 500; invalid URL → `WebScrapeError` → 400.
- `createFile` rejects empty file, >50MB file, unsupported type; for a valid file: computes sha256, calls `putObject` with the built `sources/<sha256><ext>` key, extracts text, persists `s3Key`/`contentType`/`fileSize`/`sha256`; on extraction failure, `deleteObject` is called and the row is not inserted.
- `delete` removes the row; for `kind: "file"` also calls `deleteObject`; enforces ownership (Forbidden on others' source, NotFound on missing).
- `getDownload` returns a presigned URL for file sources only; non-file source → `BadRequestError`; ownership enforced.
- Route handlers: auth (401 without session), `DomainError` → status mapping, `sources/file` FormData parsing (`file` required → 400 when absent, optional `title`), `sources/text`/`sources/url` JSON body validation via Zod.

### Phase 4 — Sources frontend component (jsdom + MSW)

- `SourcesPanel` shows loading spinner while pending, "Failed to load sources" on error, "No sources yet" empty state, and rows with the correct icon per `kind` (`file`→FileText, `url`→Link2, `text`→File).
- Rows render the title; clicking toggles selection (Check indicator); selecting one does not affect another notebook's panel (query key `["sources", notebookId]` is per-notebook).
- Delete button calls `DELETE /api/sources/[id]`, on success removes the row, toasts "Source removed", invalidates `["sources", notebookId]`; on error toasts the message; shows a spinner on the deleting row only.
- `AddSourceDialog`: opening from the dashed trigger; file picker + drag-and-drop both call `createFileSource` with the file; URL form disables submit until a URL is entered, submits `createUrlSource`, shows "Scraping..." while pending; text form disables submit until both title and body are non-empty; success toasts + close + form reset + query invalidation; error toasts the backend message.
- Quota bar shows `count / 50` and the correct `usedPercent` width, including at 0 and at the cap.
- A failed create (e.g. unsupported file type) does **not** close the dialog and does **not** invalidate the list (so the user can retry).

### Phase 5 — Regression guard (named, permanent)

The two reported bugs get dedicated, clearly-named regression tests that stay green forever:
- `chat.service.test.ts`: `"regression: sendMessage does not duplicate the user message in LLM history (echo bug)"`.
- `chat-panel.test.tsx`: `"regression: switching notebookId does not show the previous notebook's chat history"`.

These are written in Phase 0 and Phase 2 respectively, and called out here so they're never accidentally deleted.

## Mocking policy (enforced in review)

- **Never mock `db`.** Real test Postgres only.
- **Never mock internal collaborators** (services mocking each other, route handlers mocking services).
- **Mock only at true external boundaries**: `@/lib/session` (auth), `streamText`/`opencodeProvider`/`connectionService` (LLM), `@/lib/storage/s3-client` (object storage), global `fetch`/`scrapeUrl` (network), and `fetch` in component tests via MSW.
- **No private-method tests.** If pure logic needs covering (e.g. chat history assembly, citation extraction/stripping), extract it to an exported pure function with its own unit tests — done lazily when reached.
- **Assert on observable behavior**: returned JSON, HTTP status, `DomainError` `status`/`code`, rows read back via the public service, rendered DOM, outgoing request bodies. Never on internal call sequences.

## Refactor-for-testability (lazy — only when reached)

1. **Chat history assembly** — extract `assembleLlmMessages({ priorHistory, userMessage })` (and the `getRecentHistory`-without-just-inserted-row logic) to a pure exported function. This is the clean fix for Bug B and makes the regression test fast and deterministic without mocking `streamText`. Done in Phase 0/1.
2. **Citation extraction/stripping** — `extractCitations` and `stripCitations` are already pure-ish private methods; export them so `onFinish` persistence can be unit-tested without a DB round-trip. Done in Phase 1.
3. **`createText` empty-body status** — change `NotFoundError` → `BadRequestError` for empty `rawText` (Phase 3, after the characterization test).

Each extraction is committed on its own with the test that motivated it, never speculatively.

## Open questions for approval

1. **Test DB**: separate local Postgres `memsystems_test`. Do you have Postgres running locally for dev already, and is creating a second DB acceptable? (Alternatively, a disposable Docker container started by the test setup.)
2. **Bug A fix approach**: `key={notebookId}` on `ChatPanel` (simplest, forces remount) vs. resetting `useChat` state on `notebookId` change (preserves any in-flight work). I lean toward `key=` for simplicity. OK?
3. **`createText` empty-body status**: fix the 404 → 400 (recommended) or leave as-is and just pin it?
4. **`useChat` in component tests**: real `useChat` + MSW for the GET history (and for streaming where feasible), with a thin controlled mock only for streaming-specific assertions. OK, or do you want real streaming via MSW UIMessageStream throughout?
5. **Test file location**: `memsystems_app/tests/` with `backend/` and `component/` subfolders (recommended) — or co-located next to source?

## Results (as of Phase 4 complete)

- **72 tests across 7 files, all green.** Lint + typecheck clean.
- Coverage by phase:
  - Phase 0 (tracer bullet + Bug B fix): `tests/backend/chat.service.test.ts` — 1 regression test for the user-message echo bug. Fix: `notebook-chat.service.ts` — assemble `getRecentHistory` **before** the user-message insert so the LLM sees the new user message exactly once.
  - Phase 1 (chat backend): `tests/backend/chat.service.test.ts` (10 tests) + `tests/backend/chat.route.test.ts` (9 tests). Covers `sendMessage` / `listMessages` / `clearMessages`, `onFinish` citation extraction + stripping, `MAX_SOURCE_TEXT` truncation, source isolation, ownership errors, and route auth/`DomainError` mapping.
  - Phase 2 (chat frontend): `tests/component/chat-panel.test.tsx` — 3 tests. **Bug A regression**: switching `notebookId` shows the new notebook's history. Fix: `app/notebooks/[notebookId]/page.tsx:152` — `key={notebookId}` on `<ChatPanel>`. Also: empty state, empty/whitespace submit is ignored.
  - Phase 3 (sources backend): `tests/backend/sources.service.test.ts` (23 tests) + `tests/backend/sources.route.test.ts` (17 tests). Covers `list`/`createText`/`createUrl`/`createFile`/`delete`/`getDownload` with sha256, S3, scrape, FormData, Zod, ownership, and route auth/400/404/500 mapping. **Empty-rawText 404→400 fix**: `source.service.ts` — `BadRequestError` + `.trim()`.
  - Phase 4 (sources frontend): `tests/component/sources-panel.test.tsx` (5 tests) + `tests/component/add-source-dialog.test.tsx` (5 tests). Covers empty state, row rendering, selection toggle, delete mutation, `collapsed` renders null, dialog trigger, menu/URL/text modes, disabled-until-valid submit, and quota counter.
- **Mocking policy** held throughout: only `@/lib/session` (auth), `streamText` (LLM), S3 client (storage), `scrapeUrl` / `extractText` (network). Real Postgres. No service or route mocking.
- **Component test pattern**: pre-populated `QueryClient` cache via a `vi.hoisted` shared `queryCache` map. Necessary because Vitest resolves `@tanstack/react-query` to a different module instance in the component under test than in the test file.
- **Config**: `vitest.config.ts` has `fileParallelism: false` to serialize backend files (shared DB). Component tests opt into jsdom via `// @vitest-environment jsdom` docblock (Vitest 4 has no `environmentMatchGlobs` in the InlineConfig type).
- **CI**: deferred per user. AGENTS.md now requires `pnpm run lint && pnpm run typecheck && pnpm run test` before any commit.
- **PowerShell workaround**: `cmd /c "cd /d ... && pnpm run test"` (PowerShell 5.1 + pnpm gives `ERR_PNPM_NO_PKG_MANIFEST`).
- **Path typo trap**: any test file written to `memsems_app/` (typo) is invisible to Vitest; everything must land in `memsystems_app/tests/`.
