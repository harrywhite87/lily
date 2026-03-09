---
title: Frontend Standards
level: system
audience: technical
last_updated: 2026-03-09
---

# Frontend Standards

This document defines the default frontend standards for React applications in this repository.
If live code or configuration diverges from this guide, update this document to match the repository.

## Scope

These standards apply to:

- frontend apps in `apps/`
- shared frontend libraries in `libs/`
- feature code inside React and React Three Fiber projects

## Default Frontend Stack

Use the following defaults unless there is a clear reason to choose otherwise:

- React
- Vite
- SCSS Modules
- CSS custom properties for design tokens
- Zustand for shared client-side state
- React Three Fiber where 3D behaviour is required

Related standards:

- [DATA_FETCHING_STANDARD.md](./DATA_FETCHING_STANDARD.md) for server-state and API access
- [ACCESSIBILITY_AND_MOTION_STANDARD.md](./ACCESSIBILITY_AND_MOTION_STANDARD.md) for keyboard, focus, contrast, and motion rules
- [THREE_D_AND_ASSET_STANDARD.md](./THREE_D_AND_ASSET_STANDARD.md) for 3D scene and asset standards

## State Management

Keep state as local as possible.
Do not reach for a global store unless the state is genuinely shared, persistent, or cross-cutting.

### Default State Hierarchy

Use this order of preference:

1. Component-local state with `useState` or `useReducer`
2. Feature-owned state inside the feature folder
3. App-level shared store for cross-feature client state
4. Persisted store state only for a small, deliberate subset

### Default Shared Store

Use Zustand as the default shared client-state store for React apps.
It fits the feature-sliced structure well and keeps shared state lightweight.

Use the store for:

- UI state shared across multiple parts of the app
- user preferences
- session-adjacent client state
- complex editor or workspace state

Do not use the store by default for:

- simple component toggles
- one-off form fields
- transient hover or focus state
- server-fetched data that should stay in the data-fetching layer

### Slice Rules

Keep store slices narrow and ownership-based.

- prefer small slices such as `ui`, `preferences`, `navigation`, or feature-specific slices
- keep actions close to the slice they mutate
- expose selectors for derived state
- avoid one large catch-all store file
- persist only the parts of state that need to survive reloads

Feature-specific store logic should live with the feature, then be composed into the app store if needed.

Example structure:

```text
apps/web/src/
|-- app/
|   `-- store/
|       |-- store.ts
|       `-- store.types.ts
|-- features/
|   |-- editor/
|   |   `-- state/
|   |       |-- editor.slice.ts
|   |       |-- editor.selectors.ts
|   |       `-- editor.types.ts
|   `-- preferences/
|       `-- state/
|           |-- preferences.slice.ts
|           `-- preferences.selectors.ts
`-- shared/
```

### State Boundaries

- keep server state out of the client store unless there is a specific reason to mirror it
- keep derived values in selectors rather than duplicating them in state
- do not let one feature mutate another feature's internals directly
- prefer explicit public APIs from each feature's `state/` folder

## Styling Standards

### Default Styling Approach

Use `*.module.scss` for component, page, and feature styling.
Co-locate each SCSS module with the component or view it styles.

Use global styles only for:

- reset rules
- design tokens
- typography foundations
- app-wide layout primitives

Do not use ad hoc global CSS for feature styling.

### Global Style Structure

Prefer a single app-level styles entry with files similar to:

```text
apps/web/src/app/styles/
|-- reset.scss
|-- tokens.scss
|-- typography.scss
`-- globals.scss
```

Import these once from the app entry point or app shell.

### SCSS Module Rules

- keep selectors shallow and readable
- use local class names, not global selectors
- prefer a `root` class as the primary component wrapper
- avoid styling by DOM depth where a named class would be clearer
- use CSS custom properties and token aliases instead of hard-coded values
- use inline styles only when values are truly dynamic at runtime

## Component Conventions

Use simple, predictable component structure.

Default rules:

- keep one primary component per file
- name React component files in PascalCase
- co-locate component styles with the component using `ComponentName.module.scss`
- keep feature-specific components inside the owning feature folder
- move broadly reusable UI into an appropriate shared library only when reuse is proven

Prefer small public surfaces for reusable components and avoid exporting unfinished internal helpers by default.

## Design Tokens

Use CSS custom properties as the token system for colour, spacing, and typography-related primitives.
Define tokens centrally, then consume them from SCSS modules.

### Colour Tokens

Maintain palette scales for the main design colours:

```css
--color-primary-100
--color-primary-200
...
--color-primary-900

--color-secondary-100
--color-secondary-200
...
--color-secondary-900

--color-neutral-100
--color-neutral-200
...
--color-neutral-900
```

Use singleton semantic tokens for status colours:

```css
--color-success
--color-warn
--color-danger
--color-info
```

Also define app-facing alias tokens for common usage:

```css
--color-text
--color-text-muted
--color-surface
--color-surface-alt
--color-border
--color-focus-ring
```

Rules:

- palette tokens define the raw colour system
- semantic and alias tokens are what most components should consume
- avoid hard-coded hex values in component styles
- if themes are added later, swap token values rather than rewriting component styles

### Size Tokens

Use a shared size scale for spacing and general layout measurements:

```css
--size-100
--size-200
...
--size-900
```

Use `--size-*` tokens for:

- spacing
- gaps
- padding
- margins
- radii
- control heights
- layout offsets where a shared scale makes sense

Rules:

- prefer tokenised sizes over raw pixel values
- raw values are acceptable for hairlines such as `1px` borders when needed
- do not use arbitrary one-off spacing values if an existing token fits

### Typography Tokens

Keep typography tokens separate from general size tokens.
Do not try to drive the entire type system from `--size-*` alone.

Prefer tokens such as:

```css
--font-family-body
--font-family-display
--font-family-mono

--font-size-100
--font-size-200
...
--font-size-700

--line-height-tight
--line-height-normal
--line-height-relaxed

--font-weight-regular
--font-weight-medium
--font-weight-semibold
--font-weight-bold
```

## Reset And Base Styles

Maintain a single style reset and load it once per app.

The reset should cover at least:

- `box-sizing: border-box` for all elements
- margin and padding normalisation
- form control font inheritance
- image and media display defaults
- button reset basics
- sensible defaults for lists, headings, and paragraphs

Keep the reset minimal. Its job is consistency, not opinionated component styling.

## Typography Standards

Set typography foundations globally in `typography.scss`.

Rules:

- define body, heading, label, and code defaults once
- use tokenised font families, sizes, and line heights
- keep readable default line height for body text
- avoid setting unique type scales per feature without a clear reason
- prefer semantic text roles over one-off font declarations

## Frontend Testing Guidance

Keep tests close to the code they verify.

Default rules:

- place tests alongside source as `*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `*.spec.tsx`
- unit test utility and library code
- test state slices and selectors where they hold meaningful logic
- use integration-style tests for component behaviour that spans hooks, state, and rendering
- avoid brittle tests that lock down incidental markup structure

## Example Token Shape

This is only a naming example, not a final value set:

```scss
:root {
  --color-primary-100: ...;
  --color-primary-900: ...;
  --color-secondary-100: ...;
  --color-secondary-900: ...;
  --color-neutral-100: ...;
  --color-neutral-900: ...;

  --color-success: ...;
  --color-warn: ...;
  --color-danger: ...;
  --color-info: ...;

  --color-text: var(--color-neutral-900);
  --color-text-muted: var(--color-neutral-600);
  --color-surface: var(--color-neutral-100);
  --color-surface-alt: var(--color-neutral-200);
  --color-border: var(--color-neutral-300);
  --color-focus-ring: var(--color-primary-500);

  --size-100: ...;
  --size-200: ...;
  --size-300: ...;
  --size-400: ...;
  --size-500: ...;
  --size-600: ...;
  --size-700: ...;
  --size-800: ...;
  --size-900: ...;

  --font-family-body: ...;
  --font-family-display: ...;
  --font-family-mono: ...;

  --font-size-100: ...;
  --font-size-200: ...;
  --font-size-300: ...;
  --font-size-400: ...;
  --font-size-500: ...;
  --font-size-600: ...;
  --font-size-700: ...;
}
```

## Review Checklist

Before opening or merging frontend work, confirm:

- [ ] State is kept local unless shared state is genuinely needed
- [ ] Shared client state uses Zustand with clear slice ownership
- [ ] Feature state lives with the owning feature
- [ ] Styling uses SCSS Modules by default
- [ ] Global CSS is limited to reset, tokens, typography, and true app-wide rules
- [ ] Components use design tokens instead of hard-coded colour and spacing values
- [ ] Buildable styling and state conventions still fit the feature-sliced structure
