# Evidence — SB-5-02 — Implement Map Projection Transform

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `serfbound/packages/engine/src/index.ts` - adds `MapProjectionTransform`,
  render size/rect types, virtual-screen letterboxing, resize support, rotation
  handling, and shared map/tile/view/screen conversion helpers.
- `serfbound/tests/ci/engine-projection-transform.test.mjs` - covers
  letterboxed screen-to-view conversion, source-style virtual screen rotation,
  resize behavior, fixture-backed map-to-screen conversion, screen-to-map
  conversion, and screen-to-tile lookup.
- `serfbound/packages/engine/README.md` - documents the projection transform
  policy against `Freeserf.Core/Rendering.txt` and `FreeserfNet/GameView.cs`.
- `pm/roadmap/serfbound/phase-5-renderer-projection/story-02-map-projection-transform.md`
  - marks SB-5-02 done and records the shipped primitive.
- `pm/roadmap/serfbound/phase-5-renderer-projection/current-phase-status.md` -
  marks SB-5-02 done, opens SB-5-03 as ready, and checks the projection exit
  criterion.

## Behavior protected

- Projection helpers remain outside DOM-specific code in `@serfbound/engine`.
- Browser screen coordinates can be converted to virtual view coordinates with
  deterministic clipping against the active display rectangle.
- The transform supports viewport resize by returning an equivalent transform
  for the new screen size.
- Renderer and Phase 6 input code can share map, tile, view, and screen
  conversion without duplicating projection math.
- Map/view/tile conversion still flows through the existing fixture-backed
  `MapGeometry` implementation.

## Sources reviewed

- `Freeserf.Core/Rendering.txt`
- `Freeserf.Core/CoordinateSpace.cs`
- `Freeserf.Core/Render/RenderMap.cs`
- `FreeserfNet/GameView.cs`
- `pm/roadmap/serfbound/reference-fixtures/ci/map-geometry-facts.json`
- `pm/roadmap/serfbound/adoption/renderer-api-decision.md`

## Commands and output

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm test && npm run check:boundaries && npm run test:local:assets'
```

Output summary:

```text
29 unit tests passed.
1 chromium browser smoke passed.
serfbound-boundaries-ok
serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
```
