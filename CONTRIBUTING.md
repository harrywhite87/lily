# Contributing to Lilypad

Thanks for your interest in contributing! This guide will help you get set up and outline the conventions we follow.

## Prerequisites

| Tool | Version |
|------|---------|
| **Node.js** | 18+ |
| **pnpm** | 8+ |
| **Git** | 2.x |

## Getting Started

```bash
# 1. Fork & clone
git clone https://github.com/<your-username>/lilypad-h-dev.git
cd lilypad-h-dev

# 2. Install dependencies
pnpm install

# 3. Start the dev server
pnpm dev            # → http://localhost:5173
```

## Repository Structure

This is an **Nx monorepo** with one application and several shared libraries:

```
lilypad/
├── apps/web/               # React + Vite frontend
├── libs/
│   ├── animation/           # Declarative animation primitives
│   ├── debug/               # Debug tooling
│   ├── debug-assets/        # Debug visual assets
│   ├── scroll/              # Custom scroll container + context
│   ├── shared/              # Math utils (clamp, lerp, remap, etc.)
│   ├── three/               # Three.js modules (particles, models, effects, etc.)
│   └── ui/                  # Shared UI components (page layout)
├── docs/                    # Spec & design documents
└── tsconfig.base.json       # Workspace-wide TS path aliases (@lilypad/*)
```

Libraries are imported via `@lilypad/*` path aliases defined in `tsconfig.base.json`.

## Development Workflow

### Branching

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Keep commits small and focused — one logical change per commit.
3. Open a pull request when ready for review.

### Useful Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all projects |
| `pnpm typecheck` | Type-check all projects |
| `npx nx test <lib>` | Test a single library (e.g. `npx nx test shared`) |
| `npx nx graph` | Visualise the dependency graph |

### Before Submitting a PR

Run the full quality pipeline locally:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

All three must pass cleanly.

## Code Conventions

### TypeScript

- **Strict mode** is enabled workspace-wide — no `any` unless absolutely necessary.
- Target **ES2022** with **bundler** module resolution.
- Export public API through each library's `src/index.ts` barrel file.

### Styling

We use **SCSS Modules** to prevent class name collisions. Follow the style baseline documented in [`Style Baseline.md`](Style%20Baseline.md):

- **File naming:** `ComponentName.module.scss`
- **Font:** Noto Sans (400 / 500 / 700)
- **Spacing & radii:** Use the CSS custom property tokens (`--size-*`, `--radius-*`)
- **Colors:** Use the semantic token scale (`--color-neutral-*`, `--color-primary-*`, etc.)
- **No hardcoded pixel values** for spacing — always reference the token scale.

### Components

- One component per file, named with PascalCase.
- Co-locate styles: `Button.tsx` + `Button.module.scss`.
- Place shared, reusable components in the appropriate `libs/` package.
- Feature-specific components live under `apps/web/src/features/`.

### Three.js / Shaders

- GLSL shaders live under `apps/web/src/features/shaders/`.
- Use React Three Fiber (`@react-three/fiber`) and Drei (`@react-three/drei`) for 3D scene composition.
- Scene-driven values should be pure functions of the global scroll progress `p ∈ [0, 1]`.

### Testing

- **Framework:** Vitest
- Place test files alongside source as `*.spec.ts` or `*.test.ts`.
- Utility/library code should have unit tests; visual components can be tested via snapshot or integration tests.

## Adding a New Library

```bash
npx nx g @nx/js:lib libs/<lib-name> --bundler=none
```

### 1. Register the path alias

Add an entry to **`tsconfig.base.json`** → `compilerOptions.paths`:

```json
"@lilypad/<lib-name>": ["libs/<lib-name>/src/index.ts"]
```

### 2. Create the library tsconfig

Every library **must** have its own `tsconfig.json` that extends the base config. Use `NodeNext` module resolution and enable `composite` for project references so incremental builds work correctly. Output should always target `dist/`:

**`libs/<lib-name>/tsconfig.json`**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "composite": true,
    "outDir": "../../dist/libs/<lib-name>",
    "types": []
  },
  "include": ["src/**/*"]
}
```

### 3. App tsconfigs

App-level tsconfigs follow the same pattern. For the web app, note the `vite/client` type:

**`apps/<app-name>/tsconfig.json`**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "composite": true,
    "outDir": "../../dist/apps/<app-name>",
    "types": ["vite/client"]
  },
  "include": ["src/**/*"]
}
```

### tsconfig rules of thumb

| Rule | Why |
|------|-----|
| Always set `module` + `moduleResolution` to **`NodeNext`** | Enforces correct ESM imports (explicit `.js` extensions), avoids runtime surprises |
| Always set **`composite: true`** | Enables Nx/TS project-reference incremental builds |
| Always set `outDir` to **`../../dist/<type>/<name>`** | Keeps build artefacts out of source and centralised under `dist/` |
| Extend **`tsconfig.base.json`** | Inherits strict mode, path aliases, and shared compiler settings |
| Keep `types` minimal | Only include ambient type packages the project actually uses |

## Commit Messages

Use clear, imperative-mood messages:

```
feat: add caustic shader intensity control
fix: correct scroll progress remap in segment C
docs: update architecture diagram
refactor: extract camera choreography into shared lib
```

| Prefix | Use for |
|--------|---------|
| `feat` | New features |
| `fix` | Bug fixes |
| `docs` | Documentation changes |
| `refactor` | Code restructuring (no behaviour change) |
| `test` | Adding or updating tests |
| `chore` | Tooling, deps, CI, config |

## Reporting Issues

Open a GitHub issue with:

1. **Description** — what you expected vs. what happened.
2. **Steps to reproduce** — minimal instructions to trigger the issue.
3. **Environment** — OS, browser, Node version.
4. **Screenshots / recordings** — if it's a visual bug, include them.

## Code of Conduct

Be respectful, constructive, and inclusive. We're all here to build something cool. 🌊
