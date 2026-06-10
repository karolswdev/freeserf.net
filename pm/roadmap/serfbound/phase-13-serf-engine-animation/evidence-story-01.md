# Evidence — SB-13-01 — Decode Serf Animation and Player-Color Sprites

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/assets/src/serf-sprites.ts` — new:
  `parseSerfAnimationTable` (entry 2: big-endian size check, 200 offsets,
  3-byte frames of body sprite + signed x/y, lengths derived from
  next-higher-offset per the reference), the sprite pixel operations
  (`createDifferenceMask`/`getMasked`/`makeAlphaMask`/`stick` from
  `DataSource.cs`), and `composeSerfTorso` (torso at palette offset 64 vs 72
  → player-color difference mask; shaded region stuck back; arms from entry
  1850+body stuck on top) returning the display sprite + tintable player
  mask.
- `serfbound/packages/assets/src/index.ts` — exports.
- `serfbound/packages/test-support/src/decodable-pa-fixture.ts` — animation
  table, torso, and arms fixture entries (entry table widened to 2600).
- `serfbound/tests/ci/asset-serf-sprites.test.mjs` — table parsing with
  signed offsets, torso composition with full-coverage player mask, and
  exact-pixel semantics of the four sprite operations.
- `serfbound/scripts/test-local-assets.mjs` — real-data assertions.

## Verification artifacts

```text
node --test tests/ci/asset-serf-sprites.test.mjs -> # tests 3 / pass 3
npm run test:unit    -> # tests 95 / pass 95 / fail 0
npm run test:browser -> 6 passed (14.5s)
```

Real-data run: `200 serf animations` parse from local `SPAU.PA` with all
frames in range, and serf torso 0 composes with a non-empty player-color
region (output line recorded in the script log above).

## Acceptance criteria — re-checked

- [x] Animation table parses with the reference size check and exposes
  per-animation frame sequences (200 animations, real + fixture data).
- [x] Serf sprites composite with the player-color mask path in CI (fixture)
  and from real data (opt-in); per-color tinting applies the mask at render
  time (Phase 15 multiplies player colors).
- [x] Head/torso/arm combination follows the reference offsets (arms stick
  at 0,0 per `GetSpriteParts`; heads attach via animation-frame body indices
  in SB-13-02/03 rendering).

## Deviations from plan

- `stick`/`getMasked` implement the equal-size case the torso path uses
  (the reference's general versions carry wrap-around quirks unused here);
  recorded in code comments.

## Follow-ups

- SB-13-02 ports the serf state machine core and renders walking serfs.
