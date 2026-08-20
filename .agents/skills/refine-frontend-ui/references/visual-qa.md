# Visual QA

Use this reference after implementation or when auditing a component. Select relevant states rather than mechanically testing impossible ones.

## State matrix

| Dimension | States to inspect |
| --- | --- |
| Interaction | rest, hover, pointer exit, focus-visible, active, open, selected |
| Availability | enabled, disabled, loading, saving |
| Content | empty, short, typical, long, multiline, overflow, error |
| Environment | light, dark, narrow, wide, touch, reduced motion |
| Lifecycle | entering edit, cancelling, saving, success, failure |

## Geometry checks

- Compare bounding boxes between rest and hover.
- Confirm borders do not add width or height.
- Confirm glyphs do not scale or shift unless motion is purposeful and approved.
- Check alignment with nearby anchors at each breakpoint.
- Check popovers at viewport edges and inside overflow containers.
- Check scrollbars do not crop the first or last item.
- Verify long labels, localization growth, and zoom do not collide.

## Hierarchy checks

- Squint at the screenshot: primary content should remain dominant.
- Confirm supporting text is readable but subordinate.
- Remove duplicate labels or affordances.
- Check that empty states do not create dead visual containers.
- Confirm destructive actions are separated from routine actions.

## Interaction checks

- Navigate using only the keyboard.
- Confirm focus order follows reading order.
- Verify focus-visible styling is quiet but unmistakable.
- Confirm every hover action has keyboard and touch access.
- Exercise Escape, Enter, and arrow keys where the component promises them.
- Check cancel restores the previous value and save communicates progress.
- Confirm rapid repeated actions do not produce stale state.

## Theme checks

- Inspect semantic contrast in every supported theme.
- Confirm translucent foregrounds remain legible over their actual surfaces.
- Check shadows, borders, image overlays, and backdrop blur in both themes.
- Avoid theme-specific patches when a semantic token can solve both.

## Motion checks

- Confirm motion explains a state change.
- Check transition duration and easing against nearby controls.
- Ensure exit states do not linger.
- Test reduced-motion behavior.
- Avoid animating layout dimensions when a direct state change is clearer.

## Evidence

Prefer:

1. before/after screenshots at the same viewport
2. screenshots of interaction states
3. a short recording for motion or multi-step flows
4. DOM measurements when checking layout stability
5. console and network inspection for runtime regressions

Do not substitute a successful build for visual verification. Do not substitute one screenshot for interaction testing.

## Technical checks

Run the repository’s documented quality gate. When no gate exists, choose proportionate checks:

- formatter or format check
- targeted lint
- type checking
- focused tests
- production build for styling or bundling changes
- diff whitespace check

Separate failures caused by the change from pre-existing failures and report both accurately.
