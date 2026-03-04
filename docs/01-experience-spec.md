# Experience and Interaction Spec

## Experience Structure
The demo is a four-area narrative with explicit directional transitions:

1. Area 1: Intro + Map
2. Area 2: Transitional content block
3. Area 3: Water surface showcase
4. Area 4: Caustics showcase and closing content

## Scroll Model
Use a normalized master progress value `p` in `[0, 1]` driven by scroll position.
Initial implementation uses a custom scroll container as the scroll source (native page scroll can be evaluated later).

Suggested segment allocation:
1. Segment A (`0.00 - 0.30`): Area 1 to Area 2 horizontal move.
2. Segment B (`0.30 - 0.60`): Area 2 to Area 3 horizontal move.
3. Segment C (`0.60 - 1.00`): Area 3 to Area 4 vertical move.

Each segment should expose local progress:
- `a = remap(p, 0.00, 0.30)`
- `b = remap(p, 0.30, 0.60)`
- `c = remap(p, 0.60, 1.00)`

All visual effects should read these values directly so reverse scrolling naturally rewinds state.

## Area Specs

## Visual Direction
Use a neutral visual base with a subtle navy-blue nautical tone.

## Area 1 (Intro + Map)
1. Purpose: establish spatial context and visual tone.
2. Content:
   - Hero heading and short intro copy (lorem ipsum for now).
   - Embedded 3D buildings map block (provider TBD).
3. Behavior:
   - Initial overlay camera/model idle state.
   - Transition out by horizontal movement tied to segment A.

## Area 2 (Transition Zone)
1. Purpose: bridge from map narrative to water narrative.
2. Content:
   - Secondary headline and body copy (lorem ipsum).
   - Optional callout cards to indicate progression.
3. Behavior:
   - Enter/exit via horizontal translation.
   - Continue subtle scene transition state changes.

## Area 3 (Water Surface)
1. Purpose: demonstrate realistic water surface shader.
2. Content:
   - Section copy (lorem ipsum).
   - Canvas region where shader is clearly visible.
3. Behavior:
   - Water shader parameters react continuously to scroll and time.
   - Transition toward Area 4 begins as vertical motion in segment C.

## Area 4 (Water Caustics)
1. Purpose: demonstrate caustics shader and close the demo.
2. Content:
   - Section copy (lorem ipsum).
   - Highlight panel describing caustic effect.
3. Behavior:
   - Vertical transition complete.
   - Caustics intensity and pattern evolve with local segment C progress.

## GLB and Scene Transition Control
Initial model integration uses `submarine.glb` without embedded animation clips.
Scene motion is handled by a dedicated animation manager that interpolates transforms/material values from progress.

Example API shape (target intent):
```ts
const horizontalTransition = new Animation(start, end, duration);
```

Behavior requirements:
1. Animation definitions are pure configuration plus deterministic update logic.
2. Every transition can be scrubbed forward and backward without drift.
3. Timelines may be keyed to segment-local progress (`a`, `b`, `c`) rather than absolute time.

## Accessibility and UX Baseline
1. Preserve readable contrast and text hierarchy.
2. Ensure keyboard focus order remains logical through sections.
3. Provide reduced motion fallback for non-essential effects.
4. Keep scroll behavior stable on desktop viewport sizes (mobile deferred).

## Acceptance Criteria
1. Direction changes match spec exactly (H, H, then V).
2. Scrubbing backward returns all elements to prior states correctly.
3. No state drift between DOM section position and Three.js overlay state.
