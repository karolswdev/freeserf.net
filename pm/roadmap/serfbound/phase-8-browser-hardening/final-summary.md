# Phase 8 Final Summary - Browser Hardening

**Completed:** 2026-06-09.
**Status:** complete; Phase 9 ready.

## Result

Phase 8 made the first playable slice measurable and resilient under browser
constraints. It added performance budgets, chose a main-thread-first threading
strategy from measured evidence, hardened browser persistence recovery, and
proved the slice across the required browser compatibility positions.

This phase did not implement full original gameplay, audio, physical mobile
device certification, low-end hardware profiling, workers, WebGPU,
OffscreenCanvas, or original savegame compatibility. Those remain outside the
current first playable browser slice unless later evidence makes them release
blockers.

## Shipped Stories

| Story | Commit | Evidence | Result |
|---|---|---|---|
| SB-8-01 Establish performance budgets | `2553502` | [evidence-story-01](./evidence-story-01.md) | Added repeatable performance measurement and first-slice budgets. |
| SB-8-02 Decide worker and threading model | `1fe641a` | [evidence-story-02](./evidence-story-02.md) | Chose main-thread-first and deferred Workers until stop signals trip. |
| SB-8-03 Harden persistence recovery | `9e60f29` | [evidence-story-03](./evidence-story-03.md) | Added corrupt/version-mismatch reset paths and quota/write failure feedback. |
| SB-8-04 Verify browser compatibility | `9c62106` | [evidence-story-04](./evidence-story-04.md) | Added five-position compatibility smoke, matrix, accessibility basics, and final Phase 8 closure. |

## Exit Criteria Audit

| Exit criterion | Evidence | Status |
|---|---|---|
| Tick/render frame budgets are measured on representative browsers | `performance-budgets.md`, `artifacts/story-01-performance-baseline-local.json`, and SB-8-01 evidence | passed |
| Main-thread and worker strategy is documented and implemented or explicitly deferred | `worker-threading-decision.md` and SB-8-02 evidence | passed |
| Persistence survives reloads and has recovery/reset behavior | `persistence-recovery-guide.md`, SB-8-03 unit tests, and SB-8-03 browser tests | passed |
| Browser compatibility matrix is documented with at least Chrome, Firefox, Safari/WebKit, and mobile Safari/Chrome positions | `browser-compatibility-matrix.md` and `artifacts/story-04-browser-compatibility-report.json` | passed |
| Accessibility basics are verified for keyboard, focus, contrast, and reduced-motion expectations where applicable | SB-8-04 compatibility smoke checks visible import-control focus, contrast min 8.66, and reduced-motion state | passed |

## Verification Commands

These commands were used during the completion audit:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && npm run test:compatibility'
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm test && npm run test:compatibility && SERFBOUND_PERF_OUTPUT="../.tmp/performance-generated-gate.json" npm run measure:performance && npm run check:boundaries && npm run test:local:assets && SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 SERFBOUND_SPAU_PA="../serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA" npm run test:local:assets && cd .. && git diff --check'
```

Representative output:

```text
46 unit tests passed.
5 Chromium browser tests passed.
5 compatibility browser tests passed across desktop-chromium, desktop-firefox,
desktop-webkit, mobile-chrome, and mobile-safari.
serfbound-performance-summary: tickAvg=0.000069ms frameP95=9.600ms import=188.927ms save=84.752ms reloadLoad=201.006ms
serfbound-boundaries-ok
serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
serfbound-local-asset-tests-ok: parsed SPAU.PA catalog and matched Phase 1 oracle metadata plus typed catalog and render-layer scene facts.
git diff --check passed with no output.
```

## Decisions

- Keep performance budgets as regression tripwires for the first playable
  slice; they are not release-grade promises for full gameplay.
- Keep the runtime main-thread-first until worker stop signals trip.
- Treat corrupt and unsupported-version browser storage as recoverable reset
  paths, not silent missing data.
- Use Playwright browser/device profiles as Phase 8 compatibility evidence, and
  make physical device contradictions a Phase 9 release-readiness stop signal.

## Known Limitations

- Mobile compatibility evidence is Playwright device emulation, not physical
  iOS/Android hardware.
- The compatibility matrix covers the first playable slice only.
- No original audio, full economy, worker logistics, AI, roads, huts,
  ownership, or original savegame compatibility is implemented.
- Physical mobile checks, release artifact audit, docs, and CI evidence are
  owned by Phase 9.

## Phase 9 Handoff

Phase 9 starts with SB-9-01: add release CI checks. It inherits a browser-only,
data-free test spine plus optional local asset checks, performance budgets,
compatibility evidence, and persistence recovery behavior.
