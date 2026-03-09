# Style Baseline

Reference implementation of the base style system described in [FRONTEND_STANDARDS.md](../../FRONTEND_STANDARDS.md).

## Purpose

This library is a **reference**, not a shared dependency. Apps and libs should **copy** the files they need into their own `styles/` folder rather than importing them directly. This avoids tight coupling between projects while keeping style foundations roughly aligned.

## Contents

| File | Role |
|---|---|
| `src/reset.scss` | CSS reset — box-sizing, margin/padding normalisation, form font inheritance, media defaults, reduced-motion |
| `src/tokens.scss` | Invariant design tokens — colour palettes, semantic colours, sizing, radii, typography, transitions |
| `src/theme-dark.scss` | Dark theme alias tokens (`:root` default) |
| `src/theme-light.scss` | Light theme alias tokens (`[data-theme="light"]`) |
| `src/typography.scss` | Typography foundations — body, headings, labels, code defaults |
| `src/globals.scss` | Single entry-point composing reset → tokens → themes → typography |
| `src/example.module.scss` | Example SCSS module showing how to consume tokens in a component |

## Theme System

Both dark and light themes are a required part of the baseline. Every app that copies these files gets both themes out of the box.

### Theme Alias Tokens

These are the theme-aware tokens all components should consume:

| Token | Purpose |
|---|---|
| `--color-text` | Primary text colour |
| `--color-text-muted` | Secondary / muted text |
| `--color-surface` | Main background |
| `--color-surface-alt` | Alternate / elevated surface |
| `--color-surface-hover` | Hover state for surfaces |
| `--color-border` | Primary borders |
| `--color-border-subtle` | Subtle dividers |
| `--color-focus-ring` | Focus indicator |
| `--color-input-bg` | Input / form control background |
| `--color-placeholder` | Placeholder text |
| `--color-disabled-bg` | Disabled control background |
| `--color-disabled-text` | Disabled text |

### Switching Themes

Dark is the default. To activate light mode, add `data-theme="light"` to the root element:

```html
<html data-theme="light">
```

## How to Adopt

1. Copy the core files (`reset.scss`, `tokens.scss`, `theme-dark.scss`, `theme-light.scss`, `typography.scss`, `globals.scss`) into your app at `src/app/styles/`.
2. Import `globals.scss` once from your app entry point or shell component.
3. Adjust token values (colours, font families, etc.) to suit your app's needs.
4. Use `example.module.scss` as a reference for how component SCSS modules should consume the tokens — don't import it directly.

## Rules

- **Do not import across project boundaries.** There is no `@lilypad/style-baseline` alias in `tsconfig.base.json` by design.
- **Tokens are the contract.** Components should use semantic and alias tokens (`--color-text`, `--color-surface`, `--size-400`, etc.) instead of raw palette values.
- **Both themes are required.** Always provide dark and light alias values so theme switching works everywhere.
- **Keep in sync manually.** When this baseline changes, propagate relevant updates to consuming apps at your own pace. The loose coupling is intentional.
