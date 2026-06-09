# Evidence — SB-2-03 — Define Runtime Module Boundaries

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `pm/roadmap/serfbound/adoption/runtime-module-boundaries.md` - new Phase 2
  boundary baseline.
- `serfbound/packages/app/package.json`,
  `serfbound/packages/app/src/main.ts`, and `serfbound/package-lock.json` -
  remove the product app dependency on `@serfbound/test-support`.
- `serfbound/scripts/check-boundaries.mjs` - rejects product package
  dependencies on `@serfbound/test-support` in addition to existing runtime,
  local-data, and reference-tool checks.
- `pm/roadmap/serfbound/phase-2-browser-foundation/story-03-runtime-module-boundaries.md`
  - marks SB-2-03 done and checks acceptance criteria.
- `pm/roadmap/serfbound/phase-2-browser-foundation/current-phase-status.md`,
  `pm/roadmap/serfbound/README.md`, and
  `pm/roadmap/serfbound/adoption/phase-gate-verification-matrix.md` - record
  runtime-boundary progress and next Phase 2 gap.

## Boundary coverage

`runtime-module-boundaries.md` covers:

- engine;
- asset import;
- decoded asset catalog;
- renderer/projection;
- UI/input;
- audio;
- persistence;
- worker/threading;
- oracle fixtures/tests;
- app shell.

The document distinguishes browser file import from decoded asset catalogs and
defines the worker/threading boundary as deferred until Phase 8 unless a
measured stop signal trips.

## Commands and output

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use >/tmp/serfbound-nvm-use.out && npm install --package-lock-only'
```

Output:

```text
up to date, audited 10 packages in 321ms

found 0 vulnerabilities
```

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
  duration_ms: 2.9145
  type: 'test'
  ...
# Subtest: map-geometry-facts.json satisfies the oracle fixture header contract
ok 2 - map-geometry-facts.json satisfies the oracle fixture header contract
  ---
  duration_ms: 0.694083
  type: 'test'
  ...
# Subtest: fixture validator fails unsupported schema versions with an actionable error
ok 3 - fixture validator fails unsupported schema versions with an actionable error
  ---
  duration_ms: 0.250916
  type: 'test'
  ...
# Subtest: rng fixture is consumed as data by CI-safe tests
ok 4 - rng fixture is consumed as data by CI-safe tests
  ---
  duration_ms: 1.540917
  type: 'test'
  ...
# Subtest: map geometry fixture is consumed as data by CI-safe tests
ok 5 - map geometry fixture is consumed as data by CI-safe tests
  ---
  duration_ms: 0.6305
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
# duration_ms 44.948959

> serfbound-workspace@0.0.0 check:boundaries
> node scripts/check-boundaries.mjs

serfbound-boundaries-ok

> serfbound-workspace@0.0.0 test:local:assets
> node scripts/test-local-assets.mjs

serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
```

Boundary structure check:

```bash
rg -n "^## (Engine Boundary|Asset Import Boundary|Decoded Asset Catalog Boundary|Renderer And Projection Boundary|UI And Input Boundary|Audio Boundary|Persistence Boundary|Worker And Threading Boundary|Oracle Fixture And Test Boundary|App Shell Boundary)$|^Allowed dependencies:|^Forbidden dependencies:|Phase 8 stop signals" pm/roadmap/serfbound/adoption/runtime-module-boundaries.md
```

Output:

```text
91:## Engine Boundary
102:Allowed dependencies:
109:Forbidden dependencies:
131:## Asset Import Boundary
141:Allowed dependencies:
150:Forbidden dependencies:
164:## Decoded Asset Catalog Boundary
174:Allowed dependencies:
181:Forbidden dependencies:
195:## Renderer And Projection Boundary
205:Allowed dependencies:
213:Forbidden dependencies:
229:## UI And Input Boundary
239:Allowed dependencies:
247:Forbidden dependencies:
262:## Audio Boundary
271:Allowed dependencies:
278:Forbidden dependencies:
289:## Persistence Boundary
300:Allowed dependencies:
307:Forbidden dependencies:
319:## Worker And Threading Boundary
330:Allowed dependencies:
336:Forbidden dependencies:
343:Phase 8 stop signals that can justify a worker:
354:## Oracle Fixture And Test Boundary
363:Allowed dependencies:
370:Forbidden dependencies:
384:## App Shell Boundary
395:Allowed dependencies:
402:Forbidden dependencies:
```

PMO structural checks:

```bash
git diff --check
for f in pm/roadmap/serfbound/phase-*/story-[0-9]*.md; do rg -q "^## Problem$" "$f" && rg -q "^## Scope$" "$f" && rg -q "^## Acceptance criteria$" "$f" && rg -q "^## Test plan$" "$f" || echo "missing required section: $f"; done
bash -n .githooks/pre-commit .githooks/post-commit .githooks/work-log-read .githooks/work-log-summarize
```

Output: passed with no output.

## Manual review

Reviewed Phase 3 through Phase 6 current status and story files while drafting
the boundary document. The resulting "Review Against Planned Phases" table in
`runtime-module-boundaries.md` maps SB-3-01 through SB-6-04 to the owning
runtime boundary.

## Acceptance criteria — re-checked

- [x] `pm/roadmap/serfbound/adoption/runtime-module-boundaries.md` exists.
- [x] Every boundary names allowed dependencies and forbidden dependencies.
- [x] The engine boundary has no direct DOM, canvas, WebAudio, or storage
  dependency.
- [x] Asset import distinguishes browser file APIs from decoded asset catalogs.
- [x] Worker/threading boundary is defined as a Phase 8-deferred adapter with
  stop signals.

## Residual risk

SB-2-03 is an architecture artifact plus one mechanical dependency guard. Future
stories must add executable checks as each boundary becomes implementation code;
the document alone is not enough to prove Phase 3-8 runtime behavior.
