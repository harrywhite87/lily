# Delivery Plan and Milestones

## Phase 0: Repo and Tooling Setup
1. Initialize Nx repo with single root `package.json`.
2. Create `apps/web` using React + Vite + SCSS Modules.
3. Establish `apps/` and `libs/` layout with `project.json` per project.
4. Add baseline lint/typecheck/test scripts.
5. Define root and project-level run/build commands.

Exit criteria:
1. App boots locally.
2. Nx task graph runs for lint/build/test targets.

## Phase 1: Scroll Framework and Content Skeleton
1. Build four section layout with lorem ipsum content.
2. Implement custom scroll container with normalized progress and segment remapping.
3. Wire directional transitions (H, H, V) in DOM layer first.

Exit criteria:
1. Directional transitions match spec.
2. Reverse scroll restores exact prior layout states.

## Phase 2: Three Fiber Overlay Foundation
1. Add persistent canvas overlay and scene scaffolding.
2. Connect camera and scene transforms to shared progress state.
3. Validate DOM/overlay synchronization.

Exit criteria:
1. Overlay transitions stay in lockstep with sections.
2. No visible desync in forward or backward scrolling.

## Phase 3: GLB and Animation Control
1. Integrate `submarine.glb` loading pipeline.
2. Build animation manager primitives for scene transition control.
3. Tune transition curves for deterministic forward/reverse scrubbing.

Exit criteria:
1. Distinct scene transition states are visible across progression.
2. Reverse scrubbing cleanly rewinds transition states.

## Phase 4: Shader Implementation
1. Implement Area 3 water surface shader.
2. Implement Area 4 caustics shader.
3. Map uniforms to section-local progress and tune art direction.

Exit criteria:
1. Water surface and caustics are visually distinct and stable.
2. Shader behavior remains deterministic when scrubbing.

## Phase 5: Polish and Hardening
1. Apply neutral navy nautical visual direction and UX polish.
2. Add reduced-motion handling.
3. Test desktop behavior and performance.
4. Document run instructions and architecture notes.

Exit criteria:
1. Demo is presentable and reproducible with clear startup docs.
2. Core interactions work on baseline target devices.

## Phase 6: Optional Native Scroll Evaluation
1. Replace custom container with native scroll source behind an adapter.
2. Compare behavior parity and implementation complexity.

Exit criteria:
1. Clear decision: keep custom container or switch to native scroll.

## Delivery Checklist
1. Setup docs and architecture docs committed.
2. Reproducible local run command.
3. Known issues and next steps logged.
