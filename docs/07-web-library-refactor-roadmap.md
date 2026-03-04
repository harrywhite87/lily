# Web Library Refactor Roadmap (Assets First, Particles ASAP)

Date: 2026-03-03  
Status: Proposed

## Purpose

This document captures the recommended refactor plan for `apps/web` and `libs/*`, with explicit execution priority:

1. Build shared asset infrastructure first.
2. Extract the particle view into a reusable transition component immediately after.
3. Continue the broader library split once those two are in place.

## Why this order

- The particle transition component needs shared asset loading, caching, and lifecycle controls.
- Asset infrastructure is useful across shaders, model tools, debug tooling, and future scenes.
- Doing particles second gives a quick product win while creating reusable architecture, not another page-local feature.

## Current issues (summary)

- `libs/debug` is imported as `@lilypad/debug` but has no Nx `project.json`.
- Typecheck and test guardrails are currently unreliable for large refactors.
- Asset loading from `materials.glb` is duplicated across debug and shader features.
- Particle logic is page-local (`features/particles-page`) and not reusable.
- Debug package currently mixes multiple concerns (overlay shell, controls, R3F adapters, asset manager).
- Shader config types are coupled to shader component files.

## Priority roadmap

## Phase 0 - Foundation guardrails (short, first)

Goal: make refactors safe and measurable.

- Add `libs/debug/project.json` and register it as an Nx project.
- Fix TypeScript project-reference errors in `apps/web` config.
- Stabilize workspace typecheck and test commands.
- Add/align lint config for project boundary enforcement (Nx tags + module boundaries).

Done criteria:

- `npx nx show projects` includes `debug`.
- `npx nx run-many -t typecheck` completes successfully.
- `npx nx run-many -t test` is green, or `web:test` is intentionally configured to allow no tests.

## Phase 1 - Shared asset runtime (must be first)

Goal: move asset ownership out of debug and make assets available anywhere.

Create new library:

- `libs/three/assets` (or `libs/runtime/assets`)

Core responsibilities:

- Register and query assets by id, type, tags.
- Support sources: builtin, url, file.
- Lazy load and cache runtime resources.
- Track references and dispose safely.
- Manage blob URL lifecycle centrally.
- Provide app-wide access through a provider/hook.

Proposed API:

```ts
type AssetType = 'model' | 'texture' | 'material' | 'geometry' | 'primitive';

type AssetDescriptor = {
  id: string;
  name: string;
  type: AssetType;
  tags?: string[];
  source: { kind: 'builtin' } | { kind: 'url'; url: string } | { kind: 'file'; file: File };
};

interface AssetRegistry {
  register(asset: AssetDescriptor): void;
  unregister(id: string): void;
  list(filter?: { type?: AssetType; tags?: string[] }): AssetDescriptor[];
  load<T = unknown>(id: string): Promise<T>;
  retain(id: string): void;
  release(id: string): void;
}
```

Integration:

- Add `<AssetRegistryProvider>` in `apps/web/src/main.tsx`.
- Refactor debug asset panel to use this registry instead of owning asset state.
- Move `materials.glb` discovery and texture/material extraction into this library.

Done criteria:

- Assets can be registered and loaded from any feature/page via `useAssetRegistry()`.
- No duplicate `materials.glb` loading logic remains in shader/debug pages.
- File asset cleanup is automatic when released/unregistered.

## Phase 2 - Particle transition library (ASAP after assets)

Goal: turn particles into a reusable feature component that accepts meshes and triggers transitions.

Create new library:

- `libs/three/particles`

Extract from current page implementation:

- `ParticlesMorph.tsx`
- Geometry extraction/sampling helpers
- Transition control flow

Proposed public API:

```ts
type MeshSource = THREE.BufferGeometry | THREE.Object3D | string; // URL or asset id via adapter

type TransitionRequest = {
  from: MeshSource;
  to: MeshSource;
  durationMs?: number;
  easing?: (t: number) => number;
};

type ParticleMorphHandle = {
  transition: (req: TransitionRequest) => Promise<void>;
  setProgress: (p: number) => void;
};
```

Example usage target:

```tsx
<ParticleMorphTransition
  ref={morphRef}
  from={sourceA}
  to={sourceB}
  count={70000}
  pointSize={2.4}
  autoPlay={false}
/>
```

Integration requirements:

- Accept asset ids through a small adapter to the Phase 1 registry.
- Keep controlled mode (`progress`) and imperative mode (`transition()`).
- Keep optional wireframe preview/gizmo controls as an extension layer, not core API.

Done criteria:

- `ParticlesPage` consumes `@lilypad/three-particles` without page-local morph internals.
- At least one other scene/page can trigger a particle transition with shared assets.
- Add unit tests for geometry sampling and transition state logic.

## Phase 3 - Debug package decoupling

Goal: make debug tooling modular and consume shared runtimes.

Split `libs/debug` into internal modules:

- `debug-core` (overlay shell, panel/plugin system)
- `debug-controls` (schema + control store + widgets)
- `debug-r3f` (metrics adapter, selection, gizmo)
- `debug-assets-ui` (asset panel plugin only)

Compatibility:

- Keep `@lilypad/debug` as facade exports to avoid immediate app breakage.

Done criteria:

- Asset ownership is no longer in debug runtime.
- Debug can be mounted with or without asset panel plugin.

## Phase 4 - Domain/rendering extraction

Goal: move heavy web feature logic into focused reusable libs.

Recommended libraries:

- `libs/three/model-runtime`
  - model context/provider
  - upload lifecycle
  - clone/inspect helpers
- `libs/three/effects`
  - `WaterSurface`, `Caustics`, `BuildSubmarine`, `BlueprintSubmarine`
  - uniform types/defaults
- `libs/domain/scroll-scene`
  - `CameraRig`, `Lighting`, `Submarine`, `SceneOverlay`

Done criteria:

- `apps/web` becomes composition-first (routing + feature assembly).
- Cross-feature relative imports (`../shaders`, `../model-loader`, `../config`) are replaced by library imports.

## Phase 5 - Scroll and boundaries hardening

Goal: improve long-term maintainability.

- Decide if `libs/scroll` stays generic or becomes domain-specific.
- Enforce tags and import constraints in Nx (`scope:app`, `scope:three`, `scope:domain`, `scope:debug`).
- Add integration tests around scroll-segment behavior and shader-config persistence.

## Migration map (initial)

- `apps/web/src/features/particles-page/ParticlesMorph.tsx` -> `libs/three/particles/src/ParticleMorphTransition.tsx`
- `apps/web/src/features/particles-page/ParticlesPage.tsx` -> keep page, consume new particles lib
- `libs/debug/src/assets/*` state/runtime -> `libs/three/assets` runtime
- `libs/debug/src/assets/AssetsPanel.tsx` -> keep as debug UI plugin backed by shared asset registry
- `apps/web/src/features/shaders/*` material asset extraction -> shared asset runtime service

## Acceptance checklist

- Asset registry is app-global and used by debug + shaders + particles.
- Particle transitions are callable as reusable component API.
- `libs/debug` is an Nx project and no longer owns global asset state.
- `apps/web` has thinner feature pages and fewer cross-feature relative imports.
- CI-quality commands are stable for typecheck/test.

## Suggested implementation sequence (fast path)

1. Phase 0 foundation fixes.
2. Phase 1 shared asset runtime and wiring.
3. Phase 2 particle library extraction and page migration.
4. Phase 3 debug decoupling.
5. Phase 4 and 5 incremental extraction/hardening.

This sequence preserves momentum on the particle objective while preventing another isolated implementation.
