# Open Questions and Decision Log

## Open Questions
1. Map provider:
   - Choose concrete 3D buildings provider for Area 1 (options to evaluate: Mapbox, Cesium, MapLibre + 3D tiles pipeline).
2. Native scroll timing:
   - When to run custom-container vs native-scroll comparison.
3. GLB licensing/source metadata:
   - Record provenance and usage rights for `submarine.glb`.

## Proposed Initial Decisions
1. Use TypeScript for maintainability of scene math and shader uniforms.
2. Keep one global progress value as source of truth.
3. Favor deterministic math-driven state over timeline-trigger callbacks.
4. Start with lightweight shader complexity, then scale up if performance allows.
5. Keep desktop as primary target for this demo iteration.

## Decision Log
Use this section to record confirmed choices as implementation begins.

| Date (YYYY-MM-DD) | Topic | Decision | Owner |
|---|---|---|---|
| 2026-02-24 | Planning docs baseline | Initial spec pack created before coding | Team |
| 2026-02-24 | Package management | Single root `package.json`; no workspaces; projects under `apps/` and `libs/` with `project.json` | Team |
| 2026-02-24 | Scroll source | Start with custom scroll container; evaluate native scroll later | Team |
| 2026-02-24 | GLB asset | Use `submarine.glb` with no embedded clip animation dependency initially | Team |
| 2026-02-24 | Visual direction | Neutral styling with navy nautical tone | Team |
