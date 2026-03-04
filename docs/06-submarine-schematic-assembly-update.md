# Submarine Schematic-to-Assembly Update Plan

## Change Summary
Introduce a new starting scroll section where the submarine appears as four separated, rotated parts, then reassembles during transition from scroll section 1 to section 2.

Model now contains four distinct parts:
1. `Submarine Section 1`
2. `Submarine Section 2`
3. `Submarine Section 3`
4. `Submarine Section 4`

## Target Visual Behavior
In the new first scroll section:
1. All four sections are spatially separated (exploded layout).
2. Sections 1 and 2 are rotated on Z by `-90deg`.
3. Sections 3 and 4 are rotated on Z by `+90deg`.

During transition from scroll section 1 to section 2:
1. All four sections move from exploded offsets toward assembled positions.
2. All four sections rotate toward `0deg` on Z.
3. Final state at section 2 start is a complete assembled submarine.

## Scope Impact
1. Adds a new scroll section at the beginning of the experience.
2. Adds a new transition phase for model-part orchestration.
3. Requires progress/timeline remap updates for all existing downstream sections.

## Implementation Tasks

## A. Content and Scroll Structure
1. Add new leading content section in DOM (`Section 1: Schematic Intro`).
2. Shift existing sections by one index (old 1..4 becomes new 2..5).
3. Update scroll container height/track sizing for one additional section.
4. Update section labels/copy placeholders to match new order.

## B. Progress Segmentation
1. Add a new segment for schematic-to-assembly transition (`s01`).
2. Recompute global segment ranges so old transitions still occur in correct order.
3. Ensure segment remap helpers expose stable local progress for:
   - `s01`: new section 1 to 2 assembly.
   - Existing transitions (now shifted by one section index).
4. Update any hardcoded segment boundaries in DOM and R3F layers.

## C. GLB Node Binding
1. Confirm node names are exactly:
   - `Submarine Section 1`
   - `Submarine Section 2`
   - `Submarine Section 3`
   - `Submarine Section 4`
2. Build a robust lookup map from node name to mesh/object reference.
3. Add fallback logging for missing node names to catch export changes quickly.

## D. Initial and Final Transforms
1. Define canonical assembled transforms (`assembledPose`) for all 4 sections.
2. Define exploded transforms (`schematicPose`) for all 4 sections:
   - Section 1: separated offset + `rotation.z = -90deg`
   - Section 2: separated offset + `rotation.z = -90deg`
   - Section 3: separated offset + `rotation.z = +90deg`
   - Section 4: separated offset + `rotation.z = +90deg`
3. Store transforms in one config object to avoid scene-logic duplication.
4. Verify offsets preserve left-to-right read as one submarine when assembled.

## E. Animation Manager Integration
1. Add transition definitions for position and rotation interpolation per section.
2. Bind transition inputs to local segment progress (`s01`) instead of time-only playback.
3. Ensure interpolation is deterministic and reversible.
4. Apply easing only if it remains symmetric when scroll direction reverses.

Example target API usage:
```ts
const s1ToS2Assembly = new Animation(schematicPose, assembledPose, duration);
```

## F. Scene Orchestration Rules
1. At section 1 rest state (`s01 = 0`), force full schematicPose values.
2. During transition (`0 < s01 < 1`), blend all four parts continuously.
3. At section 2 rest state (`s01 = 1`), force full assembledPose values.
4. Keep camera/content transitions synchronized with the same segment progress source.

## G. Styling and Narrative Support
1. Add section-1 copy framing the schematic/blueprint concept.
2. Keep styling neutral with navy nautical tone.
3. Optionally add subtle wireframe/technical-overlay treatment in section 1.

## H. Regression and Validation
1. Forward scroll test: parts rotate and converge correctly.
2. Reverse scroll test: assembled submarine cleanly returns to exploded schematic.
3. Drift test: repeated forward/backward scrubbing does not accumulate transform error.
4. Node-rename test: missing section names produce clear diagnostics.
5. Desktop performance test: transition remains smooth at target frame rate.

## Acceptance Criteria
1. New section appears at beginning of scroll experience.
2. Section 1 state shows four separated parts with required Z rotations:
   - Sections 1/2 at `-90deg`
   - Sections 3/4 at `+90deg`
3. Transition from section 1 to 2 fully reassembles submarine and resets rotations to `0deg`.
4. Behavior is fully reversible with no one-way animation artifacts.
5. Existing downstream sections still function after index/segment shift.

## Suggested Execution Order
1. Implement section and segment changes first.
2. Add node lookup and transform config.
3. Integrate animation-manager transition bindings.
4. Tune offsets/easing visually.
5. Run regression checklist.

