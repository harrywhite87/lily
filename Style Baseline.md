### 🎨 Minimalist AI Styling Baseline (Updated)

**Design Philosophy:** Clean, unopinionated, and sleek. High contrast, generous whitespace, and zero unnecessary decorative elements (no heavy shadows, gradients, or borders unless functionally required).

#### 1\. Typography

-   **Primary Font:** `Noto Sans`, sans-serif
    
-   **Weights:** Regular (400) for body, Medium (500) for interactive elements, Bold (700) for headers.
    
-   **Line Height:** 1.5 for body text, 1.2 for headings.
    

#### 2\. CSS Color Tokens

Keep this to a streamlined neutral and primary scale to avoid token bloat.

CSS

```
:root {
  /* Neutrals */
  --color-neutral-50: #fafafa;
  --color-neutral-100: #f5f5f5;
  --color-neutral-200: #e5e5e5;
  --color-neutral-500: #737373;
  --color-neutral-800: #262626;
  --color-neutral-900: #171717;

  /* Primary */
  --color-primary-100: #dbeafe;
  --color-primary-500: #3b82f6;
  --color-primary-900: #1e3a8a;

  /* Semantic */
  --color-error: #ef4444;
  --color-success: #22c55e;

  /* Defaults */
  --bg-primary: var(--color-neutral-50);
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-500);
}

```

#### 3\. Size & Radii Tokens

A flexible, numeric scale using pixels. Gaps are intentionally left in the numbering to allow for future micro-adjustments if needed.

CSS

```
:root {
  /* Sizing (Padding, Margins, Gaps) */
  --size-100: 1px;
  --size-200: 2px;
  --size-300: 4px;
  --size-400: 8px;
  --size-500: 16px;
  --size-600: 24px;
  --size-700: 32px;
  --size-800: 48px;
  --size-900: 64px;

  /* Radii */
  --radius-300: 4px;
  --radius-400: 8px;
  --radius-500: 16px;
  --radius-round: 9999px;
}

```

#### 4\. SCSS Modules Approach

The AI should always use CSS/SCSS Modules to prevent class name collisions, strictly referencing the numeric size tokens.

-   **File Naming:** `ComponentName.module.scss`
    
-   **Syntax Rule:** Use standard class names, referencing the global CSS variables.
    

**Example Component SCSS (`Button.module.scss`):**

SCSS

```
.button {
  font-family: 'Noto Sans', sans-serif;
  background-color: var(--color-primary-500);
  color: var(--color-neutral-50);
  /* Using the new numeric size scale */
  padding: var(--size-400) var(--size-500); 
  border-radius: var(--radius-300);
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.9;
  }
}