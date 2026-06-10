# SB-10-02 — Compose Terrain Triangles into a Texture Atlas

- **Project:** serfbound
- **Phase:** 10
- **Status:** done
- **Depends on:** SB-10-01
- **Unblocks:** SB-10-03
- **Owner:** unassigned

## Problem

Settlers terrain is not drawn from whole tiles: each map cell is two triangles,
each cut from a 32x21 ground sprite by one of 81 up/down mask sprites selected
from vertex height differences. Without the reference mask tables and the
ground-repeat composition rule, decoded sprites cannot become terrain. The
rules live in `Freeserf.Core/Render/RenderMap.cs` and
`Freeserf.Core/Render/TextureAtlasManager.cs`.

## Scope

- **In:** Ports of `TileMaskUp`, `TileMaskDown`, and `TileSprites` tables;
  masked triangle composition (ground sprite repeated vertically to the 41px
  max mask height, gated by mask alpha); a runtime shelf-packing RGBA texture
  atlas with per-key regions carrying sprite header offsets — all in
  `@serfbound/assets`.
- **Out:** Scene/grid generation, WebGL upload, waves, path masks in the scene.

## Acceptance criteria

- [x] Mask tables match the reference arrays (spot-checked values and lengths
  in CI).
- [x] Composition produces a mask-sized RGBA image that samples the ground
  sprite with vertical repetition and zeroes pixels where the mask is
  transparent (exact-pixel CI test on synthetic sprites).
- [x] The atlas packs sprites without overlap, preserves each sprite's
  offset/delta header fields in its region, and round-trips pixels exactly
  (CI test).
- [x] CI stays green without `serfbound-local-data/`.

## Test plan

- **Unit:** Extend `tests/ci/asset-dos-sprite-decoding.test.mjs` (or a sibling
  test file) with composition and atlas-packing assertions on synthetic
  sprites.
- **Integration / Cypress:** n/a — covered by SB-10-03.
- **Manual / device:** Opt-in local checks compose a real ground/mask pair from
  `SPAU.PA` and assert plausible dimensions and non-empty output.
- **Design handoff:** n/a — visual proof lands in SB-10-04.

## Notes / open questions

- Preserves the reference rule `spriteIndex = terrain * 8 + TileMask[maskCode]`
  with `maskCode = (4 + Δleft) + 9 * (4 + Δright)` and the 41px repeat rule
  from `TextureAtlasManager.AddAll`.
- Intentionally drops the reference's `MaskUpSprites`/`MaskDownSprites` atlas
  slot indirection: Serfbound keys atlas regions by name instead of fixed slot
  numbers.
- Browser boundary: none new — pure typed-array math.
- .NET reference use: tables transcribed from `RenderMap.cs`; reference code
  does not execute in the product.
- Phase gate advanced: decoded pixels become composable terrain triangles.
