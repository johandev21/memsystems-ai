# Product Requirements Document (PRD)
## Self-Study AI Web Application
**Version:** 1.0.0 — MVP
**Status:** Draft
**Last Updated:** 2026-04-21

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Goals & Success Metrics](#2-goals--success-metrics)
3. [Target Users](#3-target-users)
4. [Tech Stack](#4-tech-stack)
5. [Architecture Overview](#5-architecture-overview)
6. [Authentication & User Management](#6-authentication--user-management)
7. [Monetization & Subscription Tiers](#7-monetization--subscription-tiers)
8. [Internationalization (i18n)](#8-internationalization-i18n)
9. [Design System](#9-design-system)
10. [Core Data Model](#10-core-data-model)
11. [Notebook & File System](#11-notebook--file-system)
12. [Source Ingestion Pipeline](#12-source-ingestion-pipeline)
13. [AI Provider Integration](#13-ai-provider-integration)
14. [File Types & Generation](#14-file-types--generation)
    - 14.1 [Flashcards](#141-flashcards)
    - 14.2 [Quiz](#142-quiz)
    - 14.3 [Roadmap](#143-roadmap)
    - 14.4 [Audio Overview](#144-audio-overview)
    - 14.5 [Report](#145-report)
    - 14.6 [Infographic](#146-infographic)
    - 14.7 [Mind Map](#147-mind-map)
    - 14.8 [Slide Deck](#148-slide-deck)
15. [FSRS Long-Term Memory System](#15-fsrs-long-term-memory-system)
16. [Notebook Chat Interface](#16-notebook-chat-interface)
17. [Background Job System](#17-background-job-system)
18. [Notification System](#18-notification-system)
19. [Global Search](#19-global-search)
20. [Development Phases & Milestones](#20-development-phases--milestones)
21. [Non-Functional Requirements](#21-non-functional-requirements)
22. [Out of Scope (Post-MVP)](#22-out-of-scope-post-mvp)

---

## 1. Product Overview

### 1.1 Vision

A self-study web application that combines **scientifically proven learning methods** with **AI-powered content generation**. The app empowers self-directed learners to transform any source material into a comprehensive suite of study assets — while keeping the human in full control. AI is always optional and every AI-generated output is fully editable.

### 1.2 Core Pillars

| Pillar | Description |
|--------|-------------|
| **Pillar 1 — Scientific Study Methods** | Spaced repetition (FSRS algorithm), active recall, deliberate practice |
| **Pillar 2 — AI Content Generation** | Audio Overviews, Reports, Infographics, Mind Maps, Slide Decks (NotebookLM parity) |

### 1.3 Design Philosophy

- **User control is paramount.** Every AI-generated output can be manually created, edited, or overridden.
- **AI is a tool, not a dependency.** Users must never be locked into AI usage.
- **Science-first learning.** Study features are grounded in cognitive science research.
- **Clean, minimal, focused UI.** Distraction-free environment built for deep study.

---

## 2. Goals & Success Metrics

### 2.1 MVP Goals

- Launch a fully functional web app with all Pillar 1 and Pillar 2 features.
- Support 3 languages (English, Spanish, Chinese) at launch.
- Implement a working freemium model with Stripe or Polar.
- Achieve a stable, responsive web experience on all major screen sizes.

### 2.2 Success Metrics (Post-Launch KPIs)

| Metric | Target |
|--------|--------|
| User activation rate | ≥ 60% (creates at least 1 notebook) |
| FSRS daily active reviewers | ≥ 30% of registered users |
| Free → Pro conversion | ≥ 5% within 60 days |
| Average session duration | ≥ 15 minutes |
| Source ingestion success rate | ≥ 98% |

---

## 3. Target Users

### 3.1 Primary Users

| Persona | Description |
|---------|-------------|
| **The Builder (Self)** | The developer/founder using the app as a personal daily driver |
| **The Self-Directed Learner** | Adults learning independently outside formal education (languages, skills, certifications) |
| **The General Learner** | Anyone who wants to study any topic more effectively |

### 3.2 User Assumptions

- Comfortable with modern web applications.
- May or may not have technical backgrounds.
- Likely already familiar with tools like Anki, Notion, or NotebookLM.
- Motivated but time-constrained — they need tools that respect their study time.

---

## 4. Tech Stack

### 4.1 Frontend

| Technology | Purpose |
|------------|---------|
| **TanStack Start** | Full-stack React framework (used as frontend only) |
| **TanStack Query** | Server state management and data fetching |
| **TanStack Form** | Form management and submission |
| **TanStack Table** | Data table rendering (used where tabular data is needed) |
| **shadcn/ui** | Component library (preset: `b4W3hMPkQ`, December 2025 CLI) |
| **Zod** | Frontend input validation and schema definitions |

> Additional libraries to be added as requirements emerge during development.

### 4.2 Backend

| Technology | Purpose |
|------------|---------|
| **Elysia.js** | Backend framework |
| **Bun** | JavaScript runtime (replaces Node.js) |
| **Better Auth** | Authentication library (open-source) |
| **Drizzle ORM** | Database ORM |
| **PostgreSQL** | Primary relational database |
| **Zod** | Backend validation layer |
| **Biome** | Linting and formatting (replaces ESLint + Prettier) |

### 4.3 AI & External Services

| Service | Purpose |
|---------|---------|
| **Vercel AI SDK** | Unified interface to all AI providers |
| **OpenAI** | GPT models |
| **Anthropic** | Claude models |
| **Google Gemini** | Gemini models |
| **xAI (Grok)** | Grok models |
| **Kimi** | Moonshot AI models |
| **Qwen** | Alibaba models |
| **DeepSeek** | DeepSeek models |
| **MiniMax** | MiniMax models |
| **Z.ai (GLM)** | Zhipu AI models |
| **OpenRouter** | Recommended unified API key gateway (BYOK) |
| **ElevenLabs** | Text-to-speech for Audio Overview generation |

### 4.4 Payments

| Option | Notes |
|--------|-------|
| **Stripe** | Primary candidate — industry standard |
| **Polar** | Alternative — better native Better Auth integration |

> Decision to be finalized before the billing development sprint. Both support monthly + annual billing with discounts.

---

## 5. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│  TanStack Start · shadcn/ui · TanStack Query/Form/Table  │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS / REST / SSE
┌───────────────────────────▼─────────────────────────────┐
│                  BACKEND API (Elysia.js / Bun)           │
│  Better Auth · Drizzle ORM · Zod · Biome                 │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ Auth Router │  │ Notebook API │  │ AI Gateway      │ │
│  └─────────────┘  └──────────────┘  └─────────────────┘ │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ File API    │  │ Job Queue    │  │ Search API      │ │
│  └─────────────┘  └──────────────┘  └─────────────────┘ │
└───────────────────────────┬─────────────────────────────┘
                            │
          ┌─────────────────┼──────────────────┐
          ▼                 ▼                  ▼
   ┌─────────────┐  ┌──────────────┐  ┌───────────────┐
   │  PostgreSQL  │  │  AI Provider │  │  ElevenLabs   │
   │  (Drizzle)  │  │  APIs (BYOK) │  │  TTS API      │
   └─────────────┘  └──────────────┘  └───────────────┘
```

### 5.1 Key Architectural Decisions

- **Monorepo structure** recommended: `/apps/web` (TanStack Start), `/apps/api` (Elysia), `/packages/shared` (Zod schemas, types).
- **BYOK model**: All AI API calls are proxied through the backend. The user's encrypted API keys are retrieved server-side and injected into requests. Keys are never sent to the client.
- **Background jobs**: File generation tasks are queued and processed asynchronously. A job status table in Postgres tracks state.
- **Streaming**: Chat responses use Server-Sent Events (SSE) for real-time streaming via the Vercel AI SDK.

---

## 6. Authentication & User Management

### 6.1 Authentication Methods

| Method | Provider |
|--------|----------|
| Email + Password | Better Auth built-in |
| OAuth — Google | Better Auth Google plugin |
| OAuth — GitHub | Better Auth GitHub plugin |

### 6.2 Auth Flows

- **Registration:** Email/password with email verification. OAuth creates account on first login.
- **Login:** Standard session-based auth via Better Auth. Sessions stored in Postgres.
- **Password Reset:** Email-based reset link with expiry.
- **Account Deletion:** Soft delete — user data retained for 30 days before permanent removal.

### 6.3 User Profile

Each user record stores:

```
users
  id                uuid (PK)
  email             string (unique)
  display_name      string
  avatar_url        string (nullable)
  preferred_language enum (en | es | zh)
  preferred_ai_provider string (nullable)
  subscription_tier enum (free | pro | max)
  subscription_status enum (active | cancelled | past_due)
  created_at        timestamp
  updated_at        timestamp
```

### 6.4 API Key Management

```
user_api_keys
  id                uuid (PK)
  user_id           uuid (FK → users)
  provider          string (e.g. "openai" | "anthropic" | "openrouter" | ...)
  encrypted_key     text (AES-256 encrypted server-side)
  label             string (user-defined nickname)
  is_active         boolean
  created_at        timestamp
  last_used_at      timestamp (nullable)
```

**Security requirements:**
- Keys encrypted with AES-256 before storage using a server-side secret.
- Encryption secret stored as an environment variable, never in the database.
- Keys are decrypted only at request time, in memory, never logged or returned to the client.
- Users can add one key per provider (or multiple with labels) and designate one as active.
- **OpenRouter is the recommended default** — surface this prominently in the onboarding flow and settings UI with a clear explanation of its benefits (one key, access to all models).

---

## 7. Monetization & Subscription Tiers

### 7.1 Plan Limits

| Feature | Free | Pro (5×) | Max (20×) |
|---------|------|----------|-----------|
| Notebooks | 3 | 15 | 60 |
| Subfolder levels | 3 | 15 | 60 |
| Monthly price | $0 | TBD | TBD |
| Annual price | $0 | TBD (discounted) | TBD (discounted) |

> Pricing amounts to be determined before launch. Annual discount recommendation: 20–30% off monthly rate.

### 7.2 Billing Integration

- **Processor:** Stripe or Polar (final decision before billing sprint).
- **Billing cycles:** Monthly and Annual.
- **Annual discount:** Applied at checkout.
- **Upgrade/downgrade:** Available at any time. Downgrades take effect at end of current billing cycle.
- **Usage enforcement:** Middleware checks subscription tier and current usage counts before allowing notebook or subfolder creation. Returns a structured error with upgrade CTA if limit is reached.

### 7.3 Subscription Database Schema

```
subscriptions
  id                  uuid (PK)
  user_id             uuid (FK → users)
  processor_id        string (Stripe/Polar subscription ID)
  plan                enum (free | pro | max)
  billing_cycle       enum (monthly | annual)
  status              enum (active | cancelled | past_due | trialing)
  current_period_start timestamp
  current_period_end  timestamp
  created_at          timestamp
  updated_at          timestamp
```

---

## 8. Internationalization (i18n)

### 8.1 Supported Languages (MVP)

| Code | Language |
|------|----------|
| `en` | English |
| `es` | Spanish |
| `zh` | Chinese (Simplified) |

### 8.2 Two-Layer i18n

**Layer 1 — UI Translations:**
- All labels, buttons, navigation items, error messages, folder names (including `Sources`), and file type names are translated.
- Translation files stored as JSON per locale (e.g., `en.json`, `es.json`, `zh.json`).
- The `Sources` folder name must be translated per the user's active language.
- Default language: English. Falls back to English if a translation key is missing.

**Layer 2 — AI Output Language:**
- A global user setting (`preferred_language`) is injected into every AI prompt as a system-level instruction.
- All AI-generated content (flashcards, quizzes, reports, roadmaps, etc.) is produced in the user's selected language.
- Users can override the language on a per-generation basis in the generation options panel.

### 8.3 Language Setting Location

- Available in: User Settings → Preferences → Language.
- Changing language takes effect immediately for UI; AI output language applies to new generations only.

---

## 9. Design System

### 9.1 Component Library

- **shadcn/ui** with preset `b4W3hMPkQ` (December 2025 `npx shadcn create` CLI).
- Both **light mode** and **dark mode** supported from day one, respecting system preference by default with manual override.

### 9.2 Design Principles

- Flat, clean surfaces. No decorative gradients or excessive shadows.
- Generous whitespace to reduce cognitive load during study sessions.
- Distraction-free content areas — toolbars collapse when not in use.
- Consistent use of shadcn's built-in color tokens for semantic meaning (info, success, warning, danger).

### 9.3 Layout

- **Responsive web app** — fully functional on desktop, tablet, and mobile browsers.
- **No PWA** for MVP.
- Sidebar navigation for notebooks/files on desktop; bottom nav or hamburger menu on mobile.

---

## 10. Core Data Model

### 10.1 Entity Relationship Summary

```
users
  └─── user_api_keys
  └─── subscriptions
  └─── notebooks
         └─── subfolders
                └─── subfolders (recursive, up to tier limit)
         └─── files (sources, flashcards, quizzes, roadmaps, etc.)
         └─── chat_sessions
                └─── chat_messages
  └─── long_term_flashcard_decks
         └─── long_term_flashcards (FSRS data)
  └─── job_queue
  └─── notifications
```

### 10.2 Key Tables (High-Level)

```
notebooks
  id, user_id, title, description, created_at, updated_at

subfolders
  id, notebook_id, parent_subfolder_id (nullable), name, created_at

files
  id, notebook_id, subfolder_id (nullable), file_type (enum),
  title, content (jsonb), status (enum), created_at, updated_at

sources
  id, notebook_id, subfolder_id (nullable), type (enum: pdf|docx|txt|md|url|youtube|mp3),
  original_filename, storage_path, extracted_text, metadata (jsonb),
  status (enum: pending|processing|ready|error), created_at

chat_sessions
  id, notebook_id, user_id, title, created_at, updated_at

chat_messages
  id, session_id, role (enum: user|assistant), content, created_at

long_term_decks
  id, user_id, name, created_at

long_term_flashcards
  id, deck_id, source_file_id, front, back,
  fsrs_stability, fsrs_difficulty, fsrs_due_date,
  fsrs_last_review, fsrs_reps, fsrs_lapses, fsrs_state,
  is_active, created_at

job_queue
  id, user_id, file_id (nullable), job_type (enum), status (enum),
  payload (jsonb), result (jsonb, nullable), error (text, nullable),
  created_at, started_at, completed_at

notifications
  id, user_id, type (enum), title, body, is_read, related_job_id,
  created_at
```

---

## 11. Notebook & File System

### 11.1 Hierarchy

```
Notebook
  ├── Sources/ (always present, translated per user language)
  ├── [optional subfolders]
  │     ├── Sources/ (scoped to subfolder)
  │     ├── *-flashcards
  │     ├── *-quiz
  │     ├── *-roadmap
  │     ├── *-audio-overview
  │     ├── *-report
  │     ├── *-infographic
  │     ├── *-mind-map
  │     └── *-slide-deck
  ├── *-flashcards
  ├── *-quiz
  ├── *-roadmap
  ├── *-audio-overview
  ├── *-report
  ├── *-infographic
  ├── *-mind-map
  └── *-slide-deck
```

### 11.2 Notebook Rules

- Users can create, rename, and delete notebooks.
- Deletion is soft-delete with a 7-day recovery window, then permanent.
- The `Sources` folder is automatically created with each notebook and each subfolder and cannot be deleted or renamed (only its translated display name changes with the UI language).
- File names follow the convention: `[user-defined-prefix]-[file-type]` (e.g., `chapter-1-flashcards`).

### 11.3 Subfolder Rules

- Users can create subfolders within a notebook or within another subfolder.
- Maximum subfolder depth is enforced by the user's subscription tier (Free: 3, Pro: 15, Max: 60).
- Subfolders can be renamed and moved.
- Deleting a subfolder deletes all files and nested subfolders within it (with confirmation prompt).

### 11.4 File Operations

All file types support:
- **Create** — manually or via AI generation.
- **View** — rendered in the appropriate viewer (card flipper, quiz runner, roadmap canvas, etc.).
- **Edit** — full manual editing of all content fields.
- **Rename** — inline rename.
- **Move** — move to another subfolder or to the root notebook.
- **Duplicate** — creates a copy.
- **Delete** — soft delete with confirmation.
- **Download** — where applicable (Audio Overview as MP3, Slide Deck as PPTX/PDF, Mind Map as PNG/JPG, Infographic as PNG/JPG).

---

## 12. Source Ingestion Pipeline

### 12.1 Supported Source Types (All MVP)

| Type | Format | Notes |
|------|--------|-------|
| PDF | `.pdf` | Text extraction + OCR fallback |
| Word Document | `.docx` | Text + structure extraction |
| Plain Text | `.txt` | Direct ingestion |
| Markdown | `.md` | Parsed and preserved |
| URL / Web Page | Any HTTP/HTTPS URL | Scrape visible text content |
| YouTube Video | YouTube URL | Transcript extraction via YouTube API or caption scraping |
| Audio File | `.mp3` | Transcription via AI (Whisper or equivalent) |

### 12.2 Ingestion Flow

```
User uploads / pastes URL
        │
        ▼
Backend receives source
        │
        ▼
Job created (status: pending) → background queue
        │
        ▼
Worker processes source:
  - File: extract text, store in sources.extracted_text
  - URL: scrape content
  - YouTube: fetch transcript
  - MP3: transcribe audio
        │
        ▼
Source status → ready (or error with message)
        │
        ▼
Source is now available for AI generation and chat context
```

### 12.3 Storage

- Binary files (PDF, DOCX, MP3) uploaded to object storage (e.g., S3-compatible bucket or Supabase Storage).
- Storage path saved in `sources.storage_path`.
- Extracted text saved in `sources.extracted_text` (Postgres text column).
- Max file size limit: define per plan (suggested: Free: 10MB, Pro: 50MB, Max: 200MB).

### 12.4 Source-to-Generation Relationship

- When generating any file type, the user selects which sources from the notebook (or subfolder) to include.
- The selected sources' extracted text is injected into the AI prompt as context.
- Multiple sources can be combined into a single generation.

---

## 13. AI Provider Integration

### 13.1 Provider Architecture

- All AI calls are routed through the **Vercel AI SDK** on the backend.
- The user's selected provider and encrypted API key are resolved server-side per request.
- **OpenRouter is the recommended provider** — surfaced in onboarding and settings with an explanatory tooltip ("One key to access all models").

### 13.2 Supported Providers

| Category | Provider |
|----------|---------|
| Western | OpenAI, Anthropic, Google Gemini, xAI (Grok) |
| Chinese | Kimi (Moonshot), Qwen (Alibaba), DeepSeek, MiniMax, Z.ai (GLM) |
| Gateway | OpenRouter (recommended) |

### 13.3 Model Selection UX

- In Settings → AI Providers, users can:
  - Add API keys for one or more providers (with provider label and optional nickname).
  - Set one provider as the active default.
  - Select a specific model within the active provider (dropdown populated via provider's model list or hardcoded curated list).
- The active provider/model is displayed in the chat interface and can be changed per session.

### 13.4 AI Output Language

- Every AI generation prompt includes a system instruction:
  `"Respond in [language]. All output must be in [language]."`
- Language is derived from `user.preferred_language` unless overridden in the generation options panel.

### 13.5 Prompt Architecture

- Prompts are modular: a base system prompt + a task-specific instruction + source context + user customization parameters.
- Prompts are server-side only (never exposed to the client).
- All prompts include explicit instructions for structured output (JSON where applicable) for reliable parsing.

---

## 14. File Types & Generation

> All file types follow this shared pattern:
> 1. User opens generation panel for that file type.
> 2. User selects source(s) from the notebook.
> 3. User configures generation options (language, length, style, etc.).
> 4. User can choose AI generation OR manual creation.
> 5. Background job is created; user is notified on completion.
> 6. Generated content is rendered in the appropriate viewer.
> 7. User can edit any part of the output.

---

### 14.1 Flashcards

#### Quick Flashcards (NotebookLM-style)

**Purpose:** Rapid study tool for immediate review. No spaced repetition algorithm.

**Generation Options:**
- Number of cards to generate
- Card difficulty level (beginner / intermediate / advanced)
- Focus area (key terms / concepts / formulas / custom)
- Language (inherits global setting, overridable)

**Study Session UX:**
- Card flip animation (front → back).
- Navigation: Previous / Next / Shuffle.
- On each card: a **"Save to Long-Term Memory"** toggle button.
  - Toggle is persistent — cards remember their promoted state.
  - Toggling adds/removes the card from the FSRS system (fully reversible).
- After session: summary screen showing cards reviewed and how many are saved to long-term.

**Manual Creation:**
- Users can add, edit, delete, and reorder cards at any time.
- Bulk import via CSV (front, back columns).

**Data Schema:**
```
flashcard_files
  id, file_id, created_at

flashcards
  id, flashcard_file_id, front (text), back (text),
  is_promoted_to_ltm (boolean), order_index, created_at, updated_at
```

---

#### Long-Term Flashcards (FSRS)

**Purpose:** Durable memory consolidation using the FSRS algorithm.

**Algorithm:** FSRS (Free Spaced Repetition Scheduler) — no fallback.

**Review UI:**
- Card flip to reveal answer.
- 4-button rating: **Again / Hard / Good / Easy**
- Session ends when all due cards are reviewed.
- Users can also browse and manually review any card at any time outside of the scheduled session.

**Global Review Dashboard:**
- Accessible from the main navigation (e.g., "Review" tab).
- Shows all promoted flashcards across all notebooks.
- Cards are grouped by their **origin notebook** by default.
- Users can **create custom decks** and move cards between decks freely.
- Dashboard displays: cards due today, upcoming review forecast, streak, total cards.

**FSRS Data per Card:**
```
long_term_flashcards
  fsrs_stability     float
  fsrs_difficulty    float
  fsrs_due_date      timestamp
  fsrs_last_review   timestamp
  fsrs_reps          integer
  fsrs_lapses        integer
  fsrs_state         enum (new | learning | review | relearning)
```

---

### 14.2 Quiz

#### MVP Scope: Multiple Choice

**Question format:**
- Question stem
- 4 answer options (A, B, C, D)
- 1 correct answer
- Optional explanation for the correct answer

**Long-Term Scope (Post-MVP):**
- True / False
- Short Answer
- Fill in the Blank
- Matching

**Generation Options:**
- Number of questions
- Difficulty level
- Question types to include (MVP: multiple choice only)
- Focus area (user can specify topics)
- Language

**Grading System (Hybrid):**
- **AI-graded mode:** For question types where AI can evaluate the response (short answer in post-MVP). Configured via quiz settings.
- **Self-graded mode:** User marks their own answer as correct/incorrect. Available for all question types.
- Grading mode is configurable per quiz file and per session.

**Quiz Session UX:**
- One question at a time.
- Progress indicator (Question 3 of 10).
- Immediate feedback after each answer (correct/incorrect + explanation if available).
- End screen: score, time taken, questions to review.
- Option to retry incorrect questions only.

**Manual Creation:**
- Users can create quizzes from scratch without AI.
- Full editing of all question and answer fields.
- Ability to add/remove questions at any time.

**Data Schema:**
```
quiz_files
  id, file_id, grading_mode (enum: ai | self | hybrid), created_at

quiz_questions
  id, quiz_file_id, question_text, question_type (enum),
  correct_answer, explanation (nullable), order_index, created_at

quiz_answer_options
  id, question_id, option_text, is_correct, option_label (A/B/C/D)
```

---

### 14.3 Roadmap

**Purpose:** AI-generated, interactive learning path — a generalized roadmap.sh experience for any topic.

**Generation Options:**
- Topic / goal (free text)
- Experience level (beginner / intermediate / advanced)
- Time horizon (e.g., "6 weeks", "3 months")
- Learning style preference (structured/sequential vs. exploratory)
- Language

**Roadmap Node Structure:**
Each node contains:
- Title
- Description / summary
- Status: `not-started` | `in-progress` | `done` | `skipped`
- Optional: curated resources (links, descriptions) — AI-suggested, user-editable
- Optional: sub-nodes (nested skills)

**Interactivity:**
- Clicking a node opens a side panel with full details and resources.
- Status is updated via click (cycles through: not-started → in-progress → done, or right-click for "skip").
- Progress bar at the top of the roadmap showing % completed.
- Rendered using a graph/tree library (e.g., React Flow or similar).

**Manual Creation:**
- Users can add, edit, delete, and connect nodes manually.
- Drag-and-drop repositioning.

**Data Schema:**
```
roadmap_files
  id, file_id, topic, created_at

roadmap_nodes
  id, roadmap_file_id, parent_node_id (nullable), title,
  description, status (enum), resources (jsonb), position_x, position_y,
  order_index, created_at, updated_at
```

---

### 14.4 Audio Overview

**Purpose:** Multi-voice AI dialogue that explains source material — like a podcast episode generated from your notes.

**Merged from:** `*-podcast` and `*-audio-overview` — now a single unified file type: `*-audio-overview`.

**Generation Options:**
- **Length:** Short (~5 min) / Medium (~15 min) / Long (~30 min)
- **Number of hosts:** 2 (default) — potentially expandable post-MVP
- **Tone:** Conversational / Educational / Debate / Storytelling
- **Focus:** Summary / Deep Dive / Key Takeaways / Q&A style
- **Language:** Inherits global setting, overridable
- **Voice selection:** ElevenLabs voice IDs for each host (preset or user-selectable)

**Generation Flow:**
1. AI (via Vercel AI SDK) generates the dialogue script as structured text (JSON with speaker turns).
2. Background job submits each speaker's lines to ElevenLabs TTS API.
3. Audio segments are concatenated into a single MP3.
4. MP3 stored in object storage; file record updated with audio URL.

**Playback UX:**
- In-app audio player with: play/pause, seek bar, playback speed (0.75×, 1×, 1.25×, 1.5×, 2×).
- Transcript display alongside audio (synchronized highlighting optional, post-MVP).
- Download as MP3.

**Data Schema:**
```
audio_overview_files
  id, file_id, script (jsonb — array of {speaker, text}),
  audio_url, duration_seconds, elevenlabs_voice_config (jsonb),
  created_at
```

---

### 14.5 Report

**Purpose:** A structured, long-form written summary of source material. NotebookLM report parity.

**Structure (AI-generated, user-editable):**
- Title
- Executive Summary
- Key Concepts / Topics
- Detailed Analysis
- Important Quotes / Evidence
- Conclusions
- Further Reading Suggestions

**Generation Options:**
- Report style (Academic / Executive / Study Guide / ELI5)
- Length (Short / Medium / Long)
- Sections to include (user can toggle which sections to generate)
- Language

**Editor:**
- Rich text editor (markdown-based, rendered as formatted document).
- All sections fully editable.
- Users can add, remove, and reorder sections.

**Export:** Not in MVP scope (post-MVP: PDF export).

---

### 14.6 Infographic

**Purpose:** A visual summary of key concepts from source material, generated as a PNG/JPG image.

**Infographic Types (User Selection):**
- Timeline
- Concept Breakdown / Explainer
- Comparison Chart
- Process Flow
- Key Statistics / Data Points
- How It Works

**Generation Flow:**
1. User selects infographic type and sources.
2. AI generates structured content (title, sections, key points).
3. A rendering engine (server-side, e.g., canvas-based or HTML-to-image library) produces the PNG/JPG.
4. Image stored in object storage; file record updated.

**Generation Options:**
- Infographic type (from list above)
- Color scheme / style
- Language

**UX:**
- Preview image displayed in the file viewer.
- Download as PNG or JPG.
- Regeneration with different type or options.
- **Note:** Image cannot be directly edited in-app (post-MVP: regenerate with modified parameters or prompt).

---

### 14.7 Mind Map

**Purpose:** A visual node-based map of concepts and their relationships.

**Rendering:** Library-rendered using a JavaScript graph library (e.g., React Flow, D3, or similar). Interactive — not a static image.

**Generation Options:**
- Depth / complexity (Simple / Detailed)
- Central concept (auto-detected or user-defined)
- Language

**Interactivity (Post-Generation):**
- Pan and zoom.
- Click nodes to expand/collapse branches.
- Node labels displayed clearly.
- **Read-only by default** in MVP. (Full node editing post-MVP.)

**Export:** Download as PNG or JPG via canvas capture.

**Data Schema:**
```
mind_map_files
  id, file_id, central_topic, created_at

mind_map_nodes
  id, mind_map_file_id, parent_node_id (nullable), label,
  description (nullable), position_x, position_y, created_at
```

---

### 14.8 Slide Deck

**Purpose:** A presentation summarizing source material. NotebookLM slide deck parity.

**Generation Options:**
- Number of slides (suggested range or auto)
- Presentation style (Formal / Educational / Minimal / Story)
- Include speaker notes (yes/no)
- Language

**Slide Structure (per slide):**
- Title
- Body content (bullet points, short paragraphs)
- Speaker notes (optional)
- Layout type (title slide, content slide, two-column, image + text)

**Editor:**
- Slide-by-slide editor.
- Editable title, body, and speaker notes per slide.
- Add / remove / reorder slides.
- Basic layout selection.

**Export:**
- **PPTX** (PowerPoint format via a server-side library, e.g., PptxGenJS).
- **PDF** (rendered from PPTX or HTML).

**Data Schema:**
```
slide_deck_files
  id, file_id, title, theme, created_at

slides
  id, slide_deck_file_id, order_index, layout_type,
  title, body (jsonb), speaker_notes (text nullable), created_at
```

---

## 15. FSRS Long-Term Memory System

### 15.1 Global Review Dashboard

- **Entry point:** Persistent navigation item (e.g., "Review" with a due-card badge count).
- **Default view:** All decks listed with due card counts, next review date, and progress stats.

### 15.2 Deck Management

- **Auto-created decks:** One deck per notebook, created when the first card is promoted from that notebook.
- **Custom decks:** Users can create decks with any name.
- **Card movement:** Cards can be dragged/moved between decks freely.
- **Deck operations:** Rename, delete (cards returned to their original notebook deck or a default deck).

### 15.3 Review Session

```
Session Start → Show due cards for selected deck(s)
   │
   ▼
Display card front
   │
User flips card
   │
   ▼
Display card back
   │
User rates: [Again] [Hard] [Good] [Easy]
   │
   ▼
FSRS calculates next due date, updates fsrs_* fields
   │
Next card → until queue is empty
   │
   ▼
Session Summary (cards reviewed, Again/Hard/Good/Easy counts, estimated retention %)
```

### 15.4 FSRS Implementation Notes

- Implement FSRS v4 or v5 (latest stable).
- All FSRS parameters (w0–w19) stored per user for personalization (post-MVP: parameter optimization based on review history).
- Default FSRS parameters used at launch.

### 15.5 Statistics

Display per deck and globally:
- Total cards (new / learning / review / relearning)
- Cards due today
- Review forecast (next 7 days bar chart)
- Current streak
- Average retention rate

---

## 16. Notebook Chat Interface

### 16.1 Scope

- **One chat interface per notebook.**
- Chat is contextually aware of **all sources** within the notebook (across all subfolders).
- Sources, subfolders, and files within a notebook are organizational only — the chat treats all content as unified context.

### 16.2 Sessions

- Users can create **multiple named chat sessions** within a notebook.
- Sessions persist indefinitely.
- Users can switch between sessions from a session list panel.
- Sessions can be renamed and deleted.
- Default session name: `"Session [date]"` — user can rename.

### 16.3 Chat UX

- Standard chat interface (messages list + input box at bottom).
- **Streaming responses** via SSE using the Vercel AI SDK.
- Markdown rendering in responses (code blocks, lists, bold, etc.).
- Model selector visible in the chat header (shows active provider + model, clickable to change).
- Source citation: AI responses should cite which source(s) they're drawing from (prompt engineering requirement).
- Suggested follow-up prompts displayed after each response (optional, user can dismiss).

### 16.4 Context Injection

- When a chat message is sent, the backend:
  1. Retrieves all `ready` sources for the notebook.
  2. Injects extracted text as context into the system prompt (with token budget management for large notebooks).
  3. For large notebooks, implement a RAG (Retrieval-Augmented Generation) strategy — embed source chunks and retrieve top-k relevant chunks per query (post-MVP for very large notebooks; MVP: inject all source text up to model context limit).

### 16.5 Chat Data Schema

```
chat_sessions
  id, notebook_id, user_id, title, created_at, updated_at

chat_messages
  id, session_id, role (enum: user | assistant | system),
  content (text), model_used (string), created_at
```

---

## 17. Background Job System

### 17.1 Job Types

| Job Type | Trigger |
|----------|---------|
| `source.ingest` | User uploads a file or adds a URL |
| `file.generate.flashcards` | User triggers flashcard generation |
| `file.generate.quiz` | User triggers quiz generation |
| `file.generate.roadmap` | User triggers roadmap generation |
| `file.generate.audio_overview` | User triggers audio overview generation |
| `file.generate.report` | User triggers report generation |
| `file.generate.infographic` | User triggers infographic generation |
| `file.generate.mind_map` | User triggers mind map generation |
| `file.generate.slide_deck` | User triggers slide deck generation |

### 17.2 Job Lifecycle

```
created → queued → processing → completed
                             └→ failed (with error message, retryable)
```

### 17.3 Job Queue UI

- Accessible via a **Job Queue panel** (e.g., slide-out panel or persistent sidebar section).
- Displays: job type, target file name, status, progress indicator, timestamp.
- Completed jobs show a checkmark; failed jobs show an error message with a retry button.
- Users can cancel pending/queued jobs.

### 17.4 Retry Policy

- Automatic retry: up to 3 attempts for transient failures (API timeout, rate limit).
- Exponential backoff between retries.
- After 3 failures: job marked as `failed`, user notified.

---

## 18. Notification System

### 18.1 Notification Types

| Type | Trigger |
|------|---------|
| `job.completed` | A background generation job finishes successfully |
| `job.failed` | A job fails after all retries |
| `source.ready` | A source has finished processing and is ready to use |
| `review.reminder` | (Post-MVP) Daily reminder when FSRS cards are due |

### 18.2 Delivery

- **In-app notification bell** in the top navigation bar.
  - Badge count shows unread notifications.
  - Dropdown lists recent notifications with timestamp, type icon, and brief description.
  - Click-through navigates to the relevant file or job.
- **Sound:** A subtle audio cue plays when a new notification arrives (user can mute in settings).
- **Email notifications:** Not in MVP scope.

### 18.3 Notification Schema

```
notifications
  id, user_id, type (enum), title, body,
  is_read (boolean, default false),
  related_job_id (nullable FK), related_file_id (nullable FK),
  created_at
```

---

## 19. Global Search

### 19.1 Scope

Search indexes the following:
- Notebook titles and descriptions
- Subfolder names
- File titles and file type
- Source file names and extracted text content (full-text search)
- Flashcard fronts and backs
- Quiz question text

### 19.2 Search UX

- **Global search bar** accessible from the top navigation (keyboard shortcut: `Cmd/Ctrl + K`).
- Results grouped by type: Notebooks / Files / Sources / Flashcards / Questions.
- Clicking a result navigates directly to it (opens notebook, opens file, highlights source, etc.).
- Results display a snippet of matching text with the query term highlighted.

### 19.3 Technical Implementation

- PostgreSQL full-text search (`tsvector` / `tsquery`) for MVP.
- Search index updated on create/update/delete of indexed content.
- Post-MVP: consider dedicated search service (e.g., Typesense or Meilisearch) for better performance at scale.

---

## 20. Development Phases & Milestones

### Phase 1 — Foundation (Weeks 1–3)

**Goal:** Core infrastructure, auth, and empty shell.

- [ ] Monorepo setup (TanStack Start + Elysia + shared packages)
- [ ] Biome configuration (linting + formatting)
- [ ] PostgreSQL setup + Drizzle ORM schema (users, sessions)
- [ ] Better Auth integration (email/password + Google + GitHub OAuth)
- [ ] Basic routing and layout (sidebar, top nav, responsive shell)
- [ ] shadcn/ui setup with preset `b4W3hMPkQ` — light + dark mode
- [ ] i18n setup (EN/ES/ZH, UI layer only)
- [ ] Environment configuration (dev/staging/prod)

### Phase 2 — Notebooks & File System (Weeks 4–6)

**Goal:** Users can create notebooks, subfolders, and manage files.

- [ ] Notebook CRUD (create, read, update, delete with soft delete)
- [ ] Subfolder CRUD with depth limit enforcement
- [ ] File system UI (sidebar tree, file list view)
- [ ] Subscription tier limit enforcement (notebook + subfolder caps)
- [ ] File placeholder creation (empty files for each type)
- [ ] File operations (rename, move, duplicate, delete)
- [ ] Global search — basic implementation (notebook + file titles)

### Phase 3 — Source Ingestion (Weeks 7–9)

**Goal:** Users can add sources and extract text.

- [ ] File upload pipeline (PDF, DOCX, TXT, MD, MP3)
- [ ] URL scraping pipeline
- [ ] YouTube transcript extraction
- [ ] MP3 transcription (Whisper integration)
- [ ] Background job system (job queue table + worker)
- [ ] Source status tracking (pending → processing → ready/error)
- [ ] Sources viewer UI
- [ ] Job Queue UI panel
- [ ] Notification system (in-app bell + sound)
- [ ] Object storage integration (file upload/download)

### Phase 4 — AI Integration & API Keys (Weeks 10–11)

**Goal:** AI provider infrastructure and BYOK system.

- [ ] API key management UI (Settings → AI Providers)
- [ ] Encrypted key storage (AES-256)
- [ ] Vercel AI SDK integration on backend
- [ ] Provider routing (resolve active key → call correct provider)
- [ ] Model selector UI in settings and chat
- [ ] OpenRouter recommendation flow in onboarding
- [ ] AI output language injection

### Phase 5 — Notebook Chat (Week 12)

**Goal:** Working AI chat per notebook.

- [ ] Chat session CRUD (create, rename, delete sessions)
- [ ] Chat UI (messages, streaming, markdown rendering)
- [ ] Source context injection into prompts
- [ ] Session switcher panel
- [ ] Chat history persistence

### Phase 6 — Flashcards (Weeks 13–14)

**Goal:** Quick flashcards + FSRS long-term memory system.

- [ ] Quick flashcard generation (AI + manual)
- [ ] Flashcard viewer/flipper UI
- [ ] "Save to Long-Term Memory" toggle per card
- [ ] FSRS algorithm implementation
- [ ] Long-term deck management UI
- [ ] FSRS review session UI (4-button rating)
- [ ] Global review dashboard
- [ ] FSRS statistics display

### Phase 7 — Quiz & Roadmap (Weeks 15–16)

**Goal:** Multiple choice quizzes and interactive roadmaps.

- [ ] Quiz generation (AI + manual creation)
- [ ] Quiz session UI (one question at a time, feedback, score)
- [ ] Self-graded mode
- [ ] Roadmap generation (AI + manual creation)
- [ ] Roadmap node editor (React Flow or equivalent)
- [ ] Node status interaction (not-started / in-progress / done / skip)
- [ ] Progress tracking on roadmap

### Phase 8 — Pillar 2 Content Generation (Weeks 17–20)

**Goal:** All NotebookLM-parity file types.

- [ ] Report generation + rich text editor
- [ ] Audio Overview generation (AI script → ElevenLabs TTS → MP3)
- [ ] Audio player UI
- [ ] Infographic generation (AI content → image rendering → PNG/JPG)
- [ ] Mind Map generation + library-rendered interactive viewer
- [ ] Mind Map PNG/JPG export
- [ ] Slide Deck generation + slide editor
- [ ] Slide Deck PPTX + PDF export

### Phase 9 — Monetization & Payments (Week 21)

**Goal:** Working subscription system.

- [ ] Stripe or Polar integration decision + setup
- [ ] Pricing page UI
- [ ] Checkout flow (monthly + annual)
- [ ] Webhook handling (subscription created/updated/cancelled/failed)
- [ ] Plan limit enforcement across all features
- [ ] Upgrade/downgrade UX
- [ ] Billing settings page (view plan, manage subscription)

### Phase 10 — Polish, Search & Launch Prep (Weeks 22–24)

**Goal:** Production-ready launch.

- [ ] Full-text global search (sources, flashcards, quiz questions)
- [ ] Onboarding flow (first-time user walkthrough)
- [ ] Empty states for all sections
- [ ] Error boundaries and error pages (404, 500)
- [ ] Loading skeletons throughout
- [ ] Accessibility audit (keyboard nav, screen reader basics)
- [ ] Performance audit (Core Web Vitals)
- [ ] Security review (auth, API key encryption, rate limiting)
- [ ] i18n completion (ES + ZH translations for all UI strings)
- [ ] Final responsive QA across breakpoints
- [ ] Production deployment setup

---

## 21. Non-Functional Requirements

### 21.1 Performance

| Metric | Target |
|--------|--------|
| Page load (LCP) | < 2.5s on 4G |
| API response (non-AI) | < 300ms p95 |
| Search results | < 500ms |
| Background job visibility | Job status updates within 2s of state change |

### 21.2 Security

- All API endpoints require authentication (except auth endpoints).
- API keys encrypted at rest with AES-256.
- HTTPS enforced everywhere.
- Input validation with Zod on all endpoints.
- Rate limiting on AI endpoints to prevent abuse.
- CSRF protection via Better Auth.
- Content Security Policy headers.
- No sensitive data in client-side logs.

### 21.3 Reliability

- Background jobs retry up to 3× with exponential backoff.
- Database transactions for all multi-step operations.
- Graceful degradation: if AI generation fails, user sees a clear error with retry option.
- Source ingestion failures surface actionable error messages.

### 21.4 Scalability

- Stateless backend — horizontal scaling ready.
- Background job workers can be scaled independently.
- PostgreSQL connection pooling (e.g., PgBouncer).

### 21.5 Accessibility

- Minimum WCAG 2.1 AA compliance for core flows.
- Keyboard navigable throughout.
- Screen reader support for key UI elements.
- Sufficient color contrast in both light and dark modes.

---

## 22. Out of Scope (Post-MVP)

The following features are explicitly deferred to post-MVP iterations:

| Feature | Notes |
|---------|-------|
| PWA / installable app | Not a priority for MVP |
| Native mobile apps (iOS/Android) | Web only for MVP |
| Collaboration / sharing | No multi-user features in MVP |
| Short answer, fill-in-the-blank, matching quiz types | Multiple choice only in MVP |
| FSRS parameter optimization | Default params only; personalized optimization later |
| RAG for large notebooks | Full context injection for MVP; RAG as scale solution |
| Chat PDF citations with page numbers | Good-to-have, post-MVP polish |
| Audio transcript sync (karaoke-style) | Post-MVP Audio Overview enhancement |
| Mind Map node editing | Read-only + export in MVP |
| Report PDF export | Post-MVP |
| Email notifications | In-app only for MVP |
| FSRS daily reminder notifications | Post-MVP |
| Infographic in-app editing | Regeneration only in MVP |
| Social login beyond Google + GitHub | Post-MVP if demand exists |
| API for third-party integrations | Post-MVP |
| Mobile app (iOS/Android) | Post-web-MVP |

---

*End of PRD — Version 1.0.0 MVP*
