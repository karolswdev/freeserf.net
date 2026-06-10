# Evidence — SB-11-02 — Port the Classic Map Generator

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/engine/src/map-generator.ts` — new: faithful TypeScript
  port of `ClassicMapGenerator` (Midpoints, preserveBugs=true): height squares
  + midpoint displacement (with the first-midpoint high-bit quirk), height
  clamping, water body expansion with lake-area limit, rebase, terrain typing,
  island removal (with the TypeUp-twice quirk), rescale, shore water/grass
  seeding, deserts, object clusters, mineral deposits, and cleanup — plus the
  295-entry classic spiral pattern, `mapSpaceFromObject`, and the terrain/
  object/mineral constant tables. Exposes `generateClassicMap(size, seeds)`
  returning typed-array landscape snapshots.
- `serfbound/packages/engine/src/index.ts` — re-exports the module.
- `serfbound/tests/ci/engine-map-generator.test.mjs` — parity test comparing
  every generated array against the SB-11-01 fixture per position, plus spiral
  pattern and space-table checks.

## Verification artifacts

Parity tests (`node --test tests/ci/engine-map-generator.test.mjs`):

```text
# tests 5
# pass 5
# fail 0
```

This includes exact per-position equality for heights, typesUp, typesDown,
objects, minerals, and resourceAmounts on BOTH fixture seeds (2 x 4096
positions x 6 arrays). The TypeScript port was derived from the C# source
independently of the Python oracle, so this agreement is two independent
derivations matching tile-for-tile.

Full data-free unit suite (`npm run test:unit`): 67 tests, 0 failures.

## Acceptance criteria — re-checked

- [x] Generated heights and terrain types match the SB-11-01 fixture exactly
  for the committed seeds.
- [x] Generation is deterministic (typed arrays, integer math; parity reruns
  identical).
- [x] Engine exposes a map snapshot (`ClassicMapLandscape`) consumable without
  DOM or archive dependencies.

## Deviations from plan

- Object/mineral placement also shipped here rather than in SB-11-03, because
  the generator's RNG stream is consumed sequentially across all stages —
  splitting stages across stories would have made intermediate parity
  unverifiable. SB-11-03 narrows to exposing the landscape through the local
  game/engine state plus distribution-fact tests.

## Follow-ups

- SB-11-03 wires the landscape into the engine game state for the renderer.
