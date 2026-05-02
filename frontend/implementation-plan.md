# Notebook Detail Page — Implementation Plan

## Project Structure

All notebook-related code lives under `src/features/notebook/`:

```
src/features/notebook/
├── types.ts                    # Domain types (FileNode, FileType, etc.)
├── hooks/
│   └── use-file-tree.ts        # Tree transformation hook
├── utils/
│   └── file-type-icons.ts      # Icon mapping utility
└── components/
    ├── notebook-header.tsx     # Hero image + title + AI Study CTA
    ├── notebook-stats.tsx      # Items / Modified / Size bar
    ├── file-tree.tsx           # Hierarchical file list container
    ├── file-tree-row.tsx       # Individual row (file or folder)
    ├── source-status-badge.tsx # Source ingestion state badge
    ├── file-actions-menu.tsx   # Context menu + dropdown fallback
    ├── inline-rename.tsx       # Inline filename editor
    ├── delete-dialog.tsx       # Delete confirmation dialog
    ├── notebook-empty-state.tsx# Empty notebook placeholder
    └── notebook-breadcrumb.tsx # Back navigation link
```

---

## Phase 1: Data Structure & Type Foundation

### Step 1.1 — Define File System Types
**Objective:** Create TypeScript types that match the PRD file hierarchy.

**Key additions:**
- [x] `FileType` enum (`source`, `flashcards`, `quiz`, `roadmap`, `audio-overview`, `report`, `infographic`, `mind-map`, `slide-deck`)
- [x] `FileNode` interface with `id`, `name`, `type`, `fileType`, `status`, `modified`, `size`, `isFolder`, `children?`, `parentId?`, `depth`
- [x] `NotebookData` interface extending current mock data with `sources` array and `files` tree

**Relevant files:**
- `src/features/notebook/types.ts`

**Constraints:**
- `Sources/` folder is always present and non-deletable
- Subfolders can nest up to tier limit (enforced later by API)
- `depth` field used for indentation calculation only

---

## Phase 2: File List Restructure (Hierarchical)

### Step 2.1 — Build Tree Data Hook
**Objective:** Transform flat file array into hierarchical tree with `Sources/` as root sibling.

**Key additions:**
- [ ] `useFileTree(files: FileItem[])` hook that returns nested tree structure
- [ ] `Sources/` folder injected automatically if not present in data
- [ ] Files with `parentId` placed under correct subfolder

**Relevant files:**
- `src/features/notebook/hooks/use-file-tree.ts`

**Constraints:**
- Must handle orphaned files (parentId not found) → place at root level
- Must preserve sort order within each folder level

---

### Step 2.2 — File Tree Row Component
**Objective:** Render individual file/folder rows with OS-like indentation.

**Key additions:**
- [ ] `FileTreeRow` component accepting `node: FileNode`
- [ ] Indentation via `pl-{depth * 4}` (Tailwind) based on node depth
- [ ] Folder rows use `Folder` icon, file rows use type-specific icon
- [ ] Click folder row to toggle expand/collapse (local state per row)
- [ ] Chevron indicator on folder rows (`ChevronRight` / `ChevronDown`)

**Relevant files:**
- `src/features/notebook/components/file-tree-row.tsx`

**Constraints:**
- Expand/collapse state is local UI state only (not persisted)
- Folders with no children still show as collapsed by default
- Row height consistent with current file list (py-3)

---

### Step 2.3 — File Type Icon Map
**Objective:** Map each file type to a distinct Lucide icon.

**Key additions:**
- [ ] `getFileTypeIcon(fileType: FileType)` utility function
- [ ] Icon mapping:
  - `source` → `FileText`
  - `flashcards` → `Layers`
  - `quiz` → `CircleHelp`
  - `roadmap` → `Map`
  - `audio-overview` → `Headphones`
  - `report` → `FileBarChart`
  - `infographic` → `Image`
  - `mind-map` → `Network`
  - `slide-deck` → `Presentation`

**Relevant files:**
- `src/features/notebook/utils/file-type-icons.ts`

**Constraints:**
- All icons from `lucide-react`
- Fallback to `FileText` for unknown types
- Icons rendered at `size-5`

---

### Step 2.4 — Replace FileList with FileTree
**Objective:** Swap current flat list for hierarchical tree view.

**Key UI changes:**
- [ ] `FileList` component renamed to `FileTree` (or new component)
- [ ] Render header row (Name / Type / Modified / Size) remains
- [ ] Body renders recursive tree via `FileTreeRow`
- [ ] Sources folder rendered first, then subfolders, then root files

**Relevant files:**
- `src/features/notebook/components/file-tree.tsx` (replaces file-list.tsx)
- `src/routes/notebooks/$notebookId.tsx` (update import)

**Constraints:**
- `Sources/` folder name is untranslated for now (i18n later)
- Table column widths preserved from current design

---

## Phase 3: Source Status Badges

### Step 3.1 — Status Badge Component
**Objective:** Show ingestion state on source files only.

**Key additions:**
- [ ] `SourceStatusBadge` component
- [ ] Status variants:
  - `pending` → yellow dot + "Pending"
  - `processing` → spinner + "Processing" (use `Loader2` with `animate-spin`)
  - `ready` → green dot + "Ready"
  - `error` → red dot + "Error"
- [ ] Only renders for `fileType === 'source'`

**Relevant files:**
- `src/features/notebook/components/source-status-badge.tsx`

**Constraints:**
- Badge replaces the `Type` column value for source files only
- Other file types show their normal type string
- Badges use shadcn `Badge` component with custom colors

---

### Step 3.2 — Update Mock Data with Status
**Objective:** Add realistic status values to source files in mock data.

**Key additions:**
- [ ] Add `status` field to source file objects
- [ ] Mix of statuses across mock sources for visual testing

**Relevant files:**
- `src/routes/notebooks/$notebookId.tsx`

---

## Phase 4: File Actions (Context Menu)

### Step 4.1 — Context Menu Component
**Objective:** Right-click or ⋮ menu for file/folder operations.

**Key additions:**
- [ ] Wrap each `FileTreeRow` in shadcn `ContextMenu`
- [ ] Menu items:
  - `Rename` → triggers inline rename mode
  - `Delete` → opens confirmation dialog
  - `Download` → only shown for applicable file types (audio-overview, infographic, slide-deck)
  - Divider before Download
- [ ] Mobile fallback: `⋮` icon button at row end that opens same menu via `DropdownMenu`

**Relevant files:**
- `src/features/notebook/components/file-actions-menu.tsx`
- `src/components/ui/context-menu.tsx` (existing shadcn)
- `src/components/ui/dropdown-menu.tsx` (existing shadcn)

**Constraints:**
- `Sources/` folder: Delete disabled (non-deletable per PRD)
- Folders: Download disabled
- Download item hidden (not disabled) for non-downloadable types

---

### Step 4.2 — Inline Rename
**Objective:** Edit filename directly in the list.

**Key additions:**
- [ ] `InlineRename` component (input field replacing row text)
- [ ] Triggered by "Rename" context menu action
- [ ] Enter to confirm, Escape to cancel, blur to confirm
- [ ] Input auto-focused and pre-filled with current name

**Relevant files:**
- `src/features/notebook/components/inline-rename.tsx`

**Constraints:**
- No API call in this phase (console.log or no-op)
- Validation: non-empty, max 100 chars

---

### Step 4.3 — Delete Confirmation Dialog
**Objective:** Confirm before deleting files or folders.

**Key additions:**
- [ ] shadcn `AlertDialog` triggered by "Delete" action
- [ ] Title: "Delete [name]?"
- [ ] Description: "This will move the file to trash. You can restore it within 7 days."
- [ ] Actions: Cancel / Delete (destructive variant)
- [ ] Folder deletion warns: "This will delete all contents inside this folder."

**Relevant files:**
- `src/features/notebook/components/delete-dialog.tsx`
- `src/components/ui/alert-dialog.tsx` (existing shadcn)

**Constraints:**
- No actual deletion in this phase (console.log or no-op)
- `Sources/` folder never shows Delete option

---

## Phase 5: Empty States

### Step 5.1 — Notebook Empty State
**Objective:** Friendly empty state when notebook has no sources or files.

**Key additions:**
- [ ] `NotebookEmptyState` component
- [ ] Condition: `sources.length === 0 && files.length === 0`
- [ ] Content:
  - Illustration/icon (e.g., `FolderOpen` or `BookOpen`)
  - Title: "This notebook is empty"
  - Description: "Add sources to get started. You can upload PDFs, paste URLs, or import YouTube videos."
  - CTA button: "Add Source" (primary, but no-op for now)

**Relevant files:**
- `src/features/notebook/components/notebook-empty-state.tsx`
- `src/routes/notebooks/$notebookId.tsx`

**Constraints:**
- No-op CTA (functionality comes later in Source Ingestion phase)
- Rendered inside the file tree container, below stats bar

---

## Phase 6: Navigation & Polish

### Step 6.1 — Breadcrumb Navigation
**Objective:** Add back link to notebooks dashboard.

**Key additions:**
- [ ] `NotebookBreadcrumb` component
- [ ] Content: `← Notebooks` (or breadcrumb style)
- [ ] Links to `/home` (or notebooks list route)
- [ ] Positioned below `AppHeader`, above notebook content

**Relevant files:**
- `src/features/notebook/components/notebook-breadcrumb.tsx`
- `src/routes/notebooks/$notebookId.tsx`

**Constraints:**
- Uses TanStack `Link` component for SPA navigation
- Text-muted style, hover:text-foreground

---

### Step 6.2 — Folder Item Count
**Objective:** Show number of items inside folders.

**Key additions:**
- [ ] Display count next to folder name: `Sources (3)`
- [ ] Count based on immediate children only (not recursive)

**Relevant files:**
- `src/features/notebook/components/file-tree-row.tsx`

**Constraints:**
- Count format: `{name} ({count})`
- Count excludes the folder itself

---

### Step 6.3 — File Preview Navigation
**Objective:** Click non-folder files to view their content.

**Key additions:**
- [ ] Click on file row navigates to `/notebooks/$notebookId/files/$fileId`
- [ ] Route: `src/routes/notebooks/$notebookId.files.$fileId.tsx`
- [ ] Preview page: basic shell with file name, type badge, and placeholder content area
- [ ] "Back to notebook" link

**Relevant files:**
- `src/routes/notebooks/$notebookId.files.$fileId.tsx`

**Constraints:**
- Preview page is read-only placeholder
- No actual file content rendering yet
- Folders are not clickable (only expand/collapse)

---

## Phase 7: Cleanup & Integration

### Step 7.1 — Final Polish
**Objective:** Ensure visual consistency across all new components.

**Checklist:**
- [ ] All components use `cn()` utility
- [ ] All icons from `lucide-react`
- [ ] All shadcn components imported from `#/components/ui/*`
- [ ] Dark mode compatible (uses semantic tokens: `bg-card`, `text-foreground`, etc.)
- [ ] Responsive behavior preserved (no horizontal overflow on mobile)
- [ ] Folder expand/collapse animation (optional: `transition-all` on height)

---

## Implementation Order Summary

1. Types (`src/features/notebook/types.ts`) ✅
2. Tree hook (`src/features/notebook/hooks/use-file-tree.ts`)
3. File type icons (`src/features/notebook/utils/file-type-icons.ts`)
4. File tree row (`src/features/notebook/components/file-tree-row.tsx`)
5. File tree container (`src/features/notebook/components/file-tree.tsx`)
6. Source status badge (`src/features/notebook/components/source-status-badge.tsx`)
7. Context menu / actions (`src/features/notebook/components/file-actions-menu.tsx`)
8. Inline rename (`src/features/notebook/components/inline-rename.tsx`)
9. Delete dialog (`src/features/notebook/components/delete-dialog.tsx`)
10. Empty state (`src/features/notebook/components/notebook-empty-state.tsx`)
11. Breadcrumb (`src/features/notebook/components/notebook-breadcrumb.tsx`)
12. File preview route (`src/routes/notebooks/$notebookId.files.$fileId.tsx`)
13. Final polish pass
