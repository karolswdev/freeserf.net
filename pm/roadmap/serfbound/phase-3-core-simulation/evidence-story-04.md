# Evidence — SB-3-04 — Prove First Simulation Parity

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `serfbound/packages/engine/src/simulation.ts` - adds state-owned
  `nextRandomInt()` mutation for the combined proof.
- `serfbound/tests/ci/engine-simulation-parity.test.mjs` - adds the first
  combined engine parity test consuming both Phase 1 CI-safe fixtures.
- `serfbound/packages/engine/README.md` - documents the combined parity policy.
- `pm/roadmap/serfbound/phase-3-core-simulation/story-04-first-simulation-parity.md`
  - marks SB-3-04 done and checks acceptance criteria.
- `pm/roadmap/serfbound/phase-3-core-simulation/current-phase-status.md` and
  `pm/roadmap/serfbound/phase-3-core-simulation/final-summary.md` - close Phase
  3.
- `pm/roadmap/serfbound/README.md`,
  `pm/roadmap/serfbound/adoption/phase-gate-verification-matrix.md`,
  `pm/roadmap/serfbound/phase-4-data-assets/current-phase-status.md`, and
  `pm/roadmap/serfbound/phase-4-data-assets/story-01-browser-data-import-boundary.md`
  - move the roadmap to Phase 4 ready.

## Behavior protected

- The combined engine slice consumes `rng-fixed-seed-sequence.json` and
  `map-geometry-facts.json` during default CI-safe tests.
- One `SerfboundGameState` owns RNG mutation through `nextRandomInt()`.
- RNG state, next values, and seed strings match the selected Phase 1 RNG case.
- Map movement uses representative Phase 1 map movement samples and exact
  direction results.
- Tick advancement is coupled with the same state instance and produces the
  expected deterministic clock/counter snapshot.
- No original data, local asset path, .NET runtime, desktop wrapper, or
  reference-tool execution is required.

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
  duration_ms: 2.824417
  type: 'test'
  ...
# Subtest: MapGeometry dimensions, positions, movement, and distances match oracle cases
ok 2 - MapGeometry dimensions, positions, movement, and distances match oracle cases
  ---
  duration_ms: 2.190625
  type: 'test'
  ...
# Subtest: MapGeometry projection helpers match oracle tile, map, and view samples
ok 3 - MapGeometry projection helpers match oracle tile, map, and view samples
  ---
  duration_ms: 1.501292
  type: 'test'
  ...
# Subtest: numeric helpers document 16-bit and 32-bit wrapping behavior
ok 4 - numeric helpers document 16-bit and 32-bit wrapping behavior
  ---
  duration_ms: 0.444
  type: 'test'
  ...
# Subtest: FreeserfRandom rejects unsupported string seeds explicitly
ok 5 - FreeserfRandom rejects unsupported string seeds explicitly
  ---
  duration_ms: 0.264792
  type: 'test'
  ...
# Subtest: FreeserfRandom state copies do not expose mutable internal state
ok 6 - FreeserfRandom state copies do not expose mutable internal state
  ---
  duration_ms: 0.355833
  type: 'test'
  ...
# Subtest: FreeserfRandom matches the Phase 1 fixed-seed oracle fixture
ok 7 - FreeserfRandom matches the Phase 1 fixed-seed oracle fixture
  ---
  duration_ms: 3.69025
  type: 'test'
  ...
# Subtest: combined engine slice consumes Phase 1 RNG and map geometry fixtures
ok 8 - combined engine slice consumes Phase 1 RNG and map geometry fixtures
  ---
  duration_ms: 3.375208
  type: 'test'
  ...
# Subtest: SerfboundGameState exposes a stable initial snapshot
ok 9 - SerfboundGameState exposes a stable initial snapshot
  ---
  duration_ms: 1.308125
  type: 'test'
  ...
# Subtest: SerfboundGameState advances source-derived tick and schedule counters deterministically
ok 10 - SerfboundGameState advances source-derived tick and schedule counters deterministically
  ---
  duration_ms: 0.353875
  type: 'test'
  ...
# Subtest: SerfboundGameState preserves the reference tick overflow formula
ok 11 - SerfboundGameState preserves the reference tick overflow formula
  ---
  duration_ms: 0.127125
  type: 'test'
  ...
# Subtest: SerfboundGameState snapshots round-trip and continue deterministically
ok 12 - SerfboundGameState snapshots round-trip and continue deterministically
  ---
  duration_ms: 0.2155
  type: 'test'
  ...
# Subtest: rng-fixed-seed-sequence.json satisfies the oracle fixture header contract
ok 13 - rng-fixed-seed-sequence.json satisfies the oracle fixture header contract
  ---
  duration_ms: 2.993542
  type: 'test'
  ...
# Subtest: map-geometry-facts.json satisfies the oracle fixture header contract
ok 14 - map-geometry-facts.json satisfies the oracle fixture header contract
  ---
  duration_ms: 0.771416
  type: 'test'
  ...
# Subtest: fixture validator fails unsupported schema versions with an actionable error
ok 15 - fixture validator fails unsupported schema versions with an actionable error
  ---
  duration_ms: 0.225458
  type: 'test'
  ...
# Subtest: rng fixture is consumed as data by CI-safe tests
ok 16 - rng fixture is consumed as data by CI-safe tests
  ---
  duration_ms: 1.341292
  type: 'test'
  ...
# Subtest: map geometry fixture is consumed as data by CI-safe tests
ok 17 - map geometry fixture is consumed as data by CI-safe tests
  ---
  duration_ms: 0.61875
  type: 'test'
  ...
1..17
# tests 17
# suites 0
# pass 17
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 49.395125

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

✓ built in 26ms
[WebServer] (node:96100) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)

Running 1 test using 1 worker

(node:96101) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:96101) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ✓  1 [chromium] › tests/browser/static-shell.spec.ts:8:1 › static app shell renders without original data or a desktop companion (141ms)

  1 passed (913ms)

> serfbound-workspace@0.0.0 check:boundaries
> node scripts/check-boundaries.mjs

serfbound-boundaries-ok

> serfbound-workspace@0.0.0 test:local:assets
> node scripts/test-local-assets.mjs

serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
```

## Structural audit

Command:

```bash
for n in 01 02 03 04; do test -f pm/roadmap/serfbound/phase-3-core-simulation/evidence-story-$n.md && echo evidence-ok-$n || echo missing-evidence-$n; rg -q "\*\*Status:\*\* done" pm/roadmap/serfbound/phase-3-core-simulation/story-$n-*.md && echo story-done-$n || echo story-not-done-$n; done
git ls-files | rg -n '(^|/)(SPA.*\.PA|SOUNDS\.PA|SERF\.EXE|.*\.adf$|sounds/|music/|serfbound-local-data/)' || true
git diff --check
```

Output:

```text
evidence-ok-01
story-done-01
evidence-ok-02
story-done-02
evidence-ok-03
story-done-03
evidence-ok-04
story-done-04
```

## Acceptance criteria — re-checked

- [x] A parity test consumes at least one Phase 1 CI-safe fixture —
  `engine-simulation-parity.test.mjs` consumes both RNG and map geometry
  fixtures.
- [x] The test passes locally and is suitable for default CI — `npm test`
  passed with local-asset environment variables unset.
- [x] Any mismatch is either fixed or recorded as an intentional divergence
  with user-visible consequences — no mismatch remains for the protected
  fixture-backed surface.
- [x] Phase 3 status records what behavior is now protected —
  `current-phase-status.md` and `final-summary.md` record the protected slice.
- [x] Later renderer/playable stories can name the protected engine behavior —
  Phase 4 is now ready, and Phase 5/7 can depend on the protected RNG, map, and
  tick primitives.

## Residual risk

This is the first combined deterministic engine proof, not full game parity.
It does not prove local asset import, terrain generation, pathfinding, economy,
player AI, rendering, audio, browser save/load, or serializer byte parity.
Those are explicitly owned by later phases and deferred oracle targets.
