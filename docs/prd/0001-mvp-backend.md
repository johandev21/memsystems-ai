# PRD-0001: memsystems MVP Backend

> **Status:** In progress. **Notebooks** and **Sources** are built and shipping. **Study Materials + Folders + Trash** is the next module — see PRD-0002 for the detailed spec. The remaining modules (generation, notebook-chat, srs, ai refactor) follow.
> **Triage label:** `ready-for-agent`.
> **No issue tracker is configured yet.** When one is set up, this PRD should be sliced into issues via the `to-issues` skill.

## Problem Statement

The user is building memsystems, a single application that combines two product surfaces:

1. **NotebookLM clone** — a workspace where Users attach Sources (URLs, PDFs, pasted text) and use an AI Study Assistant to produce Study Materials (Quiz, Simple Flashcard, Report, Roadmap, Slide Deck, Mind Map) and chat about those Sources.
2. **Anki clone** — a Spaced Repetition System (SRS) using the SM-2 algorithm, where Users build custom Note Types with Fields and Card Templates, and review their Cards in an Anki-like study UI.

The two surfaces are unified by a **promotion** flow: a Simple Flashcard generated in a Notebook can be promoted into a Note in the global SRS Pool, where it acquires SM-2 review state and joins the User's daily review queue.

The backend is partially built. Notebooks (PRD module 1) and Sources (PRD module 2) are complete. The user is now building **Study Materials + Folders + Trash** (PRD module 3; spec in PRD-0002), and continues with the generation, notebook-chat, SRS, and AI refactor modules.

## Solution

Build the full MVP backend. Ship all six Study Material kinds, the AI generation flow, Source-grounded chat, and the global SRS pool with Note Types, Notes, Cards, and SM-2. AI is optional at every level — Users can author materials manually. AI access is BYOK with a platform fallback across four Providers: **OpenAI, Anthropic, Google, DeepSeek**.

The backend uses a feature-based Controller-Service architecture with Drizzle ORM and Postgres. Storage: Cloudflare R2 in production, MinIO for local dev. Provider Keys are encrypted at rest. AI generation and chat use synchronous streaming with the Vercel AI SDK.

Study Materials are organized into a per-Notebook tree of **Folders** and protected by a soft-delete **Trash** (30-day recovery, daily hard-purge). The full per-kind content shapes, folder/trash lifecycle, endpoint surface, and test seams are detailed in PRD-0002.

## User Stories

### Authentication and account

1. As a User, I want to sign in with Google, so I don't have to remember another password.
2. As a User, I want my session to persist across page reloads, so I don't have to log in every time.
3. As a User, I want to log out, so my account isn't accessible on a shared device.

### Notebooks

4. As a User, I want to create a Notebook, so I can start a new study topic.
5. As a User, I want to rename and delete my Notebooks, so I can keep my workspace organized.
6. As a User, I want to see a list of my Notebooks on the home page, so I can pick up where I left off.

### Sources

7. As a User, I want to paste text into a Notebook as a Source, so I can quickly add a quote or excerpt.
8. As a User, I want to add a URL as a Source, so I can include web articles.
9. As a User, I want to upload a PDF as a Source, so I can include papers and book chapters.
10. As a User, I want to upload Markdown, TXT, or DOCX files as a Source, so I can include my own notes.
11. As a User, I want to delete a Source, so I can clean up my Notebook.
12. As a User, I want the original file to be downloadable from the Source detail view, so I can re-read it later.

### Study Materials

13. As a User, I want to view all Study Materials in a Notebook, organized by kind, so I can find what I generated.
14. As a User, I want to edit any Study Material after it's generated, so I can fix mistakes and customize.
15. As a User, I want to author Study Materials manually (without AI), so I can use the app without paying for LLM calls.
16. As a User, I want to delete a Study Material, so I can remove what I don't need.
17. As a User, I want to organize Study Materials into Folders, so that I can structure complex Notebooks.
18. As a User, I want to nest Folders inside other Folders, so that I can build a deep tree of topics.
19. As a User, I want to move a Study Material from one Folder to another, so that I can reorganize.
20. As a User, I want to rename a Folder, so that I can keep my organization current.
21. As a User, I want to re-shuffle the options of a Quiz, so that I can regenerate variety without rewriting it.
22. As a User, I want to see a Quiz Question's options in a randomized order every time, so that I cannot memorize the answer by its position.

### Trash

23. As a User, I want a soft-deleted Study Material or Folder to appear in a per-Notebook Trash, so that I can recover from mistakes.
24. As a User, I want to restore a Study Material from the Trash, so that I can undo a deletion.
25. As a User, I want to restore a Folder from the Trash, so that I can recover my organization.
26. As a User, I want to permanently delete a Study Material or Folder from the Trash, so that I can clean up.
27. As a User, I want soft-deleted items to disappear from the main view immediately, so that my workspace stays uncluttered.
28. As a User, I want Trash items to be hard-deleted after 30 days, so that storage does not grow forever.

### AI generation

29. As a User, I want to click "Generate" on a Studio resource (Quiz, Flashcards, Report, Roadmap, Slide Deck, Mind Map) and get AI-generated content based on the Notebook's Sources.
30. As a User, I want to select which Sources to include in the generation, so I can focus on a specific subset.
31. As a User, I want to write a freeform Generation Brief (e.g. "20 Q&A cards focused on definitions"), so I can personalize the AI output.
32. As a User, I want to see Study Materials appear in real time as the AI generates them, so I get a feel for the AI's progress.
33. As a User, I want to stop a generation mid-stream, so I don't waste tokens.
34. As a User, I want to retry a generation, so I can get a different result.
35. As a User, I want to choose the destination Folder for AI-generated Study Materials, so that I can keep my workspace organized.
36. As a User, I want generated materials to default to the Notebook root if I don't pick a Folder, so that generation still works without a target.

### Notebook chat

37. As a User, I want to chat with the Study Assistant about my Notebook's Sources, so I can ask questions grounded in my material.
38. As a User, I want the chat history to persist, so I can come back to a conversation later.
39. As a User, I want the Study Assistant to cite which Source(s) it used for an answer, so I can verify and explore.
40. As a User, I want the Study Assistant to say "I don't know" when the answer isn't in the Sources, so I can trust the chat.
41. As a User, I want chat responses to stream, so I see the answer as it's generated.

### Promotion (Simple Flashcard → Note)

42. As a User, I want to click "Save to SRS" on a Simple Flashcard, so I can start reviewing it with spaced repetition.
43. As a User, I want to choose which Note Type the Simple Flashcard becomes, so I can fit it into my study system.
44. As a User, I want the AI to suggest how the Simple Flashcard's content maps to the Note Type's Fields, so I don't have to type it again.
45. As a User, I want to preview and edit the adapted Note before saving, so I can fix any mistakes.
46. As a User, I want the original Simple Flashcard to remain in the Notebook, so I can see what was generated and what was promoted.
47. As a User, I want to create a Note in the global SRS Pool from scratch (no Simple Flashcard), so I have full control.

### Global SRS Pool — Note Types

48. As a User, I want to create a custom Note Type with my own Fields, so my Notes match my study system.
49. As a User, I want to define Card Templates on a Note Type (front and back templates), so each Note produces one or more Cards.
50. As a User, I want built-in Note Types (Basic, Cloze), so I have a starting point.
51. As a User, I want to add new Fields to a Note Type after Notes exist, so I can extend my schema.
52. As a User, I want to be warned that renaming or deleting a Field will affect existing Notes, so I don't break my data.
53. As a User, I want to delete a Note Type I no longer use, so my pool stays clean.

### Global SRS Pool — Notes and Tags

54. As a User, I want to see all my Notes in a single list, so I can review and edit them.
55. As a User, I want to filter my Notes by Tag, so I can study a specific topic.
56. As a User, I want to filter my Notes by the Notebook they were promoted from, so I can study per-source.
57. As a User, I want to add Tags to a Note, so I can organize.
58. As a User, I want to edit a Note's Field values, so I can correct typos.
59. As a User, I want to delete a Note, so I can remove what I don't need.

### Review sessions (SM-2)

60. As a User, I want to start a review session, so I can study due Cards.
61. As a User, I want to see a Card's front, decide the answer, then reveal the back, so I can self-test.
62. As a User, I want four buttons (Again, Hard, Good, Easy) to grade my recall, so I can tell the algorithm how well I knew it.
63. As a User, I want the next Card to appear immediately after I grade, so I can keep my flow.
64. As a User, I want a session summary at the end, so I can see how I did.
65. As a User, I want to suspend a Card I don't want to review, so it disappears from the queue.
66. As a User, I want to unsuspend a Card, so I can resume reviewing.
67. As a User, I want to limit how many new Cards I see per day, so I don't burn out.
68. As a User, I want to see how many Cards are due, so I can plan my session.

### BYOK (Bring Your Own Key)

69. As a User, I want to add a Provider Key for any of the six Providers, so I can use my own API quota.
70. As a User, I want to see which Providers I have keys for, so I know what's available.
71. As a User, I want to delete a Provider Key, so I can revoke access.
72. As a User, I want the Study Assistant to work even if I haven't added a Provider Key, so I can try the app first.
73. As a User, I want the system to fall back to a platform-supplied key when I don't have my own, so I'm never blocked.

## Implementation Decisions

### Architecture

- Feature-based folder structure: each backend feature gets its own directory with `controller.ts`, `service.ts`, and where useful a `repository.ts`.
- Controllers handle only HTTP concerns (validation, calling services, returning responses). Services hold business logic and DB calls and are decoupled from Elysia's HTTP context for testability.
- Drizzle ORM with Postgres. Schema in `database/schema.ts`. TypeBox (not Zod) for request/response validation.
- Better Auth for authentication. The existing `auth` macro is reused for protected routes.
- Vercel AI SDK for LLM streaming. Provider abstraction: one file per Provider under `features/ai/providers/`.

### Modules to build

1. **notebooks** — DONE. Notebook CRUD. Owner = User.
2. **sources** — DONE. Source CRUD, ingestion pipeline.
   - `source-extraction.service` — text extraction for PDF/MD/TXT/DOCX. Uses `pdf-parse` for PDFs, native for the rest.
   - `web-scraper.service` — URL scraping. Fetch + main-content extractor.
   - File storage via an S3-compatible client (Cloudflare R2 / MinIO).
3. **study-materials** — NEXT. Per-kind content shapes, Folder tree, soft delete + Trash, restore, re-shuffle, move. **Full spec in PRD-0002.**
4. **generation** — Generation Request lifecycle. Streaming response. Per-kind prompt templates. Accepts an optional `folder_id` target.
5. **notebook-chat** — Persistent per-Notebook chat. Source-grounded prompting. Streaming response.
6. **srs** — The global SRS Pool.
   - `note-type.service` — Note Type CRUD. Fields and Card Templates as JSONB.
   - `note.service` — Note CRUD. Field values as JSONB.
   - `card.service` — Card CRUD and review operations. Owns the SM-2 algorithm.
   - `sm2.service` — Pure SM-2 function. Easy to unit-test in isolation.
   - `promotion.service` — Simple Flashcard → Note. The AI adaptation step.
   - `tag.service` — Tag CRUD and the note_tag join.
7. **ai (refactor of existing)** — Multi-provider support.
   - `ai.service` — Refactored to be provider-agnostic. Takes a Provider, model, and messages.
   - `providers/{openai,anthropic,google,deepseek}.ts` — One file per Provider. Each exposes `stream()` and `listModels()`.
   - `provider-key.service` — User Provider Key CRUD. Encryption at rest using AES-256-GCM.
   - `provider-key.controller` — REST endpoints for the User to add/list/delete keys.
   - `provider-catalog` — Server-defined menu of Providers and their models.

### Shared infrastructure

- `database/schema.ts` — All new tables (see Database schema below).
- `storage/s3.client.ts` — S3-compatible client (works with R2, MinIO, AWS S3). Configured via `S3_*` env vars.
- `encryption/crypto.ts` — Symmetric encryption for Provider Keys. Master key from `ENCRYPTION_KEY` env var.
- `errors/domain.ts` — Domain errors (`NotFound`, `Forbidden`, `Validation`, etc.) with HTTP mapping.

### Database schema (Drizzle, Postgres)

- `notebooks` — id, user_id, title, created_at, updated_at.
- `sources` — id, notebook_id, kind (enum: text/url/file), title, raw_text, url (URL kind only), s3_key, content_type, file_size, sha256, created_at.
- `study_materials` — id, notebook_id, kind (enum: quiz/simple_flashcard/report/roadmap/slide_deck/mind_map), **title (varchar, indexed)**, **folder_id (nullable FK to study_material_folders)**, **deleted_at (nullable timestamp, indexed)**, content (JSONB), created_at, updated_at. **The `origin_simple_flashcard_id` column is removed** — promotion only ever creates Notes, never other Study Materials.
- `study_material_folders` — id, notebook_id, parent_id (self-ref, nullable), name, **deleted_at (nullable timestamp, indexed)**, created_at, updated_at.
- `generation_requests` — id, notebook_id, kind, brief, source_ids (array), **target_folder_id (nullable FK to study_material_folders)**, status (enum: streaming/completed/failed/cancelled), started_at, completed_at.
- `notebook_chat_messages` — id, notebook_id, role (user/assistant), content, cited_source_ids (array, nullable), created_at.
- `note_types` — id, user_id, name, fields_schema (JSONB), card_templates (JSONB), is_built_in (bool), created_at, updated_at.
- `notes` — id, user_id, note_type_id, field_values (JSONB), origin_simple_flashcard_id (nullable, for promoted Notes), created_at, updated_at.
- `cards` — id, note_id, template_index, state (enum: new/learning/review), suspended (bool), easiness_factor, interval_days, repetitions, due_at, last_reviewed_at, last_quality, lapses, created_at.
- `tags` — id, user_id, name.
- `note_tags` — note_id, tag_id. Composite PK.
- `provider_keys` — id, user_id, provider (enum), encrypted_key (bytea), iv (bytea), auth_tag (bytea), created_at, last_used_at.

### Per-kind content shapes

The six Study Material kinds and their JSONB bodies are fully specified in PRD-0002. The kinds form a discriminated union on the `kind` column. Every kind has a row-level `title` column; per-kind data lives in `content` (JSONB). A request whose `content` does not match the declared `kind` is rejected with a 4xx response.

### Folders and Trash lifecycle

- Folders and Study Materials are organized as a single tree inside each Notebook.
- Each Study Material has at most one parent Folder (`folder_id` is a single nullable FK).
- Folders nest via self-reference on `parent_id`; no maximum depth.
- Folder names need not be unique within a parent (Notion-style).
- Deletion is soft: a `deleted_at` timestamp is set; the row is hidden from default queries via `WHERE deleted_at IS NULL`.
- A per-Notebook Trash view shows all soft-deleted Folders and Study Materials.
- Items are recoverable for **30 days**; a daily cron hard-deletes rows whose `deleted_at` is older than 30 days.
- **Restore rule for a Study Material**: if the parent Folder is alive, restore to it. If the parent is in Trash, walk up the parent chain to the first alive ancestor. If no ancestor is alive, restore to Notebook root. **No cascade-restore** of folders; restoring a folder returns the folder only — its children remain in Trash and are restored individually.
- **Restore rule for a Folder**: the folder returns; its children remain in Trash and are restored individually.

### SM-2 algorithm

- Pure function in `sm2.service`. Inputs: current Card state + Review Grade. Output: new Card state.
- Initial state: `state=new, easiness_factor=2.5, interval_days=0, repetitions=0, due_at=now, lapses=0`.
- Learning steps: configurable per Note Type; default 1 min, 10 min.
- Lapse behavior: a Card graded "Again" returns to `state=learning`, `repetitions=0`, `interval_days=0`, `lapses+=1`, and `easiness_factor` is reduced per SM-2.
- Suspended is a boolean, not a state. Suspended Cards are excluded from the review queue but retain their progress.
- Daily new card limit and daily review limit: configurable per User. Defaults: 20 new / 200 review.

### AI generation flow

- The User triggers a Generation Request from a Studio button. The endpoint takes `(notebook_id, kind, brief, source_ids[], folder_id?)` and returns a streaming response.
- `folder_id` is optional; when omitted, generated materials land in the Notebook root.
- The AI is given a per-kind prompt template plus the concatenated text of the selected Sources plus the Generation Brief. The output is structured (JSON-schema constrained) so cards stream as discrete objects.
- Cards are persisted to `study_materials` as they are emitted, so a network blip does not lose progress.
- Each AI call uses the User's Provider Key if present for the chosen Provider, else falls back to the platform key.

### Notebook chat flow

- The User sends a message to the chat endpoint with the new message text. The endpoint streams the response.
- The Study Assistant sees: the Notebook's Sources, the chat history, and the new message. The system prompt instructs the Assistant to answer only from Sources and to cite which Sources it used.
- Citations are stored as a list of Source IDs alongside the assistant message.
- Source-grounding is achieved by stuffing all Source text into the prompt. For very large Notebooks, future work: embeddings plus vector retrieval.

### Provider architecture

- A `Provider` interface exposes `stream()` and `listModels()`.
- Each Provider implementation maps to a Vercel AI SDK provider. Platform keys are stored server-side and used when the User has no key for the chosen Provider.
- The `provider-catalog` lists all Providers and their models. Platform keys are stored server-side and used when the User has no key for the chosen Provider.

### Encryption

- Provider Keys are encrypted at rest with AES-256-GCM. The master key is loaded from the `ENCRYPTION_KEY` env var.
- Each row stores `(ciphertext, iv, auth_tag)`. The plaintext key is decrypted only at the moment of an AI call.

## Testing Decisions

- External behavior only. Tests assert on API responses and on SM-2 transitions — not on internal DB query shapes or service call sequences.
- `sm2.service` — Unit tests for the pure SM-2 function. Cover all four Review Grades across New / Learning / Review states. Cover lapse, graduation, and edge cases (clamping easiness factor at 1.3).
- `note.service`, `card.service` — Integration tests against a real Postgres. Cover CRUD, promote, suspend, review-submit, and due-card listing.
- `generation.service` — Integration tests with a stub LLM. Cover streaming, prompt composition, and error handling.
- `source-extraction.service` — Unit tests with fixture files (PDF, MD, TXT, DOCX).
- `web-scraper.service` — Unit tests with fixture HTML. Optionally a single live integration test with a known stable URL.
- `promotion.service` — Integration tests covering the Simple Flashcard → Note flow, including the AI adaptation step (stubbed).
- `provider-key.service` — Unit tests for the encryption round-trip. Assert that plaintext never appears in storage.
- `auth` macro on controllers — A single integration test that an unauthenticated request returns 401.
- `study-material.service`, `study-material-folder.service`, `trash.service` — Integration tests against a real Postgres. Cover CRUD, soft delete, restore (including the walk-up rule for Study Materials with in-Trash parents), move between Folders, re-shuffle, and the 30-day hard-purge cron. The pure re-shuffle function is unit-tested in isolation. Full seam specification in PRD-0002.

## Out of Scope

- Audio Overview (the NotebookLM "podcast" feature). Future.
- Mind Map visualization in the frontend. Backend persists the graph; frontend can render it.
- YouTube, audio, image, and Google Drive Source kinds. Schema is shaped to admit them; the ingestion workers are not.
- Multi-language UI. The backend returns English-only strings via the existing AI prompts.
- Sharing Notebooks between Users. Confirmed off the roadmap.
- Real RAG (embeddings + vector retrieval) for Chat. MVP uses prompt stuffing. Future optimization.
- Mobile-specific UX. The frontend is web-first (TanStack Start).
- Note Type built-in "Basic (and reverse card)". Only Basic and Cloze ship in MVP.
- Image and audio Field types. Text only in MVP.
- Job-queue-based async generation. Sync streaming only in MVP.
- Stats / retention dashboards beyond session summaries.
- Add-ons, plug-ins, custom themes.
- Sharing Folders between Notebooks or between Users.
- Bulk operations on Study Materials (multi-select delete, multi-select move).
- Tagging Study Materials (only Notes are tagged in MVP).
- A `study_materials.origin_simple_flashcard_id` field (dropped: no Study Material is ever the target of a promotion).

## Open Questions (TBD by user)

The following implementation details were not explicitly decided during grilling. The PRD assumes a default; the user can override before any work begins.

- **Tag structure** — flat (default) vs hierarchical. PRD assumes flat.
- **Note Type field editing** — adding fields is allowed; renaming or deleting an existing field is forbidden (existing Notes keep their data unchanged).
- **Note Type deletion** — when a Note Type is deleted, dependent Notes and Cards are cascade-deleted. User is warned.
- **Field placeholder syntax** — `{{FieldName}}` (Anki-compatible). Rendered as plain text with markdown.
- **Provider key rotation** — when a User replaces a Provider Key, the new key takes effect on the next AI call. There is no grace period for the old key.
- **Card generation limits** — a single Generation Request is capped at 50 Study Materials. Larger requests are rejected with a 4xx error.
- **Daily review limits** — defaults are 20 new / 200 review per User per day. Configurable in a future "settings" feature.
- **Trash grace period configurability** — 30 days is the MVP default. A future "settings" feature will let Users adjust it. (Listed for awareness; not a blocker.)

## Further Notes

- The frontend Studio panel is the source of truth for the Study Material kind list. If it changes, this PRD should be updated.
- The frontend already has the studio-resources component, expanded-study-materials, mobile-study-materials-panel, and a chat panel. The backend will need to support all six kind shapes and the chat endpoint.
- The detailed Study Materials spec — per-kind JSONB shapes, Folders/Trash lifecycle, full endpoint surface, and test seams — is in **PRD-0002**. This PRD captures the user-facing stories and the cross-module decisions; PRD-0002 captures the build-level detail.
- ADR-0001 (DB-backed sessions) is already in place. No additional ADR is required for the MVP decisions, but a future ADR for "SM-2 vs FSRS" and another for "Provider key encryption scheme" may be useful once those decisions are revisited.
- The `ready-for-agent` triage label applies when issues are created in the project tracker. This PRD should be sliced into issues via the `to-issues` skill before any single agent picks up work.
