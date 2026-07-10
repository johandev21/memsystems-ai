# attachment

2026-07-10, strategy used: universal-patterns (Slot -> useRender), complete

## Changed

- **`src/components/chat/attachment.tsx`**:
  - Replaced import `{ Slot } from "radix-ui"` with `{ mergeProps } from "@base-ui/react/merge-props"` and `{ useRender } from "@base-ui/react/use-render"`.
  - Refactored `AttachmentTrigger` to use `useRender` and `mergeProps` to safely support polymorphism via `render` instead of `asChild`.

## Left alone

- None.

## Behavior changes

- None.

## Verify by hand

1. Open a chat or source upload view that renders file attachments.
2. Confirm the icons and cancel buttons display correctly on the attachment rows.
3. Verify that clicking on attachment cards opens their respective attachments.
