# Product Requirements Document (PRD)
## SRS Flashcards Feature — Implementation Guide
**Version:** 1.0.0
**Status:** Draft
**Parent:** [PRD-memsystems.md](./PRD-memsystems.md) — Section 14.1 & Section 15
**Last Updated:** 2026-05-07

---

## Table of Contents

1. [Overview](#1-overview)
2. [Flashcard Types](#2-flashcard-types)
3. [AI Flashcard Generation](#3-ai-flashcard-generation)
4. [Manual Flashcard Creation](#4-manual-flashcard-creation)
5. [Study Session UI](#5-study-session-ui)
6. [FSRS Long-Term Memory System](#6-fsrs-long-term-memory-system)
7. [Deck Management](#7-deck-management)
8. [Data Model](#7-data-model)
9. [Backend API](#8-backend-api)
10. [Component Inventory](#9-component-inventory)
11. [Implementation Steps](#10-implementation-steps)

---

## 1. Overview

### 1.1 Purpose

The SRS Flashcards feature enables users to create, study, and review flashcards using both AI-powered generation and manual creation. The system supports two modes:

1. **Quick Flashcards** — Rapid review without spaced repetition (NotebookLM-style)
2. **Long-Term Flashcards (FSRS)** — Durable memory consolidation using the FSRS algorithm

### 1.2 User Flows

```
User Flow 1: AI Generation
Source Upload → Source Ready → Generate Flashcards (AI) → Edit Cards → Study Session

User Flow 2: Manual Creation
Create Flashcard File → Add Cards Manually → Study Session

User Flow 3: Promote to FSRS
Quick Flashcard Session → Toggle "Save to LTM" → Card Added to FSRS Deck → Review Dashboard
```

---

## 2. Flashcard Types

### 2.1 Quick Flashcards

| Property | Value |
|----------|-------|
| Algorithm | None (immediate review) |
| Persistence | Session-only state |
| Promotion | Can promote individual cards to FSRS |
| Target User | Quick, one-off study sessions |

### 2.2 Long-Term Flashcards (FSRS)

| Property | Value |
|----------|-------|
| Algorithm | FSRS v4/v5 |
| Storage | Persistent per-user deck |
| Review | Scheduled via spaced repetition |
| Promotion | Auto-created or manually moved |

---

## 3. AI Flashcard Generation

### 3.1 Generation Options

| Option | Type | Default | Notes |
|--------|------|---------|-------|
| Number of cards | integer | 10 | Range: 5–50 |
| Difficulty | enum | medium | beginner / intermediate / advanced |
| Focus area | enum | key_concepts | key_terms / concepts / formulas / custom |
| Language | string | user preference | Inherits or overrideable |
| Source selection | array | all ready sources | Multi-select enabled |

### 3.2 Generation Prompt Architecture

```
System Prompt:
"You are an expert flashcard creator. Create clear, accurate flashcards..."

Task Prompt:
"Based on the following source material, create {n} flashcards about {focus_area}..."

Source Context:
[Injected extracted text from selected sources]

Output Format:
{
  "cards": [
    { "front": "...", "back": "..." },
    ...
  ]
}
```

### 3.3 Generation Flow

```
1. User selects source(s) from notebook
2. User configures generation options
3. User clicks "Generate Flashcards"
4. Backend creates job: file.generate.flashcards
5. Background worker:
   a. Retrieves source text
   b. Constructs prompt with options
   c. Calls AI via Vercel AI SDK
   d. Parses JSON response
   e. Stores cards in database
6. User notified on completion
7. Flashcard file opened in viewer
```

---

## 4. Manual Flashcard Creation

### 4.1 Card Editor

| Feature | Description |
|---------|-------------|
| Add card | Inline form: front + back text areas |
| Edit card | Click to edit any field |
| Delete card | Trash icon with confirmation |
| Reorder | Drag-and-drop or arrow buttons |
| Bulk import | CSV upload (front, back columns) |

### 4.2 Card Structure

```
front: string (required) — question, term, or prompt
back: string (required) — answer, definition, or response
order_index: integer — position in deck
created_at: timestamp
updated_at: timestamp
```

### 4.3 CSV Import Format

```csv
front,back
"What is photosynthesis?","The process by which plants convert sunlight into energy"
"What is mitosis?","Cell division resulting in two identical daughter cells"
```

---

## 5. Study Session UI

### 5.1 Quick Flashcard Session

```
┌────────────────────────────────────────────┐
│  Quick Review — Biology Ch. 1          [X]  │
├────────────────────────────────────────────┤
│                                            │
│  ┌──────────────────────────────────────┐  │
│  │                                      │  │
│  │     What is the powerhouse of       │  │
│  │         the cell?                    │  │
│  │                                      │  │
│  └──────────────────────────────────────┘  │
│                                            │
│           [ Flip Card ]                   │
│                                            │
├────────────────────────────────────────────┤
│  Card 3 of 15          🔀 Shuffle   ↔️    │
└────────────────────────────────────────────┘
```

### 5.2 Card Flip Animation

- CSS 3D transform: `rotateY(180deg)`
- Duration: 300ms ease-in-out
- Back face hidden until flip triggered

### 5.3 Quick Review Controls

| Control | Icon | Action |
|---------|------|--------|
| Flip | — | Reveal answer |
| Previous | ChevronLeft | Previous card |
| Next | ChevronRight | Next card |
| Shuffle | 🔀 | Randomize order |
| Save to LTM | ★ | Promote to FSRS deck |

### 5.4 Save to LTM Toggle

- Persistent toggle per card (saved to database)
- Toggle state persists across sessions
- Visual indicator: filled star when active
- Reversible: toggle off to remove from FSRS

### 5.5 Session Summary

After completing a session:

```
┌────────────────────────────────────────────┐
│           Session Complete! 🎉             │
├────────────────────────────────────────────┤
│                                            │
│  Cards reviewed: 15                        │
│  Saved to LTM: 8                          │
│                                            │
│  [ Review Saved Cards ]                    │
│  [ Back to Notebooks ]                    │
│                                            │
└────────────────────────────────────────────┘
```

---

## 6. FSRS Long-Term Memory System

### 6.1 FSRS Algorithm

Implement **FSRS v4** or **v5** (latest stable).

Reference: [FSRS GitHub](https://github.com/open-spaced-repetition/fsrs/)

### 6.2 FSRS Parameters

Default parameters (stored per user):

```
w: [1, 1, 5, -0.5, -1, -1, 0, 0.2, 0.2, 0.75, 0.75, -0.5, -0.5, 0.2, 0, 0.3, 0.1, 0.1, 0, 0.1]
```

Customizable per user in post-MVP.

### 6.3 Card States

| State | Description |
|-------|-------------|
| New | Never reviewed |
| Learning | Currently in learning phase |
| Review | In spaced repetition cycle |
| Relearning | Previously lapsed, re-learning |

### 6.4 Rating Buttons

After revealing the answer:

| Rating | Label | Action |
|--------|-------|--------|
| Again | Again (0) | Reset to learning, decrease stability |
| Hard | Hard (1) | Decrease ease factor slightly |
| Good | Good (2) | Maintain current difficulty |
| Easy | Easy (3) | Increase stability, increase ease |

### 6.5 Review Dashboard

Accessible via "Review" nav item with due card badge.

**Dashboard displays:**
- Total due today (across all decks)
- Per-deck due counts
- 7-day forecast chart
- Current streak
- Average retention %

### 6.6 Review Session Flow

```
Session Start → Load due cards for selected deck(s)
    │
    ▼
Display card front
    │
    ▼ (user flips)
Display card back
    │
    ▼
User rates: [Again] [Hard] [Good] [Easy]
    │
    ▼
FSRS calculates next interval + updates fsrs_* fields
    │
    ▼
Next card → repeat until queue empty
    │
    ▼
Session Summary → update streak, retention stats
```

---

## 7. Deck Management

### 7.1 Auto-Created Decks

- One deck per notebook, created when first card is promoted
- Deck name: `[Notebook Title]`
- Cannot be deleted (only cards removed)

### 7.2 Custom Decks

- User-created decks with custom names
- Cards can be moved between decks
- Deleting deck returns cards to origin deck or default

### 7.3 Deck Operations

| Operation | Description |
|-----------|-------------|
| Create | Name + optional description |
| Rename | Inline rename |
| Delete | Confirmation dialog |
| Merge | Move all cards to another deck |

### 7.4 Card Movement

- Drag-and-drop between decks in sidebar
- Multi-select + move bulk action
- Visual feedback during drag

---

## 8. Data Model

### 8.1 Quick Flashcards Schema

```
flashcard_files
  id              uuid (PK)
  file_id         uuid (FK → files)
  created_at      timestamp

flashcards
  id              uuid (PK)
  flashcard_file_id uuid (FK → flashcard_files)
  front           text
  back            text
  is_promoted_to_ltm boolean (default false)
  order_index      integer
  created_at       timestamp
  updated_at       timestamp
```

### 8.2 FSRS Schema

```
long_term_decks
  id              uuid (PK)
  user_id         uuid (FK → users)
  name            string
  is_auto_created boolean (default false)
  source_notebook_id uuid (FK → notebooks, nullable)
  created_at      timestamp
  updated_at      timestamp

long_term_flashcards
  id              uuid (PK)
  deck_id         uuid (FK → long_term_decks)
  source_file_id  uuid (FK → files, nullable)
  front           text
  back            text
  fsrs_stability  float
  fsrs_difficulty float
  fsrs_due_date   timestamp
  fsrs_last_review timestamp
  fsrs_reps       integer
  fsrs_lapses     integer
  fsrs_state      enum (new | learning | review | relearning)
  is_active       boolean (default true)
  created_at      timestamp
  updated_at      timestamp
```

---

## 9. Backend API

### 9.1 Flashcard File Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /api/notebooks/:id/files` | POST | Create flashcard file |
| `GET /api/files/:id` | GET | Get flashcard file with cards |
| `PATCH /api/files/:id` | PATCH | Update file metadata |
| `DELETE /api/files/:id` | DELETE | Soft delete file |

### 9.2 Card Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/files/:id/cards` | GET | List all cards in file |
| `POST /api/files/:id/cards` | POST | Add new card |
| `PATCH /api/cards/:id` | PATCH | Update card |
| `DELETE /api/cards/:id` | DELETE | Delete card |
| `POST /api/files/:id/cards/import` | POST | Bulk CSV import |
| `POST /api/cards/:id/promote` | POST | Promote to LTM deck |
| `DELETE /api/cards/:id/promote` | DELETE | Remove from LTM deck |

### 9.3 FSRS Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `GET /api/decks` | GET | List all user decks |
| `POST /api/decks` | POST | Create custom deck |
| `PATCH /api/decks/:id` | PATCH | Rename deck |
| `DELETE /api/decks/:id` | DELETE | Delete deck |
| `GET /api/decks/:id/cards/due` | GET | Get due cards |
| `POST /api/cards/:id/review` | POST | Submit review rating |
| `GET /api/decks/:id/stats` | GET | Deck statistics |

### 9.4 Job Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `POST /api/jobs` | POST | Create generation job |
| `GET /api/jobs/:id` | GET | Get job status |

---

## 10. Component Inventory

### 10.1 Flashcard Components

| Component | File | Purpose |
|-----------|------|---------|
| `FlashcardViewer` | `features/flashcards/components/flashcard-viewer.tsx` | Main flashcard display + flip |
| `FlashcardEditor` | `features/flashcards/components/flashcard-editor.tsx` | Add/edit/delete cards |
| `CardFront` | `features/flashcards/components/card-front.tsx` | Front face display |
| `CardBack` | `features/flashcards/components/card-back.tsx` | Back face display |
| `FlashcardSession` | `features/flashcards/components/flashcard-session.tsx` | Quick review session |
| `SessionSummary` | `features/flashcards/components/session-summary.tsx` | Post-session stats |
| `PromoteToLTMButton` | `features/flashcards/components/promote-button.tsx` | Star toggle button |
| `CSVImporter` | `features/flashcards/components/csv-importer.tsx` | Bulk import modal |

### 10.2 FSRS Components

| Component | File | Purpose |
|-----------|------|---------|
| `ReviewDashboard` | `features/fsrs/components/review-dashboard.tsx` | Global review hub |
| `DeckList` | `features/fsrs/components/deck-list.tsx` | List of all decks |
| `DeckCard` | `features/fsrs/components/deck-card.tsx` | Individual deck summary |
| `ReviewSession` | `features/fsrs/components/review-session.tsx` | FSRS review flow |
| `RatingButtons` | `features/fsrs/components/rating-buttons.tsx` | Again/Hard/Good/Easy |
| `FSRSCard` | `features/fsrs/components/fsrs-card.tsx` | FSRS flashcard display |
| `StatsOverview` | `features/fsrs/components/stats-overview.tsx` | Streak, retention, forecast |

### 10.3 Shared Components

| Component | File | Purpose |
|-----------|------|---------|
| `FlipAnimation` | `components/ui/flip-animation.tsx` | Reusable 3D flip |
| `StarRating` | `components/ui/star-rating.tsx` | Favorite/promote toggle |
| `ProgressBar` | `components/ui/progress-bar.tsx` | Session progress |
| `BadgeCount` | `components/ui/badge.tsx` | Due card count badge |

---

## 11. Implementation Steps

### Step 1: Database Schema
- [ ] Create `flashcard_files` table
- [ ] Create `flashcards` table
- [ ] Create `long_term_decks` table
- [ ] Create `long_term_flashcards` table
- [ ] Run migrations

### Step 2: Flashcard File API
- [ ] POST `/api/notebooks/:id/files` — create flashcard file
- [ ] GET `/api/files/:id` — fetch file with cards
- [ ] Card CRUD endpoints

### Step 3: Card Editor UI
- [ ] `FlashcardEditor` component
- [ ] Add/edit/delete card forms
- [ ] Drag-and-drop reordering
- [ ] CSV import modal

### Step 4: Flashcard Viewer
- [ ] `FlashcardViewer` with flip animation
- [ ] Navigation (prev/next/shuffle)
- [ ] `PromoteToLTMButton` toggle
- [ ] Session summary screen

### Step 5: AI Generation
- [ ] Prompt template for flashcard generation
- [ ] `file.generate.flashcards` job handler
- [ ] Source text injection
- [ ] JSON parsing + card creation

### Step 6: FSRS Algorithm
- [ ] FSRS TypeScript implementation
- [ ] Default parameters setup
- [ ] Next interval calculation
- [ ] Review rating handler

### Step 7: FSRS Review UI
- [ ] `ReviewDashboard` page
- [ ] `DeckList` with due counts
- [ ] `ReviewSession` with rating buttons
- [ ] Stats display (streak, retention, forecast)

### Step 8: Deck Management
- [ ] Create/rename/delete custom decks
- [ ] Drag cards between decks
- [ ] Auto-create deck per notebook

### Step 9: Integration
- [ ] Connect promote toggle to LTM deck
- [ ] Job notifications on generation complete
- [ ] Link cards to source files

### Step 10: Polish
- [ ] Empty states
- [ ] Loading skeletons
- [ ] Error handling + retry
- [ ] Responsive mobile layout

---

## Appendix A: FSRS State Machine

```
New Card
  │
  ▼
Learning Phase (1–3 cards)
  │
  ├── Again → Learning (repeat)
  ├── Good → Review
  └── Easy → Review (interval × 1.3)
  │
  ▼
Review Phase (spaced repetition)
  │
  ├── Again → Relearning
  ├── Hard → Review (interval × 0.8)
  ├── Good → Review (interval × ease)
  └── Easy → Review (interval × ease × 1.3)
  │
  ▼
Relearning Phase
  │
  └── Good → Review
```

---

## Appendix B: Review Forecasting

```
7-day forecast formula:
day[n] = cards where fsrs_due_date BETWEEN today AND today + n days
```

Display as bar chart:
```
Due Cards
20 │        ┌─┐
15 │        │ │     ┌─┐
10 │   ┌─┐  │ │     │ │
 5 │   │ │  │ │  ┌─┐│ │
 0 └───┴─┴──┴─┴──┴─┴─┴──
    Mon Tue Wed Thu Fri Sat Sun
```

---

*End of Flashcards PRD — Version 1.0.0*
