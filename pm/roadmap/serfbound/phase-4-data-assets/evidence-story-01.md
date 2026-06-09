# Evidence — SB-4-01 — Implement Browser Data Import Boundary

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `serfbound/packages/assets/src/index.ts` - adds supported DOS archive
  boundary metadata and file-selection validation.
- `serfbound/packages/app/src/main.ts` - turns the shell import control into a
  real browser file input with missing, unsupported, and supported states.
- `serfbound/packages/app/src/styles.css` - styles the import control and status
  detail without layout shifts.
- `serfbound/tests/ci/asset-import-boundary.test.mjs` - tests filename
  validation and recoverable states.
- `serfbound/tests/browser/static-shell.spec.ts` - tests generated fake invalid
  and supported file selections in the browser smoke.
- `serfbound/scripts/test-local-assets.mjs` - registers an opt-in local/manual
  filename check behind `SERFBOUND_RUN_LOCAL_ASSET_TESTS=1`.
- `pm/roadmap/serfbound/phase-2-browser-foundation/artifacts/story-04-app-shell-desktop.png`
  - refreshed by the browser smoke to show the import-ready shell.
- PMO status/story files - mark SB-4-01 done and SB-4-02 ready.

## Behavior protected

- Browser UI accepts a local `.PA` file selection through a real file input.
- `SPAU.PA` is accepted as the first supported DOS archive name.
- Unsupported names produce a recoverable browser state without crashing.
- Missing data remains a recoverable initial state.
- Default CI uses generated fake files only and does not require original data.
- Local/manual checks remain opt-in and do not copy original data into tracked
  paths.

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
# Subtest: asset import boundary accepts only the first supported DOS archive name
ok 1 - asset import boundary accepts only the first supported DOS archive name
  ---
  duration_ms: 0.661
  type: 'test'
  ...
# Subtest: archive selection validation exposes recoverable browser states
ok 2 - archive selection validation exposes recoverable browser states
  ---
  duration_ms: 0.143375
  type: 'test'
  ...
# Subtest: direction helpers match the Phase 1 map geometry oracle facts
ok 3 - direction helpers match the Phase 1 map geometry oracle facts
  ---
  duration_ms: 3.7575
  type: 'test'
  ...
# Subtest: MapGeometry dimensions, positions, movement, and distances match oracle cases
ok 4 - MapGeometry dimensions, positions, movement, and distances match oracle cases
  ---
  duration_ms: 2.257292
  type: 'test'
  ...
# Subtest: MapGeometry projection helpers match oracle tile, map, and view samples
ok 5 - MapGeometry projection helpers match oracle tile, map, and view samples
  ---
  duration_ms: 1.594167
  type: 'test'
  ...
# Subtest: numeric helpers document 16-bit and 32-bit wrapping behavior
ok 6 - numeric helpers document 16-bit and 32-bit wrapping behavior
  ---
  duration_ms: 0.563333
  type: 'test'
  ...
# Subtest: FreeserfRandom rejects unsupported string seeds explicitly
ok 7 - FreeserfRandom rejects unsupported string seeds explicitly
  ---
  duration_ms: 0.297
  type: 'test'
  ...
# Subtest: FreeserfRandom state copies do not expose mutable internal state
ok 8 - FreeserfRandom state copies do not expose mutable internal state
  ---
  duration_ms: 0.637208
  type: 'test'
  ...
# Subtest: FreeserfRandom matches the Phase 1 fixed-seed oracle fixture
ok 9 - FreeserfRandom matches the Phase 1 fixed-seed oracle fixture
  ---
  duration_ms: 4.134333
  type: 'test'
  ...
# Subtest: combined engine slice consumes Phase 1 RNG and map geometry fixtures
ok 10 - combined engine slice consumes Phase 1 RNG and map geometry fixtures
  ---
  duration_ms: 4.036583
  type: 'test'
  ...
# Subtest: SerfboundGameState exposes a stable initial snapshot
ok 11 - SerfboundGameState exposes a stable initial snapshot
  ---
  duration_ms: 1.6335
  type: 'test'
  ...
# Subtest: SerfboundGameState advances source-derived tick and schedule counters deterministically
ok 12 - SerfboundGameState advances source-derived tick and schedule counters deterministically
  ---
  duration_ms: 0.41225
  type: 'test'
  ...
# Subtest: SerfboundGameState preserves the reference tick overflow formula
ok 13 - SerfboundGameState preserves the reference tick overflow formula
  ---
  duration_ms: 0.143125
  type: 'test'
  ...
# Subtest: SerfboundGameState snapshots round-trip and continue deterministically
ok 14 - SerfboundGameState snapshots round-trip and continue deterministically
  ---
  duration_ms: 0.502375
  type: 'test'
  ...
# Subtest: rng-fixed-seed-sequence.json satisfies the oracle fixture header contract
ok 15 - rng-fixed-seed-sequence.json satisfies the oracle fixture header contract
  ---
  duration_ms: 3.047208
  type: 'test'
  ...
# Subtest: map-geometry-facts.json satisfies the oracle fixture header contract
ok 16 - map-geometry-facts.json satisfies the oracle fixture header contract
  ---
  duration_ms: 1.006334
  type: 'test'
  ...
# Subtest: fixture validator fails unsupported schema versions with an actionable error
ok 17 - fixture validator fails unsupported schema versions with an actionable error
  ---
  duration_ms: 0.318375
  type: 'test'
  ...
# Subtest: rng fixture is consumed as data by CI-safe tests
ok 18 - rng fixture is consumed as data by CI-safe tests
  ---
  duration_ms: 1.340042
  type: 'test'
  ...
# Subtest: map geometry fixture is consumed as data by CI-safe tests
ok 19 - map geometry fixture is consumed as data by CI-safe tests
  ---
  duration_ms: 0.523459
  type: 'test'
  ...
1..19
# tests 19
# suites 0
# pass 19
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 54.478834

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
dist/assets/index-Cw4JJ_gE.css  2.41 kB │ gzip: 1.05 kB
dist/assets/index-DHd0a1jx.js   5.29 kB │ gzip: 2.12 kB

✓ built in 27ms
[WebServer] (node:99565) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)

Running 1 test using 1 worker

(node:99566) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:99566) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ✓  1 [chromium] › tests/browser/static-shell.spec.ts:8:1 › static app shell renders without original data or a desktop companion (173ms)

  1 passed (1.0s)

> serfbound-workspace@0.0.0 check:boundaries
> node scripts/check-boundaries.mjs

serfbound-boundaries-ok

> serfbound-workspace@0.0.0 test:local:assets
> node scripts/test-local-assets.mjs

serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
```

## Acceptance criteria — re-checked

- [x] Browser UI accepts a local `.PA` file selection — Playwright sets a
  generated `SPAU.PA` file on the real file input and observes the supported
  state.
- [x] `SPAU.PA` is accepted as a supported DOS source name — unit and browser
  tests assert this.
- [x] Invalid or missing files produce recoverable UI state — unit tests cover
  missing/unsupported results; browser smoke covers unsupported file selection.
- [x] Local asset tests are opt-in and excluded from CI — default validation
  unsets local asset variables and `npm run test:local:assets` skips cleanly.
- [x] No original data is copied into tracked paths — tests use generated fake
  files; no local source path or original payload is staged.

## Screenshot timing check

After the first full run, the screenshot capture was moved before generated file
selection so the existing app-shell artifact continues to show the recoverable
missing-data state. Browser smoke was rerun:

```text
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
dist/assets/index-Cw4JJ_gE.css  2.41 kB │ gzip: 1.05 kB
dist/assets/index-DHd0a1jx.js   5.29 kB │ gzip: 2.12 kB

✓ built in 26ms
Running 1 test using 1 worker

  ✓  1 [chromium] › tests/browser/static-shell.spec.ts:8:1 › static app shell renders without original data or a desktop companion (167ms)

  1 passed (1.0s)
```

## Residual risk

This story validates the browser import boundary only. It does not parse `.PA`
catalog bytes, persist imported data, decode resources, or prove local real
`SPAU.PA` catalog parity. SB-4-02 owns catalog parsing, and SB-4-03 owns
persistence.
