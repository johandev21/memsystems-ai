# Project Migration Report

This report summarizes the whole-project migration from Radix UI style (`radix-rhea`) to Base UI style (`base-rhea`) using the shadcn preset `b27GcrRo` and the Inter font family.

## Summary of Changes

1. **Dependency Swaps**:
   - Removed `radix-ui` dependency from `package.json`.
   - All imports from `"radix-ui"` have been replaced with Base UI equivalents.
2. **App-Code Sweeps**:
   - Custom chat (`Attachment`, `Bubble`, `Marker`) and shared layout (`ButtonGroup`, `Item`) components have been fully refactored to use `@base-ui/react/use-render` and `mergeProps`.
   - Feature dialogs, select inputs, popovers, and context menu triggers across `src/features/` have been updated to use the Base UI `render` prop instead of `asChild`.
3. **Styles & Typography**:
   - `components.json` style switched to `"base-rhea"`.
   - Updated `globals.css` to configure the Inter font family.

## Final Build and Verification Results

- **Typecheck**: `pnpm run typecheck` succeeded with 0 errors.
- **Tests**: `pnpm run test` succeeded with all 190 tests passing.
- **Linter & Formatting**: Executed Biome formatting and auto-import sorting across all modified files.

*Result: 0 wrappers remain on Radix.*
