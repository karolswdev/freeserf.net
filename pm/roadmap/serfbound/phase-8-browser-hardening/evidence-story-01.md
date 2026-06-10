# Evidence — SB-8-01 — Establish Performance Budgets

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `serfbound/scripts/measure-performance.mjs` - adds repeatable Node and
  Chromium measurement for engine ticks, frame cadence, import, build, save,
  reload/load, WebGL nonblank pixels, and app state.
- `serfbound/package.json` - adds `npm run measure:performance`.
- `pm/roadmap/serfbound/phase-8-browser-hardening/performance-budgets.md` -
  records budget thresholds, baseline measurements, environment metadata, and
  stop signals.
- `pm/roadmap/serfbound/phase-8-browser-hardening/artifacts/story-01-performance-baseline-local.json`
  - local Chromium baseline against user-provided `SPAU.PA`.
- `pm/roadmap/serfbound/phase-8-browser-hardening/story-01-performance-budgets.md`
  - marks SB-8-01 done.
- `pm/roadmap/serfbound/phase-8-browser-hardening/story-02-worker-threading-model.md`
  - opens SB-8-02 as ready.
- `pm/roadmap/serfbound/phase-8-browser-hardening/current-phase-status.md`,
  `pm/roadmap/serfbound/README.md`, and
  `pm/roadmap/serfbound/adoption/phase-gate-verification-matrix.md` - record
  the Phase 8 performance baseline and next gap.

## Behavior protected

- Performance measurement is repeatable through `npm run measure:performance`.
- Simulation tick cost is measured outside the browser with the built engine
  package.
- Browser frame cadence is measured in Chromium after the playable slice is
  loaded.
- Import, start, build, save, reload, and load timings are measured through the
  browser UI path.
- Local `SPAU.PA` measurements cite path, size, and checksum only; original
  data bytes remain ignored and untracked.
- Stop signals are explicit enough to catch first-slice regressions before
  worker/threading decisions.

## Baseline command

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm test && SERFBOUND_PERF_OUTPUT="../.tmp/performance-generated-gate.json" npm run measure:performance && npm run check:boundaries && npm run test:local:assets && SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 SERFBOUND_SPAU_PA="../serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA" npm run test:local:assets && cd .. && git diff --check'
```

Output summary:

```text
44 unit tests passed.
2 chromium browser tests passed.
serfbound-performance-baseline-written: /Users/karol/dev/code/settlers-clone/freeserf.net/.tmp/performance-generated-gate.json
serfbound-performance-summary: tickAvg=0.000070ms frameP95=9.700ms import=200.383ms save=95.972ms reloadLoad=225.307ms
serfbound-boundaries-ok
serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
serfbound-local-asset-tests-ok: parsed SPAU.PA catalog and matched Phase 1 oracle metadata plus typed catalog and render-layer scene facts.
git diff --check passed with no output.
```

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && npm run build:web && SERFBOUND_PERF_SPAU_PA="../serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA" npm run measure:performance'
```

Output summary:

```text
TypeScript build passed.
Vite production build passed.
serfbound-performance-baseline-written: /Users/karol/dev/code/settlers-clone/freeserf.net/pm/roadmap/serfbound/phase-8-browser-hardening/artifacts/story-01-performance-baseline-local.json
serfbound-performance-summary: tickAvg=0.000067ms frameP95=9.700ms import=203.855ms save=87.651ms reloadLoad=225.290ms
```

## Baseline artifact

Key facts from `artifacts/story-01-performance-baseline-local.json`:

```text
schemaVersion=1
kind=serfbound.performance-baseline
node=v22.21.0
platform=darwin arm64
browser=chromium 148.0.7778.96
viewport=1280x900
asset source=local-spau-pa
asset byteLength=1282805
asset sha256=4a652471c4185d324b16fadd736f2464210df5d8938136aaa0ccc4a43c790ca2
simulation iterations=50000
simulation average=0.000067 ms
frame p95=9.700 ms
import=203.855 ms
save=87.651 ms
reload/load=225.290 ms
nonblank WebGL pixels=144941
built structures=1
```

## CI-safe measurement smoke

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && SERFBOUND_PERF_OUTPUT="../.tmp/performance-generated-smoke.json" npm run measure:performance'
```

Output summary:

```text
serfbound-performance-baseline-written: /Users/karol/dev/code/settlers-clone/freeserf.net/.tmp/performance-generated-smoke.json
serfbound-performance-summary: tickAvg=0.000069ms frameP95=9.500ms import=196.103ms save=87.694ms reloadLoad=216.857ms
```
