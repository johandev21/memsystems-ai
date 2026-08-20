# Framework adaptation

Use this reference when the project’s styling or component seam is unclear.

## Detect before changing

Inspect the package manifest, configuration files, global styles, aliases, and nearby components. Determine:

- rendering framework and routing model
- styling approach
- component or primitive library
- theme and design-token source
- icon library
- form conventions
- animation utilities
- test and preview tooling

Do not infer a library solely from class names or visual appearance.

## Adapt to the existing stack

### Utility CSS systems

- Reuse configured tokens and named scales.
- Prefer semantic utilities over raw palette values.
- Use the project’s class-composition helper for conditional states.
- Avoid specificity piles that attempt to cancel a shared primitive.
- Prefer a typed component variant when one treatment repeats or base states leak through.

If the project uses Tailwind, respect its installed version and configuration. Do not assume shadcn is present.

### Component libraries

- Read the installed component source or official API documentation before composing unfamiliar primitives.
- Preserve required accessibility structure and state attributes.
- Use supported variants first.
- Add a local or shared variant based on ownership: local for a single exceptional surface, shared when the behavior is a legitimate reusable mode.
- Do not overwrite upstream-derived primitives broadly for one screen.

### CSS modules or scoped CSS

- Use existing variables and composition patterns.
- Keep selectors shallow and component-scoped.
- Model interaction states explicitly rather than relying on DOM accidents.
- Avoid magic values when an established spacing or type token exists.

### CSS-in-JS or styled systems

- Use theme values and existing variant APIs.
- Keep transient state props out of the DOM.
- Avoid creating a second token layer inside one component.
- Confirm server-rendering or client-boundary requirements before adding dynamic styling.

### Bespoke CSS

- Identify repeated values before inventing tokens.
- Add a token only when it expresses a reusable semantic role.
- Keep local one-off measurements local when they are genuinely structural.
- Verify browser support for advanced selectors and properties used by the project.

## General implementation rules

- Preserve unrelated behavior and styling.
- Prefer semantic HTML before adding ARIA.
- Keep focus-visible distinct from hover.
- Retain a minimum practical touch target even when the visible control is small.
- Use content-driven sizing carefully; cap growth where it can displace primary workflows.
- Avoid hardcoded theme colors when foreground/background tokens can express the relationship.
- Do not add a dependency when native CSS or an existing primitive solves the problem.

## When the project has no design system

Derive a minimal local system before polishing:

1. one foreground hierarchy
2. one surface hierarchy
3. one border/ring hierarchy
4. a compact radius scale
5. a spacing rhythm
6. a type scale with clear roles
7. motion timing and easing

Keep this system small and document it where the project already keeps styling conventions.
