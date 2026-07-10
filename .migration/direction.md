# direction

2026-07-10, strategy used: universal-patterns (Direction -> direction-provider), complete

## Changed

- **`src/components/shared/direction.tsx`**:
  - Replaced import `{ Direction } from "radix-ui"` with `@base-ui/react/direction-provider`.
  - Ported `DirectionProvider` to use `DirectionProvider` from `@base-ui/react/direction-provider` and map the `dir` prop to the `direction` prop.

## Left alone

- None.

## Behavior changes

- None.

## Verify by hand

1. Confirm text direction contexts work properly when changing the locale or direction configuration.
