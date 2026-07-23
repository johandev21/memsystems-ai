# Plan: Refactor Next.js App to React + Vite (TanStack Router & TanStack Query)

This plan details the complete refactoring strategy to convert the Next.js App Router frontend (`frontend/`) into a client-side React 19 SPA powered by **Vite**, **TanStack Router**, **TanStack Query**, and **shadcn/ui** (`vite-frontend/`).

---

## 1. Overview & Architecture

### Stack Specification
- **Framework**: React 19 + Vite 8 (`^8.1.1`)
- **Routing**: TanStack Router (`@tanstack/react-router`) with file-based routing (`src/routes/`)
- **Data Fetching & Caching**: TanStack Query (`@tanstack/react-query`)
- **UI & Styling**: Tailwind CSS v4 (`@tailwindcss/vite`), `tw-animate-css`, shadcn/ui components (`src/components/ui`)
- **State Management**: Zustand (`zustand`)
- **Authentication**: Better Auth SPA Client (`src/lib/auth/client.ts`)
- **API Proxy**: Vite Dev Server proxy forwarding `/api` to NestJS Backend (`http://localhost:4000/api`)

---

## 2. Route Structure & Mapping

| Original Next.js Route | Refactored TanStack Route | File Location | Purpose |
| :--- | :--- | :--- | :--- |
| `/` | `/` | `src/routes/index.tsx` | Auth guard / redirect to `/home` or `/login` |
| `/login` | `/login` | `src/routes/login.tsx` | Login screen (Google OAuth & Credentials) |
| `/home` | `/home` | `src/routes/home.tsx` | User Dashboard & recent notebooks |
| `/notebooks` | `/notebooks` | `src/routes/notebooks.index.tsx` | Workspace notebook list, search & creation |
| `/notebooks/[notebookId]` | `/notebooks/$notebookId` | `src/routes/notebooks.$notebookId.tsx` | Full 3-pane Notebook Editor |
| `/settings` | `/settings` | `src/routes/settings.index.tsx` | User Profile & Settings |
| `/settings/connection` | `/settings/connection` | `src/routes/settings.connection.tsx` | AI Provider API Keys & Configuration |

---

## 3. Implementation Phasing

### Phase 1: Foundation & Infrastructure Setup
1. **Root Providers (`src/routes/__root.tsx`)**:
   - `QueryClientProvider` from `@tanstack/react-query`
   - `ThemeProvider` for light/dark mode support matching shadcn design tokens
   - `Toaster` from `sonner`
2. **API Client (`src/lib/api-client/`)**:
   - Refactor `factory.ts` to export standard fetchers and `queryOptions` compatible with TanStack Query.
3. **Better Auth SPA Client (`src/lib/auth/client.ts`)**:
   - Initialize `createAuthClient({ baseURL: "/api/auth" })`.

### Phase 2: Feature Module Migration
1. **`features/notebooks`**:
   - Migrate notebook grid, creation dialog, icon picker, and delete confirmation modal.
   - Refactor custom hooks to use `useQuery` / `useMutation` with TanStack Query.
2. **`features/sources`**:
   - Migrate source list, file upload dropzone, presigned S3 upload, web scraper input, and document viewer dialog.
3. **`features/notebook-chat`**:
   - Integrate AI chat streaming (`@ai-sdk/react` `useChat` hook) connecting to `/api/notebooks/:notebookId/chat`.
4. **`features/study-materials`**:
   - Migrate study material tree hierarchy, folder organization, and interactive material viewers:
     - Flashcards viewer & rating interface
     - Quiz viewer & scoring system
     - Mindmap visualizer via `@xyflow/react`
     - Roadmap interactive step tree
     - Brief & Summary markdown renderers
5. **`features/generation`**:
   - Migrate material generation dialogs and task status polling using TanStack Query queries.

### Phase 3: UI Design Parity & Polish
- Ensure 100% component and token alignment between `frontend/src/app/globals.css` and `vite-frontend/src/globals.css`.
- Reuse existing shadcn components in `vite-frontend/src/components/ui/`.
- Validate responsive layouts (collapsible left/right sidebars on notebook workspace).

---

## 4. Verification & Testing

1. **Typechecking**: `pnpm --filter vite-frontend run typecheck`
2. **Production Build**: `pnpm --filter vite-frontend run build`
3. **Automated Unit Tests**: `pnpm --filter vite-frontend run test`
4. **End-to-End Parity Verification**:
   - Sign in flow
   - Notebook creation, edit, delete
   - Source document upload & extraction
   - AI Chat streaming response with source citations
   - Study material generation & interactive flashcard/quiz view
