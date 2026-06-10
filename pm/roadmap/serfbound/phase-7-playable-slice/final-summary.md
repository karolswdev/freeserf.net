# Phase 7 Final Summary — Playable Slice

**Completed:** 2026-06-09.
**Status:** complete; Phase 8 ready.

## Result

Phase 7 produced the first browser-playable Serfbound loop. A user can import
local `SPAU.PA`, start a deterministic local game, select a map tile, build a
visible flag through the engine command route, save the browser-local game
snapshot, reload the browser, load the save, and see the built flag restored.

This phase did not implement full original gameplay parity. Roads, huts,
ownership, terrain/buildability rules, workers, logistics, economy effects, and
original savegame compatibility remain deliberately deferred. The delivered
slice proves the browser UI-engine-render-persistence loop without adding .NET
product runtime, desktop wrapper, native launcher, local companion process, or
bundled original assets.

## Shipped Stories

| Story | Commit | Evidence | Result |
|---|---|---|---|
| SB-7-01 Start local game from imported data | `88d676d` | [evidence-story-01](./evidence-story-01.md) | Started deterministic local games from imported `SPAU.PA` catalog metadata. |
| SB-7-02 Implement first visible build action | `801dc0a` | [evidence-story-02](./evidence-story-02.md) | Added `game.build` flag placement, visible WebGL render feedback, and recoverable duplicate/deferred build rejection. |
| SB-7-03 Add browser save/load loop | `913b05e` | [evidence-story-03](./evidence-story-03.md) | Added versioned browser-local save records, validated snapshot restore, reload/load browser flow, and recoverable save errors. |
| SB-7-04 Verify playable loop manually | `007bb41` | [evidence-story-04](./evidence-story-04.md) | Captured manual import/start/build/save/reload/load proof with local asset metadata and screenshots. |

## Exit Criteria Audit

| Exit criterion | Evidence | Status |
|---|---|---|
| A user can open the browser client, import local data, start a game, and see the settlement map | SB-7-01 browser test and SB-7-04 manual screenshot `story-04-manual-started-desktop.png` | passed |
| One visible build/road/flag interaction mutates engine state and rendered output | SB-7-02 unit/browser tests and SB-7-04 manual screenshot `story-04-manual-flag-saved-desktop.png` | passed |
| The playable path runs in the browser with no desktop companion process | SB-7-04 manual report plus boundary checks; Vite preview served static browser assets only | passed |
| Save/load works in browser persistence and passes at least one round-trip test | SB-7-03 unit/browser tests and SB-7-04 manual loaded-save screenshot | passed |
| Manual verification steps and screenshots/video are stored as evidence | `manual-playable-loop-script.md`, `manual-playable-loop-report.md`, and story-04 artifacts | passed |

## Verification Commands

These commands were used during the completion audit:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && npm run build:web'
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && node --input-type=module <manual Playwright script>'
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm test && npm run check:boundaries && npm run test:local:assets'
zsh -lc "source ~/.nvm/nvm.sh && cd serfbound && nvm use && SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 SERFBOUND_SPAU_PA='../serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA' npm run test:local:assets"
git diff --check
```

Representative output:

```text
44 unit tests passed.
2 chromium browser tests passed.
serfbound-boundaries-ok
serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
serfbound-local-asset-tests-ok: parsed SPAU.PA catalog and matched Phase 1 oracle metadata plus typed catalog and render-layer scene facts.
manual browserVersion=148.0.7778.96
manual visible save=Game loaded
manual data-serfbound-built-structure-count=1
manual nonblank WebGL pixels=144941
git diff --check passed with no output.
```

## Decisions

- Local game start requires imported `SPAU.PA` catalog metadata; generated
  preview terrain cannot become a running local game.
- The first visible action is flag placement because it proves UI command
  routing, engine mutation, render feedback, and persistence without pulling in
  full economy scope.
- Serfbound browser saves are separate from imported original data and use a v1
  Serfbound snapshot format.
- Manual proof can use Vite preview as a static local server for built browser
  assets. It is not a product runtime dependency or companion process.

## Known Limitations

- Original roads, huts, terrain/buildability rules, ownership, workers,
  logistics, and economy effects are not implemented.
- Save/load is Serfbound browser-local snapshot persistence, not original
  savegame compatibility.
- Manual evidence covers Chromium on macOS in this environment. Phase 8 owns
  browser/device matrix breadth, performance budgets, persistence hardening,
  worker strategy, and accessibility basics.

## Phase 8 Handoff

Phase 8 starts with SB-8-01: establish performance budgets. It inherits a
working browser-playable loop and should measure that loop before deciding
worker/threading architecture, persistence recovery depth, browser matrix
requirements, or accessibility remediation.
