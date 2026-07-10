# marker

2026-07-10, strategy used: universal-patterns (Slot -> useRender), complete

## Changed

- **`src/components/chat/marker.tsx`**:
  - Replaced import `{ Slot } from "radix-ui"` with `{ mergeProps } from "@base-ui/react/merge-props"` and `{ useRender } from "@base-ui/react/use-render"`.
  - Refactored `Marker` to use `useRender` and `mergeProps` to safely support polymorphism via `render` instead of `asChild`.

## Left alone

- None.

## Behavior changes

- None.

## Verify by hand

1. Open the chat panel.
2. Confirm that system messages, notes, or divider lines render correctly inside the scrolling panel.
