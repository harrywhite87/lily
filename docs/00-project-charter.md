# Project Charter

## Working Name
Lilypad Scroll Demo

## Purpose
Build a single demo experience that showcases advanced scroll choreography, a React + Three.js overlay pipeline, and shader-driven water visuals inside an Nx monorepo.

## Core Vision
The page should feel like one continuous interactive sequence with deterministic forward and reverse behavior (no one-way timeline tricks).

## In Scope
1. Nx monorepo with `project.json` project configuration style.
2. Single root `package.json` for all dependencies/scripts.
3. No npm/yarn/pnpm workspaces.
4. Repo structure uses `apps/` and `libs/` directories, with `project.json` in each app/lib.
5. Frontend app using React + Vite + SCSS Modules.
6. Four distinct content areas with these transitions:
   - Area 1 to Area 2: horizontal scroll progression.
   - Area 2 to Area 3: horizontal scroll progression.
   - Area 3 to Area 4: vertical scroll progression.
7. Placeholder prose/content using lorem ipsum.
8. Three Fiber overlay synchronized to scroll in both directions.
9. Two custom shader materials:
   - Area 3: realistic water surface.
   - Area 4: water caustics.
10. Area 1 includes a 3D buildings map view (provider TBD).
11. Load `.glb` model `submarine.glb` (no embedded animation clips required in initial pass).
12. Scene transition animation manager for developer-defined animations (progress-driven, reversible).

## Out of Scope (Initial Demo)
1. Production CMS integration.
2. Backend APIs and auth.
3. Final art direction and final content copy.
4. Full mobile optimization pass (desktop-first demo target).

## Success Criteria
1. All four areas render and transition in the specified directions.
2. Scroll motion is reversible without desync for camera, shaders, model transitions, and UI states.
3. The map, GLB model, and both shader effects are visible in the intended areas.
4. Project can be run from the repo root with a documented dev command.
5. Animation manager API can define transitions with deterministic forward/reverse playback.

## Key Constraints
1. Visual transitions must map to scroll progress, not fire-and-forget animations.
2. Interaction model must support precise scrubbing both forward and backward.
3. Architecture should remain easy to extend into additional scenes/effects.
