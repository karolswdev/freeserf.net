# SB-10-01 — Port DOS Palette and Sprite Decoders

- **Project:** serfbound
- **Phase:** 10
- **Status:** done
- **Depends on:** SB-4-02, SB-4-04
- **Unblocks:** SB-10-02
- **Owner:** unassigned

## Problem

The typed asset catalog knows where every resource lives inside imported
`SPAU.PA` but marks every decoder as deferred. Nothing turns archive bytes into
pixels, so the browser scene cannot show real game art. The reference decoding
path exists in `Freeserf.Core/Data/DataSourceDos.cs` and must be ported to
browser-native TypeScript.

## Scope

- **In:** Archive entry reader over the parsed catalog (fixups included),
  palette decoding (256 RGB triples; palettes 3, 3997, 3998), the four DOS
  sprite payload decoders (solid, transparent RLE, overlay RLE, mask RLE), the
  10-byte sprite header, the map-object flag frame fixup, and a resource-level
  decode API in `@serfbound/assets`.
- **Out:** Serf torso/head player-color compositing (`SeparateSprites`),
  animation tables, sound/music decoding, TPWM-compressed archives, rendering.

## Acceptance criteria

- [x] A synthetic in-memory `.PA` fixture decodes through all four sprite types
  in CI with exact expected RGBA output.
- [x] Malformed payloads (truncated header, wrong solid size, RLE overflow)
  fail with typed decode errors, not silent corruption.
- [x] Opt-in local checks decode palettes 3, 3997, 3998 and representative real
  sprites (`map_ground`, `map_mask_up`, `map_mask_down`, `map_object` flag)
  from local `SPAU.PA` and assert their dimensions.
- [x] CI (`npm test`) stays green without `serfbound-local-data/`.

## Test plan

- **Unit:** New `tests/ci/asset-dos-sprite-decoding.test.mjs` builds a
  synthetic archive fixture and asserts decoded headers, RGBA payloads, and
  error paths for all sprite types.
- **Integration / Cypress:** n/a — covered by SB-10-03 browser tests.
- **Manual / device:** `npm run test:local:assets` with `SERFBOUND_SPAU_PA`
  pointing at the local file decodes real palettes and sprites.
- **Design handoff:** n/a — decoder evidence is numeric; visuals land in
  SB-10-04.

## Notes / open questions

- Preserves `DataSourceDos.cs` behavior: header layout
  (`deltaX:int8, deltaY:int8, width:u16, height:u16, offsetX:i16, offsetY:i16`),
  solid size check, drop/fill RLE streams, overlay alpha value 0x80, and the
  flag frame mapping for `map_object` 128–143.
- Intentionally diverges by emitting RGBA (browser texture order) instead of
  the reference BGRA, and by returning `null` for undefined archive entries
  (partial demo data) instead of throwing.
- Browser boundary: none new — operates on already-imported bytes.
- .NET reference use: `DataSourceDos.cs` was read as porting reference only; no
  reference code executes in the product.
- Phase gate advanced: real `SPAU.PA` pixels become decodable in the browser.
