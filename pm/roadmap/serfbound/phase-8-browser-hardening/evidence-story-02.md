# Evidence - SB-8-02 - Decide Worker And Threading Model

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `pm/roadmap/serfbound/phase-8-browser-hardening/worker-threading-decision.md`
  - records the main-thread-first decision, rejected/deferred worker options,
  future worker message boundary, browser notes, and stop signals.
- `pm/roadmap/serfbound/phase-8-browser-hardening/story-02-worker-threading-model.md`
  - marks SB-8-02 done.
- `pm/roadmap/serfbound/phase-8-browser-hardening/story-03-persistence-recovery.md`
  - opens SB-8-03 as ready.
- `pm/roadmap/serfbound/phase-8-browser-hardening/current-phase-status.md`,
  `pm/roadmap/serfbound/README.md`, and
  `pm/roadmap/serfbound/adoption/phase-gate-verification-matrix.md` - record
  that Phase 8 now has both a performance baseline and a worker/threading
  strategy.

## Behavior protected

- Serfbound remains pure browser for normal play.
- No .NET runtime, desktop wrapper, native launcher, local companion process,
  or local-server dependency is introduced.
- Workers are not added without measured pressure.
- If future measurements require a worker, the first candidate boundary is
  deterministic simulation only.
- Any future worker story must test message contracts, transfer/clone cost,
  deterministic equivalence, browser compatibility, and failure recovery before
  the path can be enabled.

## Decision evidence

The decision cites the SB-8-01 baseline from `performance-budgets.md` and
`artifacts/story-01-performance-baseline-local.json`.

```text
simulation tick average: 0.000067 ms, budget <= 0.05 ms
desktop Chromium frame p95: 9.700 ms, budget <= 20 ms
local SPAU.PA import: 203.855 ms, budget <= 1000 ms
save current game: 87.651 ms, budget <= 100 ms
reload and load saved game: 225.290 ms, budget <= 1000 ms
nonblank WebGL pixels after load: 144,941
rendered primitive count after load: 1,046
restored built structures: 1
browser: Playwright Chromium 148.0.7778.96
viewport: 1280x900
renderer: WebGL2
```

Decision result:

```text
Main-thread-first is chosen for the current playable browser slice.
Workers are explicitly deferred until a documented stop signal trips.
```

## Baseline command

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm test && SERFBOUND_PERF_OUTPUT="../.tmp/performance-generated-gate.json" npm run measure:performance && npm run check:boundaries && npm run test:local:assets && SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 SERFBOUND_SPAU_PA="../serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA" npm run test:local:assets && cd .. && git diff --check'
```

Output summary:

```text
Node v22.21.0 selected from serfbound/.nvmrc.
44 unit tests passed.
2 Chromium browser tests passed.
Vite production build passed.
serfbound-performance-baseline-written: /Users/karol/dev/code/settlers-clone/freeserf.net/.tmp/performance-generated-gate.json
serfbound-performance-summary: tickAvg=0.000069ms frameP95=9.900ms import=194.039ms save=85.129ms reloadLoad=208.755ms
serfbound-boundaries-ok
serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
serfbound-local-asset-tests-ok: parsed SPAU.PA catalog and matched Phase 1 oracle metadata plus typed catalog and render-layer scene facts.
git diff --check passed with no output.
```
