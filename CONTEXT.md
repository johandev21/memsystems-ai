# Context

## Glossary

### User
A person authenticated via Google OAuth. Auto-created on first login. Single auth method — no email/password.

### Notebook
The User's primary workspace. Holds Sources and Study Materials. Owned by a single User — no sharing. Notebooks do not host review state.

### Source
A piece of content the User attaches to a Notebook. The raw material from which Study Materials are derived.

Supported Source kinds in MVP:
- **Pasted text** (rich text or markdown).
- **URL** (web page; main content scraped and extracted).
- **Uploaded file**: PDF, Markdown, TXT, or DOCX (text extracted).

Other kinds (YouTube, audio, images, Google Drive) are intentionally out of scope for MVP. The Source table is shaped to admit them later as new `kind` values.

### Source File Storage
Uploaded files (PDF, MD, TXT, DOCX) live in S3-compatible object storage. MVP target: Cloudflare R2 in production, MinIO for local dev. The Postgres `sources` row holds the bucket key, content type, file size, checksum, and the extracted text.

### Study Material
An artifact that lives inside a Notebook. Editable. AI generation is optional — Users can author Study Materials manually without using the Study Assistant.

The canonical kinds in MVP, taken from the Studio panel in the frontend:
- **Quiz** — a multi-choice question with options and a correct answer.
- **Simple Flashcard** — a question/answer pair.
- **Report** — a long-form markdown document.
- **Roadmap** — an ordered learning plan.
- **Slide Deck** — an ordered list of slides, each with title and body.
- **Mind Map** — a graph of labeled nodes and edges.

Each kind has its own storage shape inside the Study Material row. The Studio panel in the frontend is the source of truth for the kind list.

### Simple Flashcard
A Study Material with a front/back structure. Has no review state and is not in any review queue. Exists only as static content inside its Notebook. Generic by design — produced by the Study Assistant or quickly typed by the User.

### Global SRS Pool
A User's single, Notebook-agnostic collection of Notes. The study queue is one list of Cards aggregated from the Notes in this pool.

### Note Type
A user-defined schema for the Global SRS Pool. Defines a set of Fields and one or more Card Templates. The User can author custom Note Types or use built-in defaults (e.g. "Basic", "Cloze"). Note Types are scoped to a single User — there is no sharing in MVP.

### Note
An instance of a Note Type with values for each Field. The atomic content unit of the Global SRS Pool. One Note produces one or more Cards (one per Card Template). Each Note carries zero or more Tags.

### Card Template
A rendering rule inside a Note Type that produces a Card from a subset of the Note's Fields. Defines the front and back as text templates. Markdown is supported for inline formatting.

### Card
The actual reviewable unit. Carries its own SM-2 state. Belongs to exactly one Note. Each Note produces 1+ Cards.

### Field
A named data slot inside a Note Type. Holds a text value in MVP. The schema is shaped so image and audio Field types can be added later as new variants of the same column.

### Tag
A user-defined label attached to a Note. Used to filter the review queue and organize Notes within the pool.

### Review Session
A run of the Anki-like study UI. Shows the User a sequence of Cards from the Global SRS Pool, the User grades each one, the Spaced Repetition System updates the Card's state.

### Review Grade
The quality score the User assigns to a Card after reviewing it. Exposed in the review UI as four buttons — **Again, Hard, Good, Easy** — which map to SM-2 quality values 0, 3, 4, 5. Stored on the Card as the raw 0-5 value so the algorithm remains pure SM-2. The per-button interval modifier is configurable per Note Type. Only the User assigns grades; the Study Assistant never does.

### Card State
A Card is in one of three states: **New** (never reviewed), **Learning** (recently introduced, on short intervals until it graduates), **Review** (graduated, on SM-2 intervals). A Card may also be **Suspended**, which is a flag that hides it from the review queue without losing its state. Suspended is a presentation concept, not a state.

### Spaced Repetition System
The review scheduling mechanism, using the SM-2 algorithm with an Anki-style Learning phase. Operates on Cards in the Global SRS Pool. A Card's state is updated after every Review Grade.

### Promotion
The act of creating a Note (and its Cards) in the Global SRS Pool from a Simple Flashcard. The User chooses a Note Type; the Study Assistant adapts the Simple Flashcard's content into the Note Type's Fields; the User previews and can edit before saving. The Simple Flashcard stays in its Notebook; the new Note keeps a reference back to it for traceability.

### Generation Request
A User-initiated request to the Study Assistant to produce Study Materials within a Notebook. Specifies the subset of Sources to include and a Generation Brief. Lives at the Notebook level — the Study Assistant sees the concatenated text of the selected Sources.

### Generation Brief
The freeform text the User supplies with a Generation Request, phrased as the result they want (e.g. "Make 20 Q&A cards focused on definitions"). The Study Assistant treats it as a high-level instruction alongside the selected Sources' text.

### Notebook Chat
A persistent, per-Notebook conversation with the Study Assistant. The Assistant is grounded in the Notebook's selected Sources — it answers questions using only what the Sources say and cites which Source(s) it drew from. The full message history is stored.

### Study Assistant
The AI module that generates Study Materials, answers questions via chat, and powers the Notebook workspace. Uses either (a) platform-supplied model access or (b) the User's Provider Key. Accessible only to authenticated Users.

### Provider
An external LLM service the User can connect to. MVP supports: **OpenAI, Anthropic, Google (Gemini), Deepseek, MiniMax, Qwen**. Each Provider has a fixed menu of models.

### Provider Key
A User-supplied API key for an external Provider. Stored encrypted at rest, scoped to a single User. Opt-in: Users can run the Study Assistant without any Provider Key using platform-supplied access.
