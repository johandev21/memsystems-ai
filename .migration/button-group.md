# button-group

2026-07-10, strategy used: universal-patterns (Slot -> useRender), complete

## Changed

- **`src/components/shared/button-group.tsx`**:
  - Replaced import `{ Slot } from "radix-ui"` with `{ mergeProps } from "@base-ui/react/merge-props"` and `{ useRender } from "@base-ui/react/use-render"`.
  - Refactored `ButtonGroupText` to use `useRender` and `mergeProps` to safely support polymorphism via `render` instead of `asChild`.

## Left alone

- None.

## Behavior changes

- None.

## Verify by hand

1. Confirm styled grouped buttons (like in the editor toolbar or popovers) render correctly.
2. Verify visual border-radius and separator layout behavior in horizontal and vertical configurations.
