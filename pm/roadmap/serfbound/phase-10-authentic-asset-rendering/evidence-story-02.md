# Evidence — SB-10-02 — Compose Terrain Triangles into a Texture Atlas

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/assets/src/terrain-tiles.ts` — new: reference tables
  `tileMaskUp`, `tileMaskDown`, `tileTerrainSprites` transcribed from
  `Freeserf.Core/Render/RenderMap.cs`; slope-to-mask-code helpers
  (`triangleMaskCodeUp`/`Down`); `terrainGroundSpriteIndex`; and
  `composeMaskedTile` implementing the reference rule that ground tiles repeat
  vertically (to the 41px max mask height) and are gated by mask alpha.
- `serfbound/packages/assets/src/sprite-atlas.ts` — new: deterministic
  shelf-packing `buildSpriteAtlas` producing one RGBA atlas plus per-key
  regions that preserve sprite header offsets/deltas.
- `serfbound/packages/assets/src/index.ts` — re-exports both modules.
- `serfbound/tests/ci/asset-terrain-composition.test.mjs` — new CI test.
- `serfbound/scripts/test-local-assets.mjs` — opt-in real-data composition and
  atlas assertions.

## Verification artifacts

CI-safe composition tests (`node --test tests/ci/asset-terrain-composition.test.mjs`):

```text
# tests 4
# pass 4
# fail 0
```

Covered: table lengths and reference spot values (81/81/128 entries, 61 valid
masks per orientation), the slope formula `(4 + Δleft) + 9·(4 + Δright)`
including out-of-range and `-1` slots, exact-pixel composition with vertical
ground repetition and mask gating, and atlas packing with a per-pixel
no-overlap + round-trip check.

Full data-free unit suite (`npm run test:unit`): 56 tests, 0 failures.

Opt-in real-data run (`npm run test:local:assets` with local `SPAU.PA`):

```text
serfbound-local-asset-tests-ok: parsed SPAU.PA catalog, matched Phase 1 oracle
metadata, decoded real palettes, terrain sprites, 122 masks, and object
sprites, and composed real terrain triangles into a 512x32 atlas.
```

The real flat up-mask (code 40, 32x25) composed against real `map_ground` 0
has substantial opaque coverage while staying mask-shaped (fewer opaque pixels
than the full 32x25 quad), and packs into a 512x32 atlas together with the
real flag and tree sprites.

## Acceptance criteria — re-checked

- [x] Mask tables match the reference arrays (lengths + spot values in CI).
- [x] Composition: mask-sized RGBA, vertical ground repetition, transparent
  where the mask is transparent (exact-pixel CI test).
- [x] Atlas packs without overlap, preserves offset/delta header fields, and
  round-trips pixels exactly (CI test).
- [x] CI stays green without `serfbound-local-data/` (56/56 data-free tests).

## Deviations from plan

- None. The reference `MaskUpSprites`/`MaskDownSprites` slot tables were
  dropped as planned (regions are keyed by name).

## Follow-ups

- SB-10-03 consumes these primitives in the browser scene. Empirical mask
  headers recorded for placement: up masks anchor at offset (0,0); down masks
  at (0, −(height−1)); all mask X offsets are 0; `map_ground` is 32x20.
