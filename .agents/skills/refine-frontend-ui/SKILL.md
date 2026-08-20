---
name: refine-frontend-ui
description: Plan, critique, implement, or polish frontend interfaces toward a professional minimal design with subtle microinteractions, strong UX, responsive behavior, accessibility, and consistency with the host design system. Use for ambiguous visual redesigns, component polish, hover/focus/open-state refinement, typography or spacing cleanup, view/edit transitions, theme consistency, pixel-perfect UI work, and requests to make an existing web interface feel calmer, clearer, or more intentional across any frontend stack.
---

# Refine Frontend UI

Improve an existing interface without replacing its visual identity. Make the smallest coherent change that strengthens hierarchy, usability, and finish.

Do not rely on another skill being available. Discover the project’s framework, component primitives, tokens, and conventions before designing.

## Choose the operating mode

Honor the user’s requested stage.

- **Plan or explore:** inspect the real UI and code, develop directions, and stop before editing.
- **Critique or diagnose:** identify causes and tradeoffs; do not implement unless requested.
- **Implement or proceed:** make the approved change, verify it, and report limitations honestly.
- **Unclear intent:** propose two or three materially different directions, recommend one, and resolve decisions one at a time.

Do not turn an ambiguous visual preference into code before establishing a shared direction.

## 1. Ground the work

Inspect before proposing.

1. View supplied screenshots at original resolution.
2. Locate the rendered component, shared primitives, global styles, theme tokens, and related states.
3. Inspect repository guidance and the package manifest to identify the styling system.
4. Determine the component’s primary job and whether it is currently viewing, editing, navigating, or confirming.
5. Identify existing user changes and preserve unrelated work.

Describe the problem causally. Prefer “the shared trigger adds border and scale on hover” over “the hover looks bad.”

Read [references/framework-adaptation.md](references/framework-adaptation.md) when the stack or design-system seam is not obvious.

## 2. Inventory the experience

List the states that materially affect the component:

- resting and content-filled
- hover and pointer exit
- keyboard focus-visible
- pressed, open, or selected
- editing, saving, and cancelling
- disabled, loading, empty, and error
- overflow, long content, and localization growth
- light and dark themes
- narrow, wide, touch, and reduced-motion environments

Do not optimize one screenshot while breaking another state.

## 3. Establish a design direction

When direction is ambiguous, present two or three concise concepts. For each concept, explain:

- hierarchy and layout
- geometry and density
- typography and color roles
- interaction behavior
- main tradeoff

Recommend one. Base the recommendation on the product’s job and existing visual language, not generic fashion.

Resolve dependent decisions individually. Useful decision order:

1. content hierarchy
2. placement and alignment
3. viewing behavior
4. editing or action behavior
5. overflow and empty states
6. theme and responsive behavior
7. motion and feedback

Once agreed, record an implementation plan with explicit view, interaction, accessibility, responsive, and verification steps.

## 4. Apply minimal design principles

### Hierarchy

- Give each element one job.
- Make primary content clear and supporting content quieter, not illegible.
- Remove labels, containers, icons, and decoration that do not clarify structure or state.
- Preserve a calm viewing mode; reveal editing machinery only when needed.

### Geometry

- Use a small, coherent radius scale. Avoid nesting several pill or heavily rounded surfaces.
- Keep hit areas accessible while allowing the visible artwork to remain quiet.
- Preserve geometry across rest, hover, focus, and open states.
- Avoid layout shift, glyph scaling, bouncing, or border changes that alter dimensions.

### Typography

- Use the project’s existing font families and type scale.
- Prefer named size utilities or tokens when the project defines them.
- Recalibrate weight, line height, and tracking together.
- Constrain long reading lines and preserve authored whitespace when meaningful.
- Do not introduce a new font or arbitrary type size for a local polish task.

### Color and themes

- Use semantic tokens before raw colors.
- Build hierarchy with semantic foreground opacity when appropriate.
- Let theme tokens adapt light and dark modes; avoid duplicated theme overrides unless semantics genuinely differ.
- Maintain readable contrast in every state.

### Spacing

- Derive spacing from the project scale.
- Align related content to a meaningful anchor.
- Prefer a consistent gap rhythm over ad hoc margins.
- Treat empty space as structure, not leftover area.

## 5. Design microinteractions

Make feedback noticeable only when the user needs it.

- Prefer color, opacity, or a quiet surface change over scaling or translation.
- Use roughly 120–200ms for simple state transitions unless the project defines timing tokens.
- Animate only properties that explain state; avoid `transition-all` when a narrower transition works.
- Keep hover from changing layout or stealing attention from content.
- Provide keyboard focus independently from hover.
- Never hide an essential action behind hover alone; provide focus and touch access.
- Respect reduced-motion preferences.
- Keep destructive actions visually separated and confirmed.

## 6. Implement through the host system

1. Reuse existing components, tokens, variants, and composition patterns.
2. Fix behavior at the owning seam. Add a reusable variant when shared base styles cause local specificity fights.
3. Avoid broad primitive changes when only one consumer needs a different treatment.
4. Extract focused presentation logic when a component is accumulating unrelated responsibilities.
5. Preserve existing behavior, data flow, keyboard semantics, and error handling unless the approved design changes them.
6. Use the smallest dependency surface. Do not install a design library to solve a local refinement.

Read [references/framework-adaptation.md](references/framework-adaptation.md) before changing unfamiliar styling or component infrastructure.

## 7. Critique the result

Review the implementation against the brief before declaring completion.

Ask:

- Does viewing mode still feel like viewing rather than editing?
- Is any state louder than its importance warrants?
- Did a border, radius, shadow, label, or animation survive without a job?
- Does the component align with nearby surfaces and typography?
- Does the interaction remain discoverable by pointer, keyboard, and touch?
- Did the fix address the cause rather than cover it with overrides?

Remove one unnecessary visual treatment if the result still feels busy.

## 8. Verify

Use the product-native browser or preview when available. Inspect real screenshots rather than relying only on class names.

Read [references/visual-qa.md](references/visual-qa.md) and select the states relevant to the change. At minimum:

1. compare rest and interaction states for geometry shifts
2. verify keyboard focus and touch access
3. test empty, short, and long content
4. test narrow and wide layouts
5. test every supported theme
6. check console and runtime errors
7. run targeted formatting, lint, type, test, and build commands appropriate to risk

If authentication or unavailable data blocks visual verification, state that limitation and complete every safe alternative check. Never claim a state was visually verified when it was not.

## Output expectations

Lead with the design outcome.

- For planning, state the diagnosis, concepts, recommendation, and next decision.
- For implementation, summarize visible behavior, important structural changes, checks run, and any verification limitation.
- Avoid narrating routine tool usage.
- Keep recommendations concrete enough to implement.
