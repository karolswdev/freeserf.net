# Evidence — SB-3-01 — Port Deterministic Numeric And Random Rules

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `serfbound/packages/engine/src/index.ts` - adds explicit numeric helpers and
  `FreeserfRandom`.
- `serfbound/packages/engine/README.md` - documents fixed-width numeric policy,
  RNG scope, and divergence notes.
- `serfbound/tests/ci/engine-random.test.mjs` - tests numeric helpers, string
  seed validation, immutable state snapshots, and every RNG fixture case/step.
- `pm/roadmap/serfbound/phase-3-core-simulation/story-01-numeric-random-rules.md`
  - marks SB-3-01 done and checks acceptance criteria.
- `pm/roadmap/serfbound/phase-3-core-simulation/story-02-map-geometry-primitive.md`
  - marks SB-3-02 ready because SB-3-01 now unblocks it.
- `pm/roadmap/serfbound/phase-3-core-simulation/current-phase-status.md`,
  `pm/roadmap/serfbound/README.md`, and
  `pm/roadmap/serfbound/adoption/phase-gate-verification-matrix.md` - record
  Phase 3 progress and the next gap.

## Behavior protected

- `uint16`, `int16`, `uint32`, and `rotateRight16` make the fixed-width integer
  rules explicit.
- `FreeserfRandom.fromWord`, `FreeserfRandom.fromState`,
  `FreeserfRandom.fromStringSeed`, `FreeserfRandom.xor`, `next()`, and
  `toString()` match `Freeserf.Core/Random.cs` as captured in the Phase 1 RNG
  fixture.
- Tests cover all six fixture cases:
  - `word-seed-0000`
  - `word-seed-0001`
  - `word-seed-ffff`
  - `base-triplet-edge`
  - `string-seed-1234567812345678`
  - `xor-base-triplet-with-string`

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
# Subtest: numeric helpers document 16-bit and 32-bit wrapping behavior
ok 1 - numeric helpers document 16-bit and 32-bit wrapping behavior
  ---
  duration_ms: 1.695125
  type: 'test'
  ...
# Subtest: FreeserfRandom rejects unsupported string seeds explicitly
ok 2 - FreeserfRandom rejects unsupported string seeds explicitly
  ---
  duration_ms: 0.265708
  type: 'test'
  ...
# Subtest: FreeserfRandom state copies do not expose mutable internal state
ok 3 - FreeserfRandom state copies do not expose mutable internal state
  ---
  duration_ms: 0.364334
  type: 'test'
  ...
# Subtest: FreeserfRandom matches the Phase 1 fixed-seed oracle fixture
ok 4 - FreeserfRandom matches the Phase 1 fixed-seed oracle fixture
  ---
  duration_ms: 3.211417
  type: 'test'
  ...
# Subtest: rng-fixed-seed-sequence.json satisfies the oracle fixture header contract
ok 5 - rng-fixed-seed-sequence.json satisfies the oracle fixture header contract
  ---
  duration_ms: 2.992125
  type: 'test'
  ...
# Subtest: map-geometry-facts.json satisfies the oracle fixture header contract
ok 6 - map-geometry-facts.json satisfies the oracle fixture header contract
  ---
  duration_ms: 0.897291
  type: 'test'
  ...
# Subtest: fixture validator fails unsupported schema versions with an actionable error
ok 7 - fixture validator fails unsupported schema versions with an actionable error
  ---
  duration_ms: 0.250583
  type: 'test'
  ...
# Subtest: rng fixture is consumed as data by CI-safe tests
ok 8 - rng fixture is consumed as data by CI-safe tests
  ---
  duration_ms: 1.443333
  type: 'test'
  ...
# Subtest: map geometry fixture is consumed as data by CI-safe tests
ok 9 - map geometry fixture is consumed as data by CI-safe tests
  ---
  duration_ms: 0.54625
  type: 'test'
  ...
1..9
# tests 9
# suites 0
# pass 9
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 45.789583

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
dist/assets/index-DfrWoI1q.js   3.70 kB │ gzip: 1.61 kB

✓ built in 28ms

Running 1 test using 1 worker

  ✓  1 [chromium] › tests/browser/static-shell.spec.ts:8:1 › static app shell renders without original data or a desktop companion (133ms)

  1 passed (904ms)

> serfbound-workspace@0.0.0 check:boundaries
> node scripts/check-boundaries.mjs

serfbound-boundaries-ok

> serfbound-workspace@0.0.0 test:local:assets
> node scripts/test-local-assets.mjs

serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
```

## Acceptance criteria — re-checked

- [x] Numeric helper behavior is documented and tested —
  `serfbound/packages/engine/README.md` documents the policy, and
  `engine-random.test.mjs` tests wrapping, signed conversion, 32-bit wrapping,
  and 16-bit rotation.
- [x] Random/seed behavior matches the selected oracle fixture — every
  `rng-fixed-seed-sequence.json` case and step passes.
- [x] Tests include edge cases for signed/unsigned and overflow-sensitive
  behavior relevant to the selected source files — edge tests cover `UInt16`
  wraparound, signed 16-bit interpretation, `UInt32`, and rotate-right behavior.
- [x] Browser code does not depend on C# runtime artifacts —
  `npm run check:boundaries` passed and product code imports no reference
  tooling.
- [x] Known divergences are recorded with rationale — there are no intentional
  RNG behavior divergences. The only note is a Phase 1 fixture metadata quirk in
  the operator-`^` constructor metadata; tests reconstruct the state from
  `leftState` and `rightState`.

## Residual risk

Phase 1's RNG fixture was source-derived because the local C#/.NET toolchain was
unavailable. The TypeScript implementation now matches that accepted fixture
exactly. A future environment with a C# toolchain should still cross-check the
fixture before broader Phase 3 simulation claims depend on it.
