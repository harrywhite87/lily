# Agent Import Manifest

Date: 2026-03-09
Status: Active

## Purpose

This document is the fastest way for an agent to answer three questions:

1. What reusable code exists in this repo?
2. Where does it live?
3. What should be copied and imported into another Nx repo?

## Working rules

- Prefer library entrypoints under `libs/**/src/index.ts`.
- Treat many `apps/web/src/features/**` files as app wrappers, not source of truth.
- If a feature exists both in `apps/web` and `libs`, copy the lib.
- Mirror path aliases from `tsconfig.base.json`.
- Mirror Vite aliases from `apps/web/vite.config.ts`.
- Install shared npm dependencies from `package.json`.
- If the copied code uses SCSS modules, also copy `types/scss-modules/index.d.ts` or provide an equivalent global declaration in the target repo.
- `libs/style-baseline` is a **copy-in reference**, not an importable dependency. Copy its SCSS files into the target app's `styles/` folder. There is no `@lilypad/style-baseline` alias by design.
- `@lilypad/form-elements` components use CSS custom properties from the style-baseline token system. A consuming app overrides the look by defining its own token values — CSS cascade handles the rest.

## Quick lookup by capability

| Need | Preferred import | Copy folders | Notes |
| --- | --- | --- | --- |
| Base style system reference (tokens, reset, typography, themes) | _(copy-in, no alias)_ | `libs/style-baseline` | **Copy** SCSS files into your app's `styles/` folder. Not imported as a dependency. Includes dark + light themes. |
| Form elements (Button, Input, TextArea, Select, Checkbox, Label) | `@lilypad/form-elements` | `libs/ui/form-elements` | Token-driven components. Consuming app overrides styling via its own token values. |
| Fullscreen page shell | `@lilypad/page-layout` | `libs/ui/page-layout` | Generic page wrapper below the nav/header |
| Debug overlay and inspector | `@lilypad/debug` | `libs/shared`, `libs/debug` | Core overlay, scene graph, controls, object inspector |
| Asset browser inside debug overlay | `@lilypad/debug-assets` | `libs/shared`, `libs/debug`, `libs/debug-assets`, `libs/three/assets` | Optional debug plugin |
| Asset registry and material lookups | `@lilypad/three-assets` | `libs/three/assets` | Expects `assets/materials.glb` by default |
| Model upload/runtime | `@lilypad/three-model-runtime` | `libs/shared`, `libs/debug`, `libs/three/model-runtime` | Provider, upload flow, model inspector |
| Water, caustics, build, blueprint, wave effects | `@lilypad/three-effects` | `libs/shared`, `libs/debug`, `libs/three/assets`, `libs/three/model-runtime`, `libs/three/effects` | Page UIs remain app-owned in some cases |
| Scroll-driven submarine scene | `@lilypad/three-scroll-scene` | `libs/shared`, `libs/debug`, `libs/three/assets`, `libs/three/model-runtime`, `libs/three/effects`, `libs/three/scroll-scene`, `libs/scroll`, `libs/animation` | Library-owned scene composition |
| Particle cloud, swarm, morph runtime | `@lilypad/three-particles` | `libs/three/particles` | Core runtime only |
| Interactive path builder page | `@lilypad/three-path-builder` | `libs/shared`, `libs/ui/page-layout`, `libs/debug`, `libs/three/path-builder` | Library-owned page and scene |
| Particle cloud showcase page | `@lilypad/three-particle-cloud-demo` | `libs/shared`, `libs/ui/page-layout`, `libs/debug`, `libs/three/particles`, `libs/three/particle-cloud-demo` | Defaults to `submarine.glb` |
| Swarm showcase page | `@lilypad/three-swarm-demo` | `libs/ui/page-layout`, `libs/three/particles`, `libs/three/swarm-demo` | Defaults to `submarine.glb` |
| Battleboard page | `@lilypad/three-battleboard` | `libs/ui/page-layout`, `libs/three/battleboard` | Defaults to `Table.glb` |
| Particles morph workbench page | `@lilypad/three-particles-workbench` | `libs/shared`, `libs/ui/page-layout`, `libs/debug`, `libs/three/particles`, `libs/three/particles-workbench` | Supports custom `assetBaseUrl` and preset overrides |

## Library registry

| Import id | Entry file | Folder to copy | Useful exports | Companion libs | Asset expectations |
| --- | --- | --- | --- | --- | --- |
| _(style-baseline)_ | _(copy-in, no entry)_ | `libs/style-baseline` | `reset.scss`, `tokens.scss`, `theme-dark.scss`, `theme-light.scss`, `typography.scss`, `globals.scss`, `example.module.scss` | none | none |
| `@lilypad/form-elements` | `libs/ui/form-elements/src/index.ts` | `libs/ui/form-elements` | `Button`, `Input`, `TextArea`, `Select`, `Checkbox`, `Label` | style-baseline (copy-in for token overrides) | none |
| `@lilypad/shared` | `libs/shared/src/index.ts` | `libs/shared` | Inspector field contracts, shared helpers | none | none |
| `@lilypad/page-layout` | `libs/ui/page-layout/src/index.ts` | `libs/ui/page-layout` | `PageLayout` | none | none |
| `@lilypad/debug` | `libs/debug/src/index.ts` | `libs/debug` | `DebugOverlay`, `useDebugControls`, `useDebugStore`, `useObjectInspectorSurface` | `libs/shared` | none |
| `@lilypad/debug-assets` | `libs/debug-assets/src/index.ts` | `libs/debug-assets` | `AssetsPlugin` | `libs/debug`, `libs/three/assets` | none directly |
| `@lilypad/three-assets` | `libs/three/assets/src/index.ts` | `libs/three/assets` | `AssetRegistryProvider`, `useAssetRegistry`, `AssetManager` | none | `assets/materials.glb` by default |
| `@lilypad/three-model-runtime` | `libs/three/model-runtime/src/index.ts` | `libs/three/model-runtime` | `ModelProvider`, `useModel`, `useModelUpload`, `ModelInspector` | `libs/debug` | default model URL is still repo-oriented unless overridden |
| `@lilypad/three-effects` | `libs/three/effects/src/index.ts` | `libs/three/effects` | `WaterSurface`, `Caustics`, `SkyDome`, `BuildSubmarine`, `BlueprintSubmarine`, `WaveSubmarine` | `libs/three/assets`, `libs/three/model-runtime`, `libs/debug`, `libs/scroll` | model and material assets depend on composition |
| `@lilypad/three-scroll-scene` | `libs/three/scroll-scene/src/index.ts` | `libs/three/scroll-scene` | `SceneOverlay`, `CameraRig`, `Lighting`, `Submarine` | `libs/three/effects`, `libs/three/model-runtime`, `libs/debug`, `libs/scroll`, `libs/animation` | submarine/model assets depend on provider setup |
| `@lilypad/three-particles` | `libs/three/particles/src/index.ts` | `libs/three/particles` | `ParticleCloud`, `Swarm`, `ParticlesMorph`, geometry helpers | `libs/shared` for inspector types | none |
| `@lilypad/three-path-builder` | `libs/three/path-builder/src/index.ts` | `libs/three/path-builder` | `PathBuilderPage`, `PathBuilderScene`, `usePathBuilder`, `PathMarkers`, `PathLine` | `libs/ui/page-layout`, `libs/debug` | none |
| `@lilypad/three-particle-cloud-demo` | `libs/three/particle-cloud-demo/src/index.ts` | `libs/three/particle-cloud-demo` | `ParticleCloudDemoPage`, `ParticleCloudDemoScene`, `useParticleCloudInspector` | `libs/ui/page-layout`, `libs/debug`, `libs/three/particles` | defaults to `submarine.glb`, overrideable via props |
| `@lilypad/three-swarm-demo` | `libs/three/swarm-demo/src/index.ts` | `libs/three/swarm-demo` | `SwarmDemoPage`, `SwarmDemoScene` | `libs/ui/page-layout`, `libs/three/particles` | defaults to `submarine.glb`, overrideable via props |
| `@lilypad/three-battleboard` | `libs/three/battleboard/src/index.ts` | `libs/three/battleboard` | `BattleboardPage`, `BattleboardScene`, `DEFAULT_BATTLEBOARD_TARGETS`, `toBattleboardWorld` | `libs/ui/page-layout` | defaults to `Table.glb`, overrideable via props |
| `@lilypad/three-particles-workbench` | `libs/three/particles-workbench/src/index.ts` | `libs/three/particles-workbench` | `ParticlesPage`, `GLBGeometryLoader`, `MeshPreviews`, `TransformGizmo`, preset constants | `libs/ui/page-layout`, `libs/debug`, `libs/three/particles` | default presets reference `submarine.glb`, `Table.glb`, and `shipyard.glb`; all overrideable |

## Route and page manifest

Use this table to decide whether to copy an app page, a lib, or both.

| Route | App file | Status | Preferred source of truth | Notes |
| --- | --- | --- | --- | --- |
| `/model-loader` | `apps/web/src/features/model-loader/ModelLoaderPage.tsx` | app-owned page | page is app-owned, runtime is `@lilypad/three-model-runtime` | Composes model runtime, debug overlay, assets plugin, and route navigation |
| `/caustics` | `apps/web/src/features/caustics-page/CausticsPage.tsx` | app-owned config page | page is app-owned, effect is `@lilypad/three-effects` | Uses `ShaderConfigContext` for import/export/reset |
| `/water` | `apps/web/src/features/water-page/WaterPage.tsx` | app-owned config page | page is app-owned, effects are `@lilypad/three-effects` | Uses `ShaderConfigContext` and app-local water config UI |
| `/blueprint` | `apps/web/src/features/blueprint-page/BlueprintPage.tsx` | app-owned composition page | effect is `@lilypad/three-effects` | Thin page around `BlueprintSubmarine` |
| `/build` | `apps/web/src/features/build-page/BuildPage.tsx` | app-owned composition page | effect is `@lilypad/three-effects` | Thin page around `BuildSubmarine` |
| `/particles` | `apps/web/src/features/particles-page/ParticlesPage.tsx` | wrapper | `@lilypad/three-particles-workbench` | App file is a re-export wrapper |
| `/path-builder` | `apps/web/src/features/path-builder/PathBuilderPage.tsx` | wrapper | `@lilypad/three-path-builder` | App files in `path-builder/` are wrappers |
| `/shipyard` | `apps/web/src/features/shipyard/ShipyardPage.tsx` | app-owned composition page | page is app-owned | Uses asset registry + debug plugin, fixed camera preset, and `shipyard.glb` |
| `/battleboard` | `apps/web/src/features/battleboard/BattleboardPage.tsx` | wrapper | `@lilypad/three-battleboard` | App file is a re-export wrapper |
| `/particle-clouds` | `apps/web/src/features/particle-cloud-demo/ParticleCloudDemoPage.tsx` | wrapper | `@lilypad/three-particle-cloud-demo` | App file is a re-export wrapper |
| `/swarm` | `apps/web/src/features/swarm-demo/SwarmDemoPage.tsx` | wrapper | `@lilypad/three-swarm-demo` | App file is a re-export wrapper |

## Important app-owned support files

These are still useful, but they are not yet extracted into standalone libs.

| File | Purpose | When to copy |
| --- | --- | --- |
| `apps/web/src/features/config/ShaderConfigContext.tsx` | Water and caustics config persistence, import/export, reset defaults | Copy if you want the exact water/caustics page behavior |
| `apps/web/src/features/model-loader/ModelLoaderPage.tsx` | Route-level model upload page composition and navigation | Copy if you want the exact model-loader page, not just the runtime |
| `apps/web/src/features/shipyard/ShipyardPage.tsx` | Route-level shipyard viewer composition | Copy if you want the exact shipyard page and camera setup |
| `apps/web/src/router.ts` | Route registry for the demo app | Copy only if you want the same route surface |

## Asset notes

These are the default static asset expectations baked into reusable code:

- `@lilypad/three-assets` expects `assets/materials.glb`.
- `@lilypad/three-particle-cloud-demo` defaults to `submarine.glb`.
- `@lilypad/three-swarm-demo` defaults to `submarine.glb`.
- `@lilypad/three-battleboard` defaults to `Table.glb`.
- `@lilypad/three-particles-workbench` default presets reference `submarine.glb`, `Table.glb`, and `shipyard.glb`.

When possible, prefer prop-based overrides over copying asset path assumptions verbatim.

## Import and copy checklist

1. Copy the library folders listed for the capability you want.
2. Copy `project.json`, `tsconfig.json`, and `vite.config.ts` with the library.
3. Mirror aliases from `tsconfig.base.json`.
4. Mirror aliases from `apps/web/vite.config.ts` if the target app uses Vite.
5. Add missing npm dependencies from `package.json`.
6. Copy any required static assets or override the asset URL props/constants.
7. Add a global `*.module.scss` declaration if the target repo does not already have one.
8. For styling foundations, copy `libs/style-baseline/src/` files into the target app's `styles/` folder and import `globals.scss` once from the app entry point. Adjust token values to taste.
9. If using `@lilypad/form-elements`, ensure the consuming app defines the style-baseline tokens (or equivalent CSS custom properties) so components pick up the correct look via CSS cascade.

## Search tips for agents

- Start with `libs/**/src/index.ts`.
- If you find a feature page under `apps/web/src/features/**`, check this manifest before copying it.
- For exact route behavior, inspect `apps/web/src/router.ts` and the corresponding app page.
- For reusable runtime behavior, prefer the lib entrypoint over the app page.
