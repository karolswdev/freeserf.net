# Phase 8 Performance Budgets

**Story:** SB-8-01 — Establish Performance Budgets
**Status:** baseline v1
**Measured:** 2026-06-09

## Scope

These budgets apply to the current first playable slice: import local
`SPAU.PA`, start a local game, build one flag, save, reload, load, and keep the
WebGL2 map responsive in desktop Chromium.

They are early regression tripwires, not final release promises. Later Phase 8
stories own worker strategy, broader browser compatibility, storage recovery,
accessibility, and mobile/device breadth.

## Representative Environment

- OS/kernel: Darwin 25.2.0 arm64
- Node: v22.21.0
- Browser: Playwright Chromium 148.0.7778.96
- Viewport: 1280x900
- Asset: local user-provided `SPAU.PA`
- Asset size: 1,282,805 bytes
- Asset SHA-256:
  `4a652471c4185d324b16fadd736f2464210df5d8938136aaa0ccc4a43c790ca2`
- Baseline artifact:
  `artifacts/story-01-performance-baseline-local.json`

## Budgets And Baseline

| Area | Budget | Local baseline | Status |
|---|---:|---:|---|
| Simulation tick average | <= 0.05 ms | 0.000067 ms | pass |
| Desktop Chromium frame p95 | <= 20 ms | 9.700 ms | pass |
| Local `SPAU.PA` import | <= 1000 ms | 203.855 ms | pass |
| Save current game | <= 100 ms | 87.651 ms | pass |
| Reload and load saved game | <= 1000 ms | 225.290 ms | pass |

Additional observed browser state:

- Nonblank WebGL pixels after load: 144,941
- Rendered primitive count after load: 1,046
- Restored built structures: 1
- Scene source: `dos-pa-catalog`
- Renderer: `webgl2`

## Stop Signals

- Average simulation tick exceeds 0.05 ms on the first playable slice.
- Desktop Chromium requestAnimationFrame p95 exceeds 20 ms.
- Local `SPAU.PA` import exceeds 1000 ms on the representative local machine.
- Browser save exceeds 100 ms.
- Browser reload plus load exceeds 1000 ms.
- The playable-loop measurement fails any step or reports zero WebGL nonblank
  pixels.

## Follow-Ups

- SB-8-02 must cite this baseline when deciding whether workers are justified.
- SB-8-03 must harden persistence recovery beyond the happy-path save/load
  timing measured here.
- SB-8-04 must expand measurement and compatibility beyond desktop Chromium.
