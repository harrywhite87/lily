# Library Portability Map

Date: 2026-03-07
Status: Active

## Goal

Make the reusable 3D/runtime code copyable between Nx repos as library folders, with only:

- path alias wiring
- project registration
- shared package dependencies

## Library units

### `@lilypad/shared`

Purpose:

- generic math helpers
- object-inspector field/surface contracts

Copy when:

- you want inspector field types without the full debug overlay

### `@lilypad/page-layout`

Purpose:

- fullscreen page shell below the app nav
- shared background/layout wrapper for demo and tool pages

Depends on:

- `react`

### `@lilypad/debug`

Purpose:

- debug overlay shell
- scene graph + metrics panels
- object inspector surface registration
- transform gizmo and R3F adapter

Depends on:

- `@lilypad/shared`
- `react`
- `three`
- `@react-three/fiber`
- `@react-three/drei`
- `zustand`

Copy when:

- you want the inspector/debug overlay in another R3F app

### `@lilypad/debug-assets`

Purpose:

- optional Assets panel plugin for the debug overlay

Depends on:

- `@lilypad/debug`
- `@lilypad/three-assets`

Copy when:

- you want the asset browser/spawn panel inside the debug overlay

### `@lilypad/three-assets`

Purpose:

- shared asset registry provider
- runtime asset loading/cache
- material texture lookup helpers

Depends on:

- `react`
- `three`
- `zustand`

### `@lilypad/three-particles`

Purpose:

- particle cloud runtime
- swarm runtime
- morph runtime

Depends on:

- `react`
- `three`
- `@react-three/fiber`
- `@react-three/drei`

### `@lilypad/three-path-builder`

Purpose:

- interactive path builder page/scene
- draggable point markers and line rendering
- debug-control backed point editor

Depends on:

- `@lilypad/page-layout`
- `@lilypad/debug`
- `react`
- `three`
- `@react-three/fiber`
- `@react-three/drei`

### `@lilypad/three-particle-cloud-demo`

Purpose:

- particle cloud showcase page/scene
- inspector-backed particle cloud tuning hook

Depends on:

- `@lilypad/page-layout`
- `@lilypad/debug`
- `@lilypad/three-particles`
- `react`
- `three`
- `@react-three/fiber`
- `@react-three/drei`

### `@lilypad/three-swarm-demo`

Purpose:

- orbital swarm showcase page/scene

Depends on:

- `@lilypad/page-layout`
- `@lilypad/three-particles`
- `react`
- `three`
- `@react-three/fiber`
- `@react-three/drei`

### `@lilypad/three-battleboard`

Purpose:

- holographic battleboard page/scene
- reusable target definitions and world-space helpers

Depends on:

- `@lilypad/page-layout`
- `react`
- `three`
- `@react-three/fiber`
- `@react-three/drei`

### `@lilypad/three-particles-workbench`

Purpose:

- particles morph workbench page
- GLB geometry loader, transform gizmo, and mesh preview helpers

Depends on:

- `@lilypad/page-layout`
- `@lilypad/debug`
- `@lilypad/three-particles`
- `react`
- `three`
- `@react-three/fiber`
- `@react-three/drei`

### `@lilypad/three-model-runtime`

Purpose:

- model provider/context
- upload lifecycle
- model metrics + inspector helpers

Depends on:

- `@react-three/drei`
- `@lilypad/debug`

### `@lilypad/three-effects`

Purpose:

- `WaterSurface`
- `Caustics`
- `SkyDome`
- `BuildSubmarine`
- `BlueprintSubmarine`
- `WaveSubmarine`

Depends on:

- `@lilypad/three-assets`
- `@lilypad/three-model-runtime`
- `@lilypad/debug`
- `@lilypad/scroll`
- `three`
- `@react-three/fiber`
- `@react-three/drei`

### `@lilypad/three-scroll-scene`

Purpose:

- scroll-driven scene composition
- camera rig
- shared lighting
- submarine assembly runtime
- library-owned scene overlay

Depends on:

- `@lilypad/three-effects`
- `@lilypad/three-model-runtime`
- `@lilypad/debug`
- `@lilypad/scroll`
- `@lilypad/animation`

## Copy bundles

### Inspector only

Copy:

- `libs/shared`
- `libs/ui/page-layout`
- `libs/debug`

### Inspector plus asset panel

Copy:

- `libs/shared`
- `libs/ui/page-layout`
- `libs/debug`
- `libs/debug-assets`
- `libs/three/assets`

### Model tools

Copy:

- `libs/shared`
- `libs/debug`
- `libs/three/model-runtime`

### Path builder page

Copy:

- `libs/shared`
- `libs/ui/page-layout`
- `libs/debug`
- `libs/three/path-builder`

### Particle cloud demo page

Copy:

- `libs/shared`
- `libs/ui/page-layout`
- `libs/debug`
- `libs/three/particles`
- `libs/three/particle-cloud-demo`

### Swarm demo page

Copy:

- `libs/ui/page-layout`
- `libs/three/particles`
- `libs/three/swarm-demo`

### Battleboard page

Copy:

- `libs/ui/page-layout`
- `libs/three/battleboard`

### Particles workbench page

Copy:

- `libs/shared`
- `libs/ui/page-layout`
- `libs/debug`
- `libs/three/particles`
- `libs/three/particles-workbench`

### Water/build/blueprint effects

Copy:

- `libs/shared`
- `libs/debug`
- `libs/three/assets`
- `libs/three/model-runtime`
- `libs/three/effects`

### Full scroll scene

Copy:

- `libs/shared`
- `libs/debug`
- `libs/three/assets`
- `libs/three/model-runtime`
- `libs/three/effects`
- `libs/three/scroll-scene`
- `libs/scroll`
- `libs/animation`

## Notes

- `apps/web/src/features/**` now keeps thin compatibility wrappers where the implementation moved into libraries.
- The remaining app page files for path builder, clouds, swarm, battleboard, and particles are wrappers over library-owned implementations.
- `zustand` is now an explicit workspace dependency because `debug` and `three-assets` use it directly.
- To transplant these libraries into another Nx repo, mirror the path aliases from `tsconfig.base.json` and the Vite aliases from `apps/web/vite.config.ts`.
