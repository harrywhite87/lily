# Technical Architecture

## Monorepo Strategy
Use Nx with per-project `project.json` files and centralized dependency management at the repo root.

Confirmed constraints:
1. One root `package.json` only.
2. No package workspaces.
3. Apps and libs live in `apps/` and `libs/`.
4. Each app/lib has its own `project.json`.

## Proposed Repo Layout
```text
/
  package.json
  nx.json
  tsconfig.base.json
  docs/
  apps/
    web/
      project.json
      index.html
      src/
  libs/
    shared/
      project.json
      src/
```

## Frontend Stack
1. React (TypeScript preferred).
2. Vite bundler.
3. SCSS Modules for component-scoped styling.
4. React Three Fiber (`@react-three/fiber`) for 3D overlay.
5. Drei helpers as needed (`@react-three/drei`).

## App Architecture

## Layering
1. DOM content layer:
   - Houses four content areas and semantic text/layout.
2. Three.js overlay layer:
   - Fixed/sticky canvas used for model, shaders, and camera choreography.
3. Scroll orchestration layer:
   - Single source of truth for normalized progress and segment remapping.
   - Backed by custom scroll container in initial implementation.

## Suggested Module Boundaries
1. `features/scroll`:
   - Progress calculation, segment mapping, and reversible timeline utilities.
2. `features/content`:
   - Area components and SCSS module styles.
3. `features/scene`:
   - R3F scene, lights, camera rig, model controller (`submarine.glb`).
4. `features/shaders`:
   - GLSL material definitions for water and caustics.
5. `features/animation-manager`:
   - Declarative transition primitives (start/end/duration/easing) bound to progress.
6. `shared/utils`:
   - Math helpers (`clamp`, `lerp`, `smoothstep`, `remap`).

## State Management Approach
1. Keep scroll progress in a lightweight store or context.
2. Derive all scene and UI values from progress each frame or on update.
3. Avoid imperative "play once" animation calls that break reverse scrubbing.
4. Route transition definitions through animation-manager utilities for consistency.

## Performance Baseline
1. Throttle/normalize scroll updates.
2. Use memoized geometry/materials where possible.
3. Limit shader complexity for first pass.
4. Validate acceptable frame times on desktop target hardware.

## Testing and Validation
1. Unit tests for remap/timeline math.
2. Visual sanity checks for each transition direction.
3. Regression checklist for reverse scroll behavior.
4. Manual checks on desktop breakpoints (mobile later).

## Risks
1. Map library compatibility with overlay/canvas stacking.
2. 3D buildings map provider selection may alter integration details.
3. Shader performance on low-power devices.
4. Scroll container differences between browsers causing progress drift.
