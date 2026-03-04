# Rendering and Shader Specification

## Three Fiber Overlay
Use a persistent `Canvas` overlay for the entire experience so camera/model/shader state is continuous across section boundaries.
Progress source is a custom scroll container in the initial implementation.

## Coordinate and Timeline Conventions
1. Global progress `p` in `[0, 1]`.
2. Section-local progress values:
   - `a = sectionProgress(p, 0.00, 0.30)`
   - `b = sectionProgress(p, 0.30, 0.60)`
   - `c = sectionProgress(p, 0.60, 1.00)`
3. Reverse scroll support:
   - All uniforms and animation weights are pure functions of `p` plus time.
   - No irreversible event toggles.

## Camera and Scene Motion
1. Segment A:
   - Horizontal camera offset from Area 1 framing to Area 2 framing.
2. Segment B:
   - Continue horizontal move from Area 2 framing to Area 3 framing.
3. Segment C:
   - Vertical camera offset to Area 4 framing.
4. Use easing functions that are symmetric when scrubbing backward.

## GLB Model Pipeline
1. Load model with `useGLTF`.
2. Initial model asset: `submarine.glb`.
3. No embedded clip animation dependency in initial pass.
4. Drive model transforms and scene values via animation-manager outputs.

## Animation Manager Specification
Goal: provide declarative transitions reusable across camera, model, and material properties.

Example API direction:
```ts
const horizontalTransition = new Animation(start, end, duration);
```

Behavior contract:
1. Supports deterministic interpolation from normalized segment progress.
2. Supports reverse scrubbing with no one-way side effects.
3. Usable for scalar, vector, and color interpolation.
4. Optional easing, with symmetric behavior when progress is reversed.

## Shader 1: Realistic Water Surface (Area 3)
Target behavior:
1. Multi-wave displacement with combined low and high frequency components.
2. Normals approximated from derivative/neighbor sampling.
3. Fresnel-like edge reflectance and depth tinting.
4. Optional soft specular highlights.

Uniforms (initial target):
1. `uTime`
2. `uProgressGlobal`
3. `uProgressArea3`
4. `uWaveAmpLow`, `uWaveAmpHigh`
5. `uWaveFreqLow`, `uWaveFreqHigh`
6. `uWaterColorDeep`, `uWaterColorShallow`
7. `uFresnelPower`

Scroll mapping:
1. Increase wave amplitude subtly with `b`.
2. Adjust color/clarity as Area 3 becomes centered.
3. Keep behavior reversible with direct mapping from `b`.

## Shader 2: Water Caustics (Area 4)
Target behavior:
1. Animated caustic interference pattern.
2. Light projection feel on a receiving surface.
3. Intensity and scale responsive to Area 4 progress.

Uniforms (initial target):
1. `uTime`
2. `uProgressGlobal`
3. `uProgressArea4`
4. `uCausticScale`
5. `uCausticSpeed`
6. `uCausticIntensity`
7. `uLightColor`

Scroll mapping:
1. `uCausticIntensity` ramps with `c`.
2. `uCausticScale` narrows toward finale for tighter patterning.
3. Optional slight hue shift for finishing emphasis.

## DOM and R3F Synchronization Contract
1. One scroll source computes `p`.
2. DOM section transforms and R3F uniforms read from same `p`.
3. If using `requestAnimationFrame`, store latest `p` in shared state and interpolate only for smoothness, not logic divergence.

## Definition of Done (Rendering)
1. Overlay and content remain aligned across all sections.
2. Both shaders are visible and clearly distinct in Areas 3 and 4.
3. Scene/model transitions are smooth and reversible.
4. No severe frame drops on baseline target hardware during normal scrolling.
