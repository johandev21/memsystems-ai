# Migration Plan: Elysia + TanStack Start → Next.js + TanStack Query

## Current Architecture Summary

| Layer | Current | Target |
|-------|---------|--------|
| **Frontend** | TanStack Start + TanStack Router + Vite (port 3000) | Next.js App Router (port 3000) |
| **Backend** | Elysia.js + Bun (port 4000) | Next.js Route Handlers |
| **Database** | Drizzle ORM + PostgreSQL | Drizzle ORM + PostgreSQL (unchanged) |
| **Auth** | Better Auth (Google OAuth) | Better Auth (unchanged, reconfigured) |
| **AI** | Vercel AI SDK (streamText) | Vercel AI SDK (unchanged) |
| **Storage** | S3-compatible (R2/MinIO) | S3-compatible (unchanged) |
| **Validation** | TypeBox | Zod |
| **Linting** | Biome (tabs, v2.4.5) | Biome (spaces, v2.2.0, keep current) |
| **Runtime** | Bun | Node.js (Next.js default) |

---

## Target App: `memsystems_app/`

All refactored code goes into `memsystems_app/`. This directory already has:
- **Next.js 16.2.9** with App Router, `src/` directory
- **All ~55 shadcn/ui components** installed (`"rsc": true`, "radix-rhea" style)
- **Tailwind CSS v4** via `@tailwindcss/postcss`
- **Biome** v2.2.0 (space indent, Next.js + React domains)
- **Path alias**: `@/*` → `./src/*`
- **Basic scaffolding**: `layout.tsx`, `page.tsx`, `globals.css`, `utils.ts`, `use-mobile` hook
- **Package manager**: pnpm (pnpm-lock.yaml, pnpm-workspace.yaml)

---

## Phase 1: Install Missing Dependencies

**Goal**: Bring all required libraries into the existing Next.js app.

1. Install core dependencies:
   ```sh
   pnpm add @tanstack/react-query drizzle-orm pg better-auth zod zustand motion
   pnpm add ai @ai-sdk/react @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google @ai-sdk/deepseek
   pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner @paralleldrive/cuid2
   pnpm add @mozilla/readability jsdom mammoth pdf-parse
   pnpm add react-markdown remark-gfm
   pnpm add @fontsource-variable/inter @fontsource-variable/jetbrains-mono @fontsource-variable/merriweather
   pnpm add -D drizzle-kit @types/jsdom
   ```
2. Configure `next.config.ts`:
   - Add `serverExternalPackages` for `pg`, `drizzle-orm`, `@aws-sdk/*`, `jsdom`, `pdf-parse`, `mammoth`
   - Configure image remote patterns for Unsplash
3. Create `.env.local` by copying `backend/app/.env` (same `DATABASE_URL`, `ENCRYPTION_KEY`, Better Auth, AI provider keys, S3 config)

**Deliverable**: `pnpm run dev` builds successfully.

---

## Phase 2: Migrate Database Layer

**Goal**: Move Drizzle schema, connection, and config into the Next.js project.

1. Copy files:
   - `backend/app/src/database/schema.ts` → `src/database/schema.ts`
   - `backend/app/src/auth-schema.ts` → `src/database/auth-schema.ts`
   - `backend/app/src/database/connection.ts` → `src/database/connection.ts`
   - `backend/app/drizzle.config.ts` → `drizzle.config.ts`
2. Update imports in `connection.ts`:
   - `from "../../auth-schema"` → `from "./auth-schema"`
   - `from "./schema"` → `from "./schema"`
3. Verify: `pnpm exec drizzle-kit studio` connects and shows all tables

**Deliverable**: `src/database/` with working Drizzle connection.

---

## Phase 3: Migrate Auth

**Goal**: Reconfigure Better Auth for Next.js (same-origin, no CORS).

1. Create `src/lib/auth.ts`:
   ```ts
   import { betterAuth } from "better-auth";
   import { drizzleAdapter } from "better-auth/adapters/drizzle";
   import { db } from "@/database/connection";

   export const auth = betterAuth({
     database: drizzleAdapter(db, { provider: "pg" }),
     socialProviders: {
       google: {
         clientId: process.env.GOOGLE_CLIENT_ID!,
         clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
       },
     },
     session: {
       expiresIn: 60 * 60 * 24 * 7,
       updateAge: 60 * 60 * 24,
     },
   });
   ```
2. Create auth route handler: `src/app/api/auth/[...all]/route.ts`
   ```ts
   import { auth } from "@/lib/auth";
   import { toNextJsHandler } from "better-auth/next-js";
   export const { GET, POST } = toNextJsHandler(auth);
   ```
3. Create auth client: `src/lib/auth-client.ts`
   ```ts
   import { createAuthClient } from "better-auth/react";
   export const authClient = createAuthClient();
   ```
4. Create server-side session helper: `src/lib/session.ts`
   ```ts
   import { headers } from "next/headers";
   import { auth } from "@/lib/auth";

   export async function getSession() {
     const headersList = await headers();
     return auth.api.getSession({ headers: headersList });
   }
   ```
5. Create auth middleware: `src/middleware.ts` (protect `/home/*`, `/notebooks/*`, `/api/*` except `/api/auth/*`)

**Deliverable**: Google OAuth login working through `/api/auth/*`.

---

## Phase 4: Migrate Backend Services → Route Handlers

**Goal**: Convert all Elysia controllers to Next.js Route Handlers. Services copy as-is.

### 4a. Migrate Infrastructure Layer

| Source | Target |
|--------|--------|
| `backend/app/src/errors.ts` | `src/lib/errors.ts` |
| `backend/app/src/encryption/crypto.ts` | `src/lib/crypto.ts` |
| `backend/app/src/storage/s3.client.ts` | `src/lib/storage/s3-client.ts` |
| `backend/app/src/storage/s3-backend.ts` | `src/lib/storage/s3-backend.ts` |
| `backend/app/src/storage/local-fs.ts` | `src/lib/storage/local-fs.ts` |
| `backend/app/src/lib/logger.ts` | `src/lib/logger.ts` |
| `backend/app/src/lib/correlation-storage.ts` | `src/lib/correlation-storage.ts` |
| `backend/app/src/jobs/hard-purge-trash.ts` | `src/lib/jobs/hard-purge-trash.ts` (convert to Vercel Cron or external) |

### 4b. Migrate Feature Services

All `*.service.ts` files are pure business logic — copy them directly:

| Source | Target |
|--------|--------|
| `features/notebooks/notebook.service.ts` | `src/features/notebooks/notebook.service.ts` |
| `features/sources/source.service.ts` | `src/features/sources/source.service.ts` |
| `features/sources/source-extraction.service.ts` | `src/features/sources/source-extraction.service.ts` |
| `features/sources/web-scraper.service.ts` | `src/features/sources/web-scraper.service.ts` |
| `features/study-materials/study-material.service.ts` | `src/features/study-materials/study-material.service.ts` |
| `features/study-materials/study-material-folder.service.ts` | `src/features/study-materials/study-material-folder.service.ts` |
| `features/study-materials/trash.service.ts` | `src/features/study-materials/trash.service.ts` |
| `features/study-materials/shapes/*` | `src/features/study-materials/shapes/*` |
| `features/srs/*.service.ts` | `src/features/srs/*.service.ts` |
| `features/ai/ai.service.ts` | `src/features/ai/ai.service.ts` |
| `features/ai/provider-key.service.ts` | `src/features/ai/provider-key.service.ts` |
| `features/ai/provider-catalog.ts` | `src/features/ai/provider-catalog.ts` |
| `features/ai/providers/*` | `src/features/ai/providers/*` |
| `features/generation/generation.service.ts` | `src/features/generation/generation.service.ts` |
| `features/generation/prompts/*` | `src/features/generation/prompts/*` |
| `features/notebook-chat/notebook-chat.service.ts` | `src/features/notebook-chat/notebook-chat.service.ts` |

**IMPORTANT**: When copying services, rewrite any `import { t } from "elysia"` / TypeBox references to use Zod.

### 4c. Convert Elysia Controllers → Route Handlers

Each Elysia controller becomes Next.js Route Handlers. Replace TypeBox with Zod.

**Route Handler template**:
```ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { NotebookService } from "@/features/notebooks/notebook.service";
import { z } from "zod";

const service = new NotebookService();

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const notebooks = await service.list(session.user.id);
  return NextResponse.json(notebooks);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = createNotebookSchema.parse(await req.json());
  const notebook = await service.create(session.user.id, body);
  return NextResponse.json(notebook);
}
```

**Full route map** (target: `memsystems_app/src/app/api/...`):

| Elysia Route | Next.js Route Handler |
|---|---|
| `GET /notebooks` | `app/api/notebooks/route.ts` → `GET` |
| `POST /notebooks` | `app/api/notebooks/route.ts` → `POST` |
| `GET /notebooks/:id` | `app/api/notebooks/[id]/route.ts` → `GET` |
| `PATCH /notebooks/:id` | `app/api/notebooks/[id]/route.ts` → `PATCH` |
| `DELETE /notebooks/:id` | `app/api/notebooks/[id]/route.ts` → `DELETE` |
| `POST /notebooks/:id/banner` | `app/api/notebooks/[id]/banner/route.ts` → `POST` |
| `DELETE /notebooks/:id/banner` | `app/api/notebooks/[id]/banner/route.ts` → `DELETE` |
| `GET /notebooks/:id/sources` | `app/api/notebooks/[id]/sources/route.ts` → `GET` |
| `POST /notebooks/:id/sources/text` | `app/api/notebooks/[id]/sources/text/route.ts` → `POST` |
| `POST /notebooks/:id/sources/url` | `app/api/notebooks/[id]/sources/url/route.ts` → `POST` |
| `POST /notebooks/:id/sources/file` | `app/api/notebooks/[id]/sources/file/route.ts` → `POST` |
| `GET /sources/:id` | `app/api/sources/[id]/route.ts` → `GET` |
| `DELETE /sources/:id` | `app/api/sources/[id]/route.ts` → `DELETE` |
| `GET /sources/:id/download` | `app/api/sources/[id]/download/route.ts` → `GET` |
| `GET /notebooks/:id/study-materials` | `app/api/notebooks/[id]/study-materials/route.ts` → `GET` |
| `POST /notebooks/:id/study-materials` | `app/api/notebooks/[id]/study-materials/route.ts` → `POST` |
| `PATCH /study-materials/:id` | `app/api/study-materials/[id]/route.ts` → `PATCH` |
| `DELETE /study-materials/:id` | `app/api/study-materials/[id]/route.ts` → `DELETE` |
| `POST /study-materials/:id/trash` | `app/api/study-materials/[id]/trash/route.ts` → `POST` |
| `POST /study-materials/:id/restore` | `app/api/study-materials/[id]/restore/route.ts` → `POST` |
| `GET /notebooks/:id/trash` | `app/api/notebooks/[id]/trash/route.ts` → `GET` |
| `DELETE /notebooks/:id/trash` | `app/api/notebooks/[id]/trash/route.ts` → `DELETE` |
| `GET /notebooks/:id/folders` | `app/api/notebooks/[id]/folders/route.ts` → `GET` |
| `POST /notebooks/:id/folders` | `app/api/notebooks/[id]/folders/route.ts` → `POST` |
| `PATCH /folders/:id` | `app/api/folders/[id]/route.ts` → `PATCH` |
| `DELETE /folders/:id` | `app/api/folders/[id]/route.ts` → `DELETE` |
| `GET /note-types` | `app/api/note-types/route.ts` → `GET` |
| `POST /note-types` | `app/api/note-types/route.ts` → `POST` |
| `PATCH /note-types/:id` | `app/api/note-types/[id]/route.ts` → `PATCH` |
| `DELETE /note-types/:id` | `app/api/note-types/[id]/route.ts` → `DELETE` |
| `GET /notes` | `app/api/notes/route.ts` → `GET` |
| `POST /notes` | `app/api/notes/route.ts` → `POST` |
| `PATCH /notes/:id` | `app/api/notes/[id]/route.ts` → `PATCH` |
| `DELETE /notes/:id` | `app/api/notes/[id]/route.ts` → `DELETE` |
| `GET /cards` | `app/api/cards/route.ts` → `GET` |
| `POST /cards/:id/review` | `app/api/cards/[id]/review/route.ts` → `POST` |
| `GET /tags` | `app/api/tags/route.ts` → `GET` |
| `POST /tags` | `app/api/tags/route.ts` → `POST` |
| `DELETE /tags/:id` | `app/api/tags/[id]/route.ts` → `DELETE` |
| `POST /promote` | `app/api/promote/route.ts` → `POST` |
| `GET /ai/models` | `app/api/ai/models/route.ts` → `GET` |
| `GET /ai/providers` | `app/api/ai/providers/route.ts` → `GET` |
| `POST /ai/chat` | `app/api/ai/chat/route.ts` → `POST` (streaming) |
| `GET /provider-keys` | `app/api/provider-keys/route.ts` → `GET` |
| `POST /provider-keys` | `app/api/provider-keys/route.ts` → `POST` |
| `DELETE /provider-keys/:id` | `app/api/provider-keys/[id]/route.ts` → `DELETE` |
| `GET /notebooks/:id/chat` | `app/api/notebooks/[id]/chat/route.ts` → `GET` |
| `POST /notebooks/:id/chat` | `app/api/notebooks/[id]/chat/route.ts` → `POST` (streaming) |
| `POST /notebooks/:id/generate` | `app/api/notebooks/[id]/generate/route.ts` → `POST` (streaming) |
| `POST /notebooks/:id/generation-requests/:requestId/cancel` | `app/api/notebooks/[id]/generation-requests/[requestId]/cancel/route.ts` → `POST` |

### 4d. Streaming Endpoints

AI chat streaming:
```ts
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const result = await aiService.generateStream(body.provider, body.model, body.messages);
  return result.toUIMessageStreamResponse(); // Vercel AI SDK handles this natively
}
```

Generation ndjson stream:
```ts
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { stream, requestId } = await generationService.generate(session.user.id, params.id, body);
  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson", "X-Request-Id": requestId },
  });
}
```

**Deliverable**: All API routes working, testable via curl.

---

## Phase 5: Migrate Frontend Pages → Next.js App Router

**Goal**: Convert TanStack Router routes to Next.js App Router pages.

### 5a. Route Mapping

| TanStack Route | Next.js Page |
|---|---|
| `routes/__root.tsx` | `src/app/layout.tsx` (root layout, already exists) |
| `routes/index.tsx` (landing) | `src/app/page.tsx` (already exists, overwrite) |
| `routes/login.tsx` | `src/app/login/page.tsx` |
| `routes/home/index.tsx` | `src/app/home/page.tsx` |
| `routes/notebooks/$notebookId.tsx` | `src/app/notebooks/[notebookId]/page.tsx` |

### 5b. Update Root Layout (`src/app/layout.tsx`)

Current layout has Geist/Geist Mono fonts and JetBrains Mono. Update to include:
- ThemeProvider wrapper (from old `__root.tsx`)
- TanStack Query's `QueryClientProvider` (via a `Providers` client component)
- Custom CSS variables from old frontend (`--panel-bg`, `--panel-header-bg`, etc.)
- Proper metadata (title: "memsystems")
- Import `globals.css` (already done)

```tsx
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "@/components/providers"; // QueryClientProvider wrapper
import "./globals.css";

export const metadata: Metadata = { title: "memsystems" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 5c. Migrate Components & Features

Copy from `frontend/src/components/` and `frontend/src/features/` to `memsessions_app/src/`.

**IMPORTANT import rewrites** — old frontend used `#/*` alias, new app uses `@/*`:
- `#/components/ui/...` → `@/components/ui/...`
- `#/lib/...` → `@/lib/...`
- `#/hooks/...` → `@/hooks/...`
- `#/features/...` → `@/features/...`

**`"use client"` directive**: Add to all interactive components (hooks, event handlers, browser APIs). shadcn components already have it since `"rsc": true` is set.

**CSS**: The old `notebook.css` and `styles.css` need their custom variables merged into `globals.css`:
- Add `--panel-bg`, `--panel-header-bg`, `--gradient-text` etc. to `:root` / `.dark` blocks
- Copy gradient styles from old `styles.css`

**Theme provider**: Copy `frontend/src/components/theme-provider.tsx`. It already exists conceptually but needs to be moved.

**shadcn components**: Both apps have identical shadcn UI sets (accordion through tooltip). Keep the `memsystems_app` versions — they're already configured for RSC. Do NOT overwrite them with old frontend copies.

### 5d. Migrate Hooks

Copy `frontend/src/hooks/` and `frontend/src/features/notebook/hooks/` — rewrite `#/` → `@/` imports.

### 5e. Page Components

**Landing** (`src/app/page.tsx`): Server component, redirect if authenticated.
```tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/home");
  // ... JSX from old routes/index.tsx, rewrite #/ → @/
}
```

**Login** (`src/app/login/page.tsx`): Client component with Google OAuth button.

**Home** (`src/app/home/page.tsx`): Server component fetching notebooks directly via service, then client components for interactivity.

**Notebook** (`src/app/notebooks/[notebookId]/page.tsx`): Server + client components.

**Deliverable**: All pages rendering with existing components, imports rewritten.

---

## Phase 6: Migrate Data Fetching

**Goal**: Replace `createServerFn` with direct service calls (server components) + TanStack Query (client components).

**Old pattern (TanStack Start server functions)** — remove all:
```ts
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
```

**New pattern – Server Components**: Call services directly:
```ts
// src/app/home/page.tsx
import { NotebookService } from "@/features/notebooks/notebook.service";
const notebooks = await new NotebookService().list(session.user.id);
```

**New pattern – Client Components**: TanStack Query calling `/api/*`:
```ts
// src/lib/notebooks.ts
import { queryOptions } from "@tanstack/react-query";

export const notebooksQueryOptions = queryOptions({
  queryKey: ["notebooks"],
  queryFn: async () => {
    const res = await fetch("/api/notebooks");
    if (!res.ok) throw new Error("Failed to fetch notebooks");
    return res.json() as Notebook[];
  },
  staleTime: 30_000,
});
```

**Mutations**:
```ts
export function useCreateNotebook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string }) => {
      const res = await fetch("/api/notebooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create notebook");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notebooks"] }),
  });
}
```

**Files to rewrite** (move from old `frontend/src/lib/` to `memsystems_app/src/lib/`):
- `notebooks.ts` — remove `createServerFn`, replace with query options + mutations
- `models.ts` — change `BASE_URL` from `http://localhost:4000` to relative `/api/...`
- `session.ts` — delete entirely; replace with server-side `getSession()` from `@/lib/session`
- `query-client.ts` — copy as-is (create TanStack Query client)
- `auth-client.ts` — copy, remove `baseURL` (same-origin now)

**Deliverable**: All data fetching working via TanStack Query + direct service calls.

---

## Phase 7: Auth Middleware

**Goal**: Route protection via Next.js `src/middleware.ts`.

```ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionToken = req.cookies.get("better-auth.session_token");

  // Public routes
  if (pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Protected routes
  if (!sessionToken) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}
```

Match config in `middleware.ts`:
```ts
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

**Deliverable**: Unauthenticated users redirected to `/login`.

---

## Phase 8: Cleanup & Finalization

1. **Delete old directories**: `frontend/`, `backend/` (after verifying everything works)
2. **Update root `AGENTS.md`**: Rewrite for Next.js conventions (app directory, `@/*` alias, pnpm)
3. **Update `CONTEXT.md`**: No changes needed (domain model is unchanged)
4. **Cron job**: Convert `hard-purge-trash` to Vercel Cron (`vercel.json`) or external scheduler
5. **Environment variables**: Already consolidated in `.env.local`
6. **Testing**: Set up Vitest with `@testing-library/react`
7. **CI/CD**: Update to `pnpm run build` (Next.js build)
8. **Deployment**: Configure for Vercel

---

## Key Migration Notes for the Agent

1. **Import alias**: Old frontend uses `#/`, new app uses `@/` — ALL old imports need rewriting
2. **shadcn style**: Old frontend used "radix-nova", new app has "radix-rhea" — keep new app's components, don't overwrite
3. **Biome config**: Old frontend uses tabs, new app uses spaces (2) — code style follows the new Biome config
4. **Package manager**: Old frontend/backend use Bun, new app uses **pnpm** (run `pnpm add`, `pnpm run dev`)
5. **TypeScript**: Old backend uses v6, new app uses v5 — may need `@ts-expect-error` or type tweaks in copied services
6. **Dependencies to remove from old package.json**: `@tanstack/react-start`, `@tanstack/react-router`, `@tanstack/react-router-*`, `@tanstack/router-plugin`, `@vitejs/plugin-react`, `vite`, `vitest`, `@tanstack/devtools-vite`, `nitro` — all TanStack Start/Vite/SSR plumbing goes away
7. **Drizzle config**: Update `schema` paths in `drizzle.config.ts` after copying

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Streaming AI responses break | Vercel AI SDK works natively with Next.js Route Handlers |
| shadcn/ui RSC incompatibility | Already configured with `"rsc": true` |
| Import alias (#/ → @/) missed | Search for `from "#/"` across all copied files |
| Biome formatter changes diff | Run `pnpm run format` on all migrated files |
| Bun-specific APIs in services | Audit for `Bun.*` before copying; replace with Node.js equivalents |
| Auth cookie name unknown | Check Better Auth cookie config after setup |
| TypeBox → Zod in copied services | Some service files may reference `@sinclair/typebox` or `drizzle-typebox`; remove those |

---

## Suggested Execution Order

1. **Phase 1** (deps) → **Phase 2** (database) → **Phase 3** (auth) — prerequisites
2. **Phase 4** (backend migration) — feature-by-feature: notebooks → sources → study-materials → srs → ai → generation → notebook-chat
3. **Phase 5** (frontend pages) + **Phase 6** (data fetching) — do together, page-by-page
4. **Phase 7** (middleware)
5. **Phase 8** (cleanup)
