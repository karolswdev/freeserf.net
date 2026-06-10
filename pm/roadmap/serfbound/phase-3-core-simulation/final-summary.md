# Phase 3 Final Summary — Core Simulation

**Completed:** 2026-06-09.
**Status:** complete; Phase 4 ready.

## Result

Phase 3 produced the first browser-native deterministic engine slice for
Serfbound. The engine package now has explicit numeric wrapping helpers,
fixture-backed RNG behavior, fixture-backed map geometry/projection behavior, a
source-derived state/tick skeleton, and a combined CI-safe parity test that
drives RNG, map movement, and tick advancement together.

This does not mean Serfbound is playable yet. It means the first simulation
primitives are real TypeScript product code, default tests prove them without
.NET or original assets, and later data/renderer/playable phases have a
concrete engine boundary to build on.

## Shipped Stories

| Story | Commit | Evidence | Result |
|---|---|---|---|
| SB-3-01 Port deterministic numeric/random rules | `805c4f5` | [evidence-story-01](./evidence-story-01.md) | Added fixed-width numeric helpers and `FreeserfRandom`, matched against `rng-fixed-seed-sequence.json`. |
| SB-3-02 Port map geometry primitive | `361a7da` | [evidence-story-02](./evidence-story-02.md) | Added direction, wrapped map position, movement, distance, and projection helpers, matched against `map-geometry-facts.json`. |
| SB-3-03 Add state and tick skeleton | `51605d0` | [evidence-story-03](./evidence-story-03.md) | Added `SerfboundGameState`, source-derived tick/time/counter behavior, and stable snapshot/restore tests. |
| SB-3-04 Prove first simulation parity | `5bbd097` | [evidence-story-04](./evidence-story-04.md) | Added the combined engine parity proof over RNG, map movement, and tick advancement, then closed Phase 3. |

## Protected Engine Surface

| Surface | Product artifact | Proof |
|---|---|---|
| Fixed-width numeric rules | `@serfbound/engine` helpers `uint16`, `int16`, `uint32`, `rotateRight16` | `engine-random.test.mjs` edge cases and RNG fixture parity |
| RNG | `FreeserfRandom` | Every case/step in `rng-fixed-seed-sequence.json` |
| Map geometry | `MapGeometry`, direction helpers | Every size, movement, distance, and projection sample in `map-geometry-facts.json` |
| State/tick skeleton | `SerfboundGameState` | Stable snapshot, source-derived tick/time/counter tests, snapshot round-trip |
| Combined parity | `engine-simulation-parity.test.mjs` | One state instance consumes RNG/map fixtures while advancing ticks |

## Exit Criteria Audit

| Exit criterion | Evidence | Status |
|---|---|---|
| Data-free parity tests pass against at least one Phase 1 oracle fixture | `npm test` runs RNG, map geometry, and combined simulation parity tests with local asset variables unset | passed |
| Numeric determinism and wrapping/overflow behavior are documented and tested | `serfbound/packages/engine/README.md`, `engine-random.test.mjs`, SB-3-01 evidence | passed |
| Map/coordinate primitives have focused unit tests | `engine-map-geometry.test.mjs`, SB-3-02 evidence | passed |
| State/tick skeleton has at least one deterministic round-trip or snapshot comparison | `engine-state.test.mjs`, SB-3-03 evidence | passed |
| Known divergences from `Freeserf.Core` are documented with rationale | Story notes and engine docs record no intentional fixture divergences and list explicit scope boundaries | passed |

## Verification Commands

These commands were used during the completion audit:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm test && npm run check:boundaries && npm run test:local:assets'
for n in 01 02 03 04; do test -f pm/roadmap/serfbound/phase-3-core-simulation/evidence-story-$n.md && echo evidence-ok-$n || echo missing-evidence-$n; rg -q "\*\*Status:\*\* done" pm/roadmap/serfbound/phase-3-core-simulation/story-$n-*.md && echo story-done-$n || echo story-not-done-$n; done
git ls-files | rg -n '(^|/)(SPA.*\.PA|SOUNDS\.PA|SERF\.EXE|.*\.adf$|sounds/|music/|serfbound-local-data/)' || true
git diff --check
```

Representative output:

```text
1..17
# tests 17
# pass 17

✓  1 [chromium] › tests/browser/static-shell.spec.ts:8:1 › static app shell renders without original data or a desktop companion
1 passed

serfbound-boundaries-ok
serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
```

## Decisions

- Keep deterministic simulation primitives in `@serfbound/engine` with no DOM,
  Canvas, WebAudio, storage, local file, desktop, native, or .NET dependency.
- Treat Phase 1 CI-safe fixtures as default test inputs, not product runtime
  dependencies.
- Preserve captured `Freeserf.Core/Random.cs`, `MapGeometry.cs`, and
  `CoordinateSpace.cs` behavior for the fixture-backed surfaces.
- Use a browser-native JSON snapshot for the first state/tick skeleton while
  deferring savegame and dirty-state serializer compatibility until a dedicated
  fixture exists.
- Treat the combined engine proof as a parity start signal, not a full gameplay
  parity claim.

## Known Limitations

- Phase 3 does not import original DOS/Amiga assets. Phase 4 owns local
  browser import and catalog parsing.
- Phase 3 does not generate terrain, mutate map objects, run pathfinding,
  update players/AI, render, play audio, save/load games, or implement a
  playable loop.
- Serializer fixtures remain selected but uncaptured. Browser save/load and
  byte-level serializer parity stay unproven until a later story captures and
  consumes `serializer.state-fixtures`.
- The map spiral helper only includes the first ring needed by captured
  projection samples; full map search/pathfinding needs later evidence.
- Homebrew Node/npm remain broken in this environment due missing
  `libllhttp.9.3.dylib`; nvm Node `22.21.0` remains the documented path.

## Phase 4 Handoff

Phase 4 starts with SB-4-01, implementing the browser data import boundary.
The first user-visible gap is local `.PA` selection and recoverable missing or
invalid data state. The existing local `SPAU.PA` source remains ignored under
`serfbound-local-data/`; Phase 4 must keep CI useful without that data and must
not commit, host, bundle, or redistribute original asset bytes.
