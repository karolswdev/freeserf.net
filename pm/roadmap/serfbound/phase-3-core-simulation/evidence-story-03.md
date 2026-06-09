# Evidence — SB-3-03 — Add State And Tick Skeleton

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `serfbound/packages/engine/src/simulation.ts` - adds `SerfboundGameState`,
  source-derived tick constants, deterministic tick advancement, stable
  snapshots, and snapshot restore.
- `serfbound/packages/engine/src/index.ts` - exports the state/tick skeleton
  from the engine package boundary.
- `serfbound/tests/ci/engine-state.test.mjs` - tests initial snapshot shape,
  deterministic tick advancement, source overflow behavior, and snapshot
  round-trip continuation.
- `serfbound/packages/engine/README.md` - documents state/tick policy, source
  references, and deferred systems.
- `pm/roadmap/serfbound/phase-3-core-simulation/story-03-state-tick-skeleton.md`
  - marks SB-3-03 done and checks acceptance criteria.
- `pm/roadmap/serfbound/phase-3-core-simulation/story-04-first-simulation-parity.md`
  - marks SB-3-04 ready because SB-3-03 now unblocks it.
- `pm/roadmap/serfbound/phase-3-core-simulation/current-phase-status.md`,
  `pm/roadmap/serfbound/README.md`, and
  `pm/roadmap/serfbound/adoption/phase-gate-verification-matrix.md` - record
  Phase 3 state/tick progress and the next gap.

## Behavior protected

- `DEFAULT_GAME_SPEED = 2`, `TICK_LENGTH = 20`, and `TICKS_PER_SEC = 50`.
- 16-bit `Tick` wrapping and 32-bit `ConstTick` wrapping.
- `GameTimeTicksOfSecond`, `GameTime`, and `NextGameTime` progression.
- The source `Game.Update()` overflow formula for `tickDifference`.
- First schedule counter behavior for knight morale and inventory dispatch.
- Stable JSON snapshot fields for map dimensions, clock, RNG state/string, and
  counters.
- Snapshot restore preserves `tickDifference` and continues deterministically.

## Source references

- `Freeserf.Core/GameState.cs`
- `Freeserf.Core/Game.cs`
- `Freeserf.Core/Freeserf.cs`
- `Freeserf.Core/Map.cs`
- `Freeserf.Core/Player.cs`
- `Freeserf.Core/Savegame.cs`
- `Freeserf.Core/Serialize/*`

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
  duration_ms: 2.882625
  type: 'test'
  ...
# Subtest: MapGeometry dimensions, positions, movement, and distances match oracle cases
ok 2 - MapGeometry dimensions, positions, movement, and distances match oracle cases
  ---
  duration_ms: 2.15175
  type: 'test'
  ...
# Subtest: MapGeometry projection helpers match oracle tile, map, and view samples
ok 3 - MapGeometry projection helpers match oracle tile, map, and view samples
  ---
  duration_ms: 1.490916
  type: 'test'
  ...
# Subtest: numeric helpers document 16-bit and 32-bit wrapping behavior
ok 4 - numeric helpers document 16-bit and 32-bit wrapping behavior
  ---
  duration_ms: 0.467708
  type: 'test'
  ...
# Subtest: FreeserfRandom rejects unsupported string seeds explicitly
ok 5 - FreeserfRandom rejects unsupported string seeds explicitly
  ---
  duration_ms: 0.271042
  type: 'test'
  ...
# Subtest: FreeserfRandom state copies do not expose mutable internal state
ok 6 - FreeserfRandom state copies do not expose mutable internal state
  ---
  duration_ms: 0.476167
  type: 'test'
  ...
# Subtest: FreeserfRandom matches the Phase 1 fixed-seed oracle fixture
ok 7 - FreeserfRandom matches the Phase 1 fixed-seed oracle fixture
  ---
  duration_ms: 3.595917
  type: 'test'
  ...
# Subtest: SerfboundGameState exposes a stable initial snapshot
ok 8 - SerfboundGameState exposes a stable initial snapshot
  ---
  duration_ms: 1.304125
  type: 'test'
  ...
# Subtest: SerfboundGameState advances source-derived tick and schedule counters deterministically
ok 9 - SerfboundGameState advances source-derived tick and schedule counters deterministically
  ---
  duration_ms: 0.354334
  type: 'test'
  ...
# Subtest: SerfboundGameState preserves the reference tick overflow formula
ok 10 - SerfboundGameState preserves the reference tick overflow formula
  ---
  duration_ms: 0.111833
  type: 'test'
  ...
# Subtest: SerfboundGameState snapshots round-trip and continue deterministically
ok 11 - SerfboundGameState snapshots round-trip and continue deterministically
  ---
  duration_ms: 0.207166
  type: 'test'
  ...
# Subtest: rng-fixed-seed-sequence.json satisfies the oracle fixture header contract
ok 12 - rng-fixed-seed-sequence.json satisfies the oracle fixture header contract
  ---
  duration_ms: 3.071291
  type: 'test'
  ...
# Subtest: map-geometry-facts.json satisfies the oracle fixture header contract
ok 13 - map-geometry-facts.json satisfies the oracle fixture header contract
  ---
  duration_ms: 0.736917
  type: 'test'
  ...
# Subtest: fixture validator fails unsupported schema versions with an actionable error
ok 14 - fixture validator fails unsupported schema versions with an actionable error
  ---
  duration_ms: 0.251333
  type: 'test'
  ...
# Subtest: rng fixture is consumed as data by CI-safe tests
ok 15 - rng fixture is consumed as data by CI-safe tests
  ---
  duration_ms: 1.58025
  type: 'test'
  ...
# Subtest: map geometry fixture is consumed as data by CI-safe tests
ok 16 - map geometry fixture is consumed as data by CI-safe tests
  ---
  duration_ms: 0.605792
  type: 'test'
  ...
1..16
# tests 16
# suites 0
# pass 16
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 48.40875

> serfbound-workspace@0.0.0 test:browser
> npm run build:web && playwright test


> serfbound-workspace@0.0.0 build:web
> npm run build && vite build


> serfbound-workspace@0.0.0 build
> tsc -b packages/engine packages/assets packages/test-support packages/app

vite v8.0.16 building client environment for production...
transforming...✓ 9 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                 0.39 kB │ gzip: 0.26 kB
dist/assets/index-8eb-UuOo.css  2.03 kB │ gzip: 0.92 kB
dist/assets/index-gthfAytA.js   3.84 kB │ gzip: 1.69 kB

✓ built in 27ms
[WebServer] (node:89769) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)

Running 1 test using 1 worker

(node:89770) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:89770) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ✓  1 [chromium] › tests/browser/static-shell.spec.ts:8:1 › static app shell renders without original data or a desktop companion (134ms)

  1 passed (906ms)

> serfbound-workspace@0.0.0 check:boundaries
> node scripts/check-boundaries.mjs

serfbound-boundaries-ok

> serfbound-workspace@0.0.0 test:local:assets
> node scripts/test-local-assets.mjs

serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
```

## Acceptance criteria — re-checked

- [x] State and tick skeleton exists inside the engine boundary —
  `SerfboundGameState` is exported from `@serfbound/engine`.
- [x] Tests prove tick advancement is deterministic — state tests assert exact
  tick/time/counter values after fixed advancement.
- [x] Snapshot or serialization shape is explicit and stable — the snapshot
  object has schema version `1`, stable sections, and round-trip restore tests.
- [x] The skeleton can be driven without DOM/browser APIs —
  `npm run check:boundaries` passed.
- [x] Deferred systems are listed with source references — story notes and
  engine docs list the deferred map/player/serializer/save systems.

## Residual risk

This story is a deterministic state skeleton, not full simulation parity and
not savegame compatibility. It does not run `Map.Update()`, mutate terrain,
update players/AI/visuals, maintain stats/history, or implement dirty-state
serialization. The planned `serializer.state-fixtures` target is still not
captured, so byte-level serializer parity remains unproven until a later story
captures and consumes that fixture.
