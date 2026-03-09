# Form Elements

Shared React form components that use the style-baseline token system. Importable across apps via `@lilypad/form-elements`.

## Components

| Component | Description |
|---|---|
| `Button` | Standard button with `primary`, `secondary`, and `ghost` variants |
| `Input` | Text input with ref forwarding |
| `TextArea` | Multi-line text input with ref forwarding |
| `Select` | Native select with custom chevron indicator |
| `Checkbox` | Custom checkbox with optional label content |
| `Label` | Form label with optional required indicator |

## Usage

```tsx
import { Button, Input, Label } from '@lilypad/form-elements';

function LoginForm() {
  return (
    <form>
      <Label htmlFor="email" required>Email</Label>
      <Input id="email" type="email" placeholder="you@example.com" />

      <Button type="submit">Sign In</Button>
      <Button variant="ghost" type="button">Cancel</Button>
    </form>
  );
}
```

## How Overrides Work

Every component styles itself using CSS custom properties from the token system (`--color-primary-500`, `--color-text`, `--size-400`, etc.). Because custom properties cascade through the DOM, a consuming app controls the look simply by defining its own values for the same tokens.

```
App loads its globals.scss  →  defines --color-primary-500: #your-brand;
                            →  all <Button variant="primary"> picks up the new colour
```

No `!important`, no special import order, no prop-based theme API.

### Per-instance overrides

Every component accepts a `className` prop. The consuming app's SCSS module class will merge alongside the component's internal class, so you can override specific rules:

```tsx
<Button className={styles.myCustomButton}>Custom</Button>
```

## Rules

- Components must only use `var(--token-name)` for colours, spacing, radii, and typography — no hard-coded values.
- All components accept `className` and spread remaining HTML attributes.
- Ref forwarding is used on all form controls (`Input`, `TextArea`, `Select`, `Checkbox`).
