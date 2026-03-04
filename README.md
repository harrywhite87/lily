# Lilypad Scroll Demo

An interactive scroll experience with React, Three.js overlay, and shader-driven water visuals inside an Nx monorepo.

## Quick Start

```bash
pnpm install
npx nx dev web
```

Open [http://localhost:5173](http://localhost:5173) and scroll to navigate through all four areas.

## Architecture

| Layer | Purpose |
|-------|---------|
| **DOM Content** | Four content areas with semantic text/layout (SCSS Modules) |
| **Three.js Overlay** | Fixed canvas for model, shaders, and camera choreography |
| **Scroll Orchestration** | Single source of truth for normalized progress & segment remapping |

## Scroll Model

Global progress `p ∈ [0, 1]` drives everything:

- **Segment A** (`0.00–0.30`): Area 1 → Area 2 — horizontal
- **Segment B** (`0.30–0.60`): Area 2 → Area 3 — horizontal
- **Segment C** (`0.60–1.00`): Area 3 → Area 4 — vertical

All scene values are pure functions of progress, so reverse scrolling naturally rewinds all state.

## Project Structure

```
lilypad/
├── apps/web/              # React + Vite frontend
│   └── src/
│       ├── features/
│       │   ├── content/   # Area 1–4 section components
│       │   ├── scene/     # R3F overlay, camera, submarine
│       │   └── shaders/   # Water surface + caustics GLSL
│       ├── App.tsx
│       └── global.scss
├── libs/
│   ├── shared/            # Math utils (clamp, lerp, remap, sectionProgress)
│   ├── scroll/            # Custom scroll container + context
│   └── animation/         # Declarative animation primitives
├── docs/                  # Spec documents
└── submarine.glb          # 3D model asset
```

## Commands

| Command | Description |
|---------|-------------|
| `npx nx dev web` | Start dev server |
| `npx nx build web` | Production build |
| `npx nx test shared` | Run math utility tests |
| `npx nx test animation` | Run animation tests |
| `npx nx run-many -t test` | Run all tests |

## Known Issues & Next Steps

1. **Map provider** — Area 1 has a placeholder; needs Mapbox/Cesium/MapLibre integration.
2. **GLB provenance** — Record licensing and source metadata for `submarine.glb`.
3. **Mobile** — Desktop-first; mobile optimization deferred.
4. **Native scroll evaluation** — Phase 6 (optional) — compare native scroll adapter vs custom container.

## Visual Direction

Neutral navy-blue nautical palette with glassmorphism cards, gold accents, and Inter + Playfair Display typography.
