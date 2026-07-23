# FSD v2.1 Conventions

This document records the conventions adopted during the FSD refactor of `frontend/`.

## Layer Structure

```
src/
  app/          # App-wide providers (QueryClient, ThemeProvider, Toaster)
  pages/        # Route-level page components (home, notebooks, settings, login)
  widgets/      # Composition widgets that combine multiple features (notebook-workspace)
  features/     # Business features (ai, notebook-chat, notebooks, sources, study-materials)
  entities/     # Shared domain types (notebook, source, folder, study-material, model)
  shared/       # UI kit, utilities, API client, auth
    ui/         # Generic UI components (shadcn, layout, branding)
    lib/        # Utility functions (cn, fetchApi)
    api/        # API client with query options
    auth/       # Auth client (better-auth)
```

## Import Rules

1. **Layers may only import from layers below them** (app → pages → widgets → features → entities → shared)
2. **All cross-feature imports must go through the feature's barrel** (`index.ts`)
3. **Avoid deep imports into a feature's internal structure**
4. **The shared layer needs no barrel for its top-level modules** — imports from `@/shared/ui`, `@/shared/lib`, etc. are allowed

## Barrel Files

Every feature/entity/widget must have an `index.ts` barrel at its root that defines the public API:

```ts
// Example: features/notebooks/index.ts
export * from "./components/dialogs/notebook-settings-dialog";
export * from "./hooks/use-model-persistence";
```

Pages always export their component function through a barrel. Route configuration stays in `routes/`.

## Code Organization

- **Features** are sliced by domain, not by technical concern. Each feature has `components/`, `hooks/`, and optionally sub-directories.
- **Entities** are pure type definitions (interfaces, type unions) with no logic. Business logic stays in features.
- **Widgets** compose features. They import from features and shared, never the reverse.

## Path Aliases

| Alias | Target |
|-------|--------|
| `@/*` | `./src/*` |
| `@/app/*` | `./src/app/*` |
| `@/pages/*` | `./src/pages/*` |
| `@/widgets/*` | `./src/widgets/*` |
| `@/features/*` | `./src/features/*` |
| `@/entities/*` | `./src/entities/*` |
| `@/shared/*` | `./src/shared/*` |

## Validation

Run `steiger src` from the frontend directory to validate FSD compliance.
