# Evidence — SB-10-01 — Port DOS Palette and Sprite Decoders

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/assets/src/dos-sprites.ts` — new: `DosPaArchive` entry
  reader over the parsed catalog (fixups included), palette reader, the 10-byte
  DOS sprite header, and the four payload decoders
  (`decodeDosSolidSprite`, `decodeDosTransparentSprite`,
  `decodeDosOverlaySprite`, `decodeDosMaskSprite`) plus the resource-level API
  (`decodeDosResourceSprite`, `dosSpriteArchiveIndex`) with the
  `map_object` 128–143 flag frame fixup, ported from
  `Freeserf.Core/Data/DataSourceDos.cs`.
- `serfbound/packages/assets/src/index.ts` — exports
  `dosResourceDefinitions`/`DosResourceDefinition` and re-exports the decoder
  module.
- `serfbound/tests/ci/asset-dos-sprite-decoding.test.mjs` — new CI test:
  synthetic in-memory `.PA` fixture decoding all four sprite types with exact
  RGBA expectations, typed error paths, and resource-index mapping.
- `serfbound/scripts/test-local-assets.mjs` — opt-in real-data checks: palettes
  3/3997/3998, all 33 `map_ground` sprites, 61+61 terrain masks, flag frame,
  tree, and shadow sprites decode from local `SPAU.PA`.

## Verification artifacts

CI-safe decoder tests (`node --test tests/ci/asset-dos-sprite-decoding.test.mjs`):

```text
# tests 6
# pass 6
# fail 0
```

Full data-free unit suite (`npm run test:unit`):

```text
# tests 52
# pass 52
# fail 0
```

Opt-in real-data run (`SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 SERFBOUND_SPAU_PA=… npm run test:local:assets`):

```text
serfbound-local-asset-tests-ok: parsed SPAU.PA catalog, matched Phase 1 oracle
metadata, and decoded real palettes, terrain sprites, 122 masks, and object
sprites.
```

Notable real-data facts established by the run:

- Palettes 3, 3997, and 3998 are present and exactly 768 bytes each.
- All 33 `map_ground` sprites decode to 32x20 RGBA with opaque pixels.
- Exactly 61 of 81 `map_mask_up` and 61 of 81 `map_mask_down` entries decode —
  matching the reference texture atlas counts in `RenderMap.cs` ("61 masks for
  up triangles, 61 masks for down triangles"), which cross-validates the
  archive reader against the reference decoder.
- The `map_object` flag frame (index 128) and tree/shadow sprites decode with
  opaque pixels; shadows carry the reference overlay alpha 0x80.

## Acceptance criteria — re-checked

- [x] Synthetic fixture decodes all four sprite types in CI with exact RGBA.
- [x] Malformed payloads raise `DosSpriteDecodeError` (truncated header, solid
  size mismatch, RLE overflow, bad palette length).
- [x] Opt-in local checks decode palettes 3/3997/3998 and representative real
  sprites with dimension assertions.
- [x] CI stays green without `serfbound-local-data/` (52/52 data-free tests).

## Deviations from plan

- `map_ground` sprites are 32x20 in real data, not 32x21 as initially assumed
  from the atlas repeat comment; the local check was corrected to assert 20.
- Decoders emit RGBA (browser texture order) instead of reference BGRA, and
  return `null` for undefined archive entries instead of throwing (partial
  demo archives are a supported import).

## Follow-ups

- Terrain composition and atlas packing land in SB-10-02.
- Serf torso player-color compositing stays deferred (phase decision).
