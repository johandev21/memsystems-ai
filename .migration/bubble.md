# bubble

2026-07-10, strategy used: universal-patterns (Slot -> useRender), complete

## Changed

- **`src/components/chat/bubble.tsx`**:
  - Replaced import `{ Slot } from "radix-ui"` with `{ mergeProps } from "@base-ui/react/merge-props"` and `{ useRender } from "@base-ui/react/use-render"`.
  - Refactored `BubbleContent` to use `useRender` and `mergeProps` to safely support polymorphism via `render` instead of `asChild`.

## Left alone

- None.

## Behavior changes

- None.

## Verify by hand

1. Open the chat panel in any notebook.
2. Confirm chat messages (both user and assistant) render correctly inside their bubbles.
3. Verify that selection and hover effects behave as expected.
