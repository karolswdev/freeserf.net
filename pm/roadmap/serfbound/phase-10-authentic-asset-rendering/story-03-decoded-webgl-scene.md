# SB-10-03 — Render Decoded Sprites in the Browser Scene

- **Project:** serfbound
- **Phase:** 10
- **Status:** done
- **Depends on:** SB-10-02
- **Unblocks:** SB-10-04
- **Owner:** unassigned

## Problem

The app's WebGL2 scene draws flat-colored synthetic triangles regardless of
what the player imported. Once sprites decode and compose, the scene must
actually draw them: terrain from composed triangles, map objects with their
shadows, and the real flag sprite for built structures.

## Scope

- **In:** A decoded-asset scene path in `@serfbound/app`
  (`render-layer-scene.ts`): deterministic height/terrain field, triangle
  placement per the reference walk (apex row/height and mask offsets), map
  objects (trees, stones) with overlay shadows, real flag sprite for built
  structures, a textured WebGL2 render path with one atlas texture, and app
  wiring so import/restore attempt decoding and fall back to the existing
  scene when decoding is unavailable.
- **Out:** Scrolling/viewport movement, original map generator, serfs,
  buildings, waves, pointer-model changes.

## Acceptance criteria

- [x] Importing an archive whose sprites decode renders the decoded scene
  (`data-serfbound-scene-source="dos-pa-decoded"`); non-decodable archives
  (like the CI-generated fixture) keep the current catalog scene and all
  existing browser tests pass unchanged.
- [x] Terrain sprite primitives use composed atlas regions with reference
  placement math (CI unit test on scene structure).
- [x] Built flags render the real `map_object` flag sprite in the decoded
  scene.
- [x] Decoded scene survives reload via the existing IndexedDB restore path.
- [x] `npm test` (data-free) passes; decoded path is exercised in CI through a
  synthetic decodable fixture archive.

## Test plan

- **Unit:** Scene-structure tests over a synthetic decodable archive fixture:
  scene source, sprite primitive counts, atlas region resolution, flag
  primitive presence.
- **Integration / Cypress:** Existing Playwright suites stay green (fallback
  path); a browser test imports a synthetic decodable archive and asserts the
  decoded scene source attribute.
- **Manual / device:** Import real local `SPAU.PA` in preview and observe
  decoded terrain (formalized in SB-10-04).
- **Design handoff:** Screenshot evidence lands in SB-10-04.

## Notes / open questions

- Preserves reference placement: triangle X at `apexX - 16`, Y at
  `20·apexRow - 4·apexHeight + maskOffsetY`, terrain variant selection via the
  SB-10-02 tables.
- Intentionally diverges: the height/terrain field is a deterministic synthetic
  field (original map generator is out of scope this phase); the pointer/tile
  model keeps using the Phase 5 projection.
- Browser boundary: WebGL2 texture upload (`texImage2D`) and textured quads —
  first real texture path in the product.
- .NET reference use: placement math read from `RenderMap.cs`; no reference
  code in the product.
- Phase gate advanced: decoded game art appears on the browser canvas.
