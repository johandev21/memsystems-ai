# item

2026-07-10, strategy used: universal-patterns (Slot -> useRender), complete

## Changed

- **`src/components/shared/item.tsx`**:
  - Replaced import `{ Slot } from "radix-ui"` with `{ mergeProps } from "@base-ui/react/merge-props"` and `{ useRender } from "@base-ui/react/use-render"`.
  - Refactored `Item` to use `useRender` and `mergeProps` to safely support polymorphism via `render` instead of `asChild`.

## Left alone

- None.

## Behavior changes

- None.

## Verify by hand

1. Confirm item list rows in the study materials tree or search results render and highlight correctly on hover/focus.
