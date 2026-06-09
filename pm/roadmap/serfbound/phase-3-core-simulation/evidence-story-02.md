# Evidence — SB-3-02 — Port Map Geometry Primitive

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `serfbound/packages/engine/src/index.ts` - adds direction helpers,
  `MapGeometry`, wrapped position/movement/distance helpers, and pure projection
  helpers.
- `serfbound/packages/engine/README.md` - documents the map geometry policy,
  source references, fixture coverage, and primitive boundary.
- `serfbound/tests/ci/engine-map-geometry.test.mjs` - tests direction facts,
  dimensions, position extraction, edge movement, shortest distances, and
  projection/view-to-tile samples against the Phase 1 fixture.
- `pm/roadmap/serfbound/phase-3-core-simulation/story-02-map-geometry-primitive.md`
  - marks SB-3-02 done and checks acceptance criteria.
- `pm/roadmap/serfbound/phase-3-core-simulation/story-03-state-tick-skeleton.md`
  - marks SB-3-03 ready because SB-3-02 now unblocks it.
- `pm/roadmap/serfbound/phase-3-core-simulation/current-phase-status.md`,
  `pm/roadmap/serfbound/README.md`, and
  `pm/roadmap/serfbound/adoption/phase-gate-verification-matrix.md` - record
  Phase 3 map geometry progress and the next gap.

## Behavior protected

- `Direction` values, clockwise/counter-clockwise cycles, turn samples,
  reverse direction, and `DirectionCycleCW.CreateWithout(Direction.Down)` match
  `directionFacts`.
- `MapGeometry` dimensions and direction offsets match sizes 3 and 4 from
  `map-geometry-facts.json`.
- Position helpers match representative columns, rows, and compact `MapPos`
  values.
- Movement helpers match edge wraparound for `Right`, `DownRight`, `Down`,
  `Left`, `UpLeft`, `Up`, `MoveRightN(3)`, and `MoveDownN(3)`.
- `DistanceX()` and `DistanceY()` match shortest signed distances.
- Pure projection helpers match captured `CoordinateSpace` samples for
  tile-to-map, map-to-view, view-to-map, and view-to-tile behavior using the
  fixture's synthetic height model and `RenderMap` tile constants.

## Source references

- `Freeserf.Core/MapGeometry.cs`
- `Freeserf.Core/CoordinateSpace.cs`
- `Freeserf.Core/Map.cs`
- `Freeserf.Core/Render/RenderMap.cs`

## Commands and output

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm test && npm run check:boundaries && npm run test:local:assets'
```

Output:

```text
Found '/Users/karol/dev/code/settlers-clone/freeserf.net/serfbound/.nvmrc' with version <22.21.0>
Now using node v22.21.0 (npm v11.6.2)

> serfbound-workspace@0.0.0 test
> npm run test:ci


> serfbound-workspace@0.0.0 test:ci
> npm run test:unit && npm run test:browser


> serfbound-workspace@0.0.0 test:unit
> npm run build && node --test tests/ci/*.test.mjs


> serfbound-workspace@0.0.0 build
> tsc -b packages/engine packages/assets packages/test-support packages/app

TAP version 13
# Subtest: direction helpers match the Phase 1 map geometry oracle facts
ok 1 - direction helpers match the Phase 1 map geometry oracle facts
  ---
  duration_ms: 2.88175
  type: 'test'
  ...
# Subtest: MapGeometry dimensions, positions, movement, and distances match oracle cases
ok 2 - MapGeometry dimensions, positions, movement, and distances match oracle cases
  ---
  duration_ms: 2.013625
  type: 'test'
  ...
# Subtest: MapGeometry projection helpers match oracle tile, map, and view samples
ok 3 - MapGeometry projection helpers match oracle tile, map, and view samples
  ---
  duration_ms: 1.469792
  type: 'test'
  ...
# Subtest: numeric helpers document 16-bit and 32-bit wrapping behavior
ok 4 - numeric helpers document 16-bit and 32-bit wrapping behavior
  ---
  duration_ms: 0.91775
  type: 'test'
  ...
# Subtest: FreeserfRandom rejects unsupported string seeds explicitly
ok 5 - FreeserfRandom rejects unsupported string seeds explicitly
  ---
  duration_ms: 0.263875
  type: 'test'
  ...
# Subtest: FreeserfRandom state copies do not expose mutable internal state
ok 6 - FreeserfRandom state copies do not expose mutable internal state
  ---
  duration_ms: 0.378791
  type: 'test'
  ...
# Subtest: FreeserfRandom matches the Phase 1 fixed-seed oracle fixture
ok 7 - FreeserfRandom matches the Phase 1 fixed-seed oracle fixture
  ---
  duration_ms: 3.759083
  type: 'test'
  ...
# Subtest: rng-fixed-seed-sequence.json satisfies the oracle fixture header contract
ok 8 - rng-fixed-seed-sequence.json satisfies the oracle fixture header contract
  ---
  duration_ms: 2.929709
  type: 'test'
  ...
# Subtest: map-geometry-facts.json satisfies the oracle fixture header contract
ok 9 - map-geometry-facts.json satisfies the oracle fixture header contract
  ---
  duration_ms: 0.782833
  type: 'test'
  ...
# Subtest: fixture validator fails unsupported schema versions with an actionable error
ok 10 - fixture validator fails unsupported schema versions with an actionable error
  ---
  duration_ms: 0.244
  type: 'test'
  ...
# Subtest: rng fixture is consumed as data by CI-safe tests
ok 11 - rng fixture is consumed as data by CI-safe tests
  ---
  duration_ms: 1.446917
  type: 'test'
  ...
# Subtest: map geometry fixture is consumed as data by CI-safe tests
ok 12 - map geometry fixture is consumed as data by CI-safe tests
  ---
  duration_ms: 0.568584
  type: 'test'
  ...
1..12
# tests 12
# suites 0
# pass 12
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 46.996333

> serfbound-workspace@0.0.0 test:browser
> npm run build:web && playwright test


> serfbound-workspace@0.0.0 build:web
> npm run build && vite build


> serfbound-workspace@0.0.0 build
> tsc -b packages/engine packages/assets packages/test-support packages/app

vite v8.0.16 building client environment for production...
transforming...✓ 8 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                 0.39 kB │ gzip: 0.26 kB
dist/assets/index-8eb-UuOo.css  2.03 kB │ gzip: 0.92 kB
dist/assets/index-gthfAytA.js   3.84 kB │ gzip: 1.69 kB

✓ built in 27ms
[WebServer] (node:86184) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)

Running 1 test using 1 worker

(node:86185) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:86185) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ✓  1 [chromium] › tests/browser/static-shell.spec.ts:8:1 › static app shell renders without original data or a desktop companion (138ms)

  1 passed (903ms)

> serfbound-workspace@0.0.0 check:boundaries
> node scripts/check-boundaries.mjs

serfbound-boundaries-ok

> serfbound-workspace@0.0.0 test:local:assets
> node scripts/test-local-assets.mjs

serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
```

## Acceptance criteria — re-checked

- [x] Map geometry helpers exist in the engine boundary — `MapGeometry` and
  direction helpers are exported from `@serfbound/engine`.
- [x] Tests cover representative positions, edges, neighbors, and direction
  logic from selected oracle targets — `engine-map-geometry.test.mjs` exercises
  every direction fact, every fixture movement sample, both fixture sizes, and
  all distance samples.
- [x] Output matches the relevant oracle fixture or records an intentional
  divergence — all `map-geometry-facts.json` cases pass; no intentional fixture
  divergence exists.
- [x] Renderer/input stories can consume the primitive without importing DOM
  code into the engine — projection helpers are pure functions/classes and
  `npm run check:boundaries` passed.
- [x] Documentation links the primitive to `Freeserf.Core` source files —
  `serfbound/packages/engine/README.md` names `MapGeometry.cs`,
  `CoordinateSpace.cs`, `Map.cs`, and `RenderMap.cs`.

## Residual risk

This story intentionally does not port the full `Map` subsystem, terrain data,
pathfinding, or the full 295-entry spiral pattern. The only spiral behavior
included is the center tile plus first ring required by the captured
`CoordinateSpace.MapSpaceToTileSpace()` samples. Future pathfinding/search
stories must expand this with their own fixture-backed evidence instead of
assuming this primitive is a complete map port.
