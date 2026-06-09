# Evidence — SB-2-02 — Add CI-Safe Test Spine

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `serfbound/package.json` - adds `test`, `test:ci`, and
  `test:local:assets` commands.
- `serfbound/tests/ci/oracle-fixtures.test.mjs` - Node built-in test-runner
  tests that read committed CI-safe Phase 1 fixtures.
- `serfbound/packages/test-support/src/index.ts` - fixture header validator for
  parsed JSON data, including unsupported schema and expected target checks.
- `serfbound/scripts/test-local-assets.mjs` - explicitly named opt-in
  local/manual asset-test command.
- `serfbound/scripts/check-boundaries.mjs` - extends boundary checks so product
  package source cannot reference `serfbound-local-data/` or Phase 1 reference
  tools.
- `serfbound/README.md` - documents default CI-safe and local/manual test
  command boundaries.
- `pm/roadmap/serfbound/phase-2-browser-foundation/story-02-ci-safe-test-spine.md`
  - marks SB-2-02 done and checks acceptance criteria.
- `pm/roadmap/serfbound/phase-2-browser-foundation/current-phase-status.md`,
  `pm/roadmap/serfbound/README.md`, and
  `pm/roadmap/serfbound/adoption/phase-gate-verification-matrix.md` - record
  Phase 2 test-spine progress and next gap.

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
> npm run build && node --test tests/ci/*.test.mjs


> serfbound-workspace@0.0.0 build
> tsc -b packages/engine packages/assets packages/test-support packages/app

TAP version 13
# Subtest: rng-fixed-seed-sequence.json satisfies the oracle fixture header contract
ok 1 - rng-fixed-seed-sequence.json satisfies the oracle fixture header contract
  ---
  duration_ms: 2.636541
  type: 'test'
  ...
# Subtest: map-geometry-facts.json satisfies the oracle fixture header contract
ok 2 - map-geometry-facts.json satisfies the oracle fixture header contract
  ---
  duration_ms: 0.774708
  type: 'test'
  ...
# Subtest: fixture validator fails unsupported schema versions with an actionable error
ok 3 - fixture validator fails unsupported schema versions with an actionable error
  ---
  duration_ms: 0.301625
  type: 'test'
  ...
# Subtest: rng fixture is consumed as data by CI-safe tests
ok 4 - rng fixture is consumed as data by CI-safe tests
  ---
  duration_ms: 1.453625
  type: 'test'
  ...
# Subtest: map geometry fixture is consumed as data by CI-safe tests
ok 5 - map geometry fixture is consumed as data by CI-safe tests
  ---
  duration_ms: 0.512583
  type: 'test'
  ...
1..5
# tests 5
# suites 0
# pass 5
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 41.2965

> serfbound-workspace@0.0.0 check:boundaries
> node scripts/check-boundaries.mjs

serfbound-boundaries-ok

> serfbound-workspace@0.0.0 test:local:assets
> node scripts/test-local-assets.mjs

serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
```

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use >/tmp/serfbound-nvm-use.out && npm install --package-lock-only'
```

Output:

```text
up to date, audited 10 packages in 308ms

found 0 vulnerabilities
```

PMO structural checks:

```bash
git diff --check
for f in pm/roadmap/serfbound/phase-*/story-[0-9]*.md; do rg -q "^## Problem$" "$f" && rg -q "^## Scope$" "$f" && rg -q "^## Acceptance criteria$" "$f" && rg -q "^## Test plan$" "$f" || echo "missing required section: $f"; done
bash -n .githooks/pre-commit .githooks/post-commit .githooks/work-log-read .githooks/work-log-summarize
```

Output: passed with no output.

## Acceptance criteria — re-checked

- [x] A test command runs without `serfbound-local-data/` — `npm test` passed
  with `SERFBOUND_RUN_LOCAL_ASSET_TESTS`, `SERFBOUND_LOCAL_DATA`, and
  `SERFBOUND_SPAU_PA` unset.
- [x] A fixture validation test reads at least one CI-safe oracle fixture —
  `oracle-fixtures.test.mjs` reads both
  `rng-fixed-seed-sequence.json` and `map-geometry-facts.json`.
- [x] Local/manual asset tests are clearly named and excluded from default CI —
  default `npm test` runs `test:ci`; local/manual checks live under
  `npm run test:local:assets`.
- [x] The command is documented in the relevant phase status or workspace docs —
  `serfbound/README.md` and `current-phase-status.md` document it.
- [x] Failing tests produce actionable output — the validator includes fixture
  labels and exact field mismatches, and the CI test proves unsupported schema
  failure text.

## Residual risk

SB-2-02 uses Node's built-in test runner rather than a browser-runner harness.
That is enough for the CI-safe fixture spine and keeps dependencies minimal, but
SB-2-04 still needs static browser app-shell proof and later visual/runtime
tests must run in real browser contexts.
