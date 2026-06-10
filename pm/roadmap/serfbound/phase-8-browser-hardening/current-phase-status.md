# Phase 8 — Browser Hardening

**Last updated:** 2026-06-09.

**Status:** complete.

## Goal

Make the playable slice resilient under real browser constraints: persistence
limits, performance, workers, memory, reloads, device variation, and failure
recovery.

## Scope

- **In:** Performance budgets, profiling, worker/off-main-thread strategy,
  memory pressure, IndexedDB limits/migrations, save recovery, browser matrix,
  and accessibility basics.
- **Out:** Major new gameplay systems, desktop packaging, multiplayer, or brand
  campaign work.

## Non-negotiable constraints

- Final product code is pure browser.
- No .NET product runtime, desktop wrapper, native launcher, local companion
  process, or browser shell around a desktop runtime.
- Original DOS/Amiga data is user-provided only; Serfbound does not commit,
  host, bundle, or redistribute it.

## Exit criteria (evidence required)

- [x] Tick/render frame budgets are measured on representative browsers.
- [x] Main-thread and worker strategy is documented and implemented or
  explicitly deferred.
- [x] Persistence survives reloads and has recovery/reset behavior.
- [x] Browser compatibility matrix is documented with at least Chrome, Firefox,
  Safari/WebKit, and mobile Safari/Chrome positions.
- [x] Accessibility basics are verified for keyboard, focus, contrast, and
  reduced-motion expectations where applicable.

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-8-01 | Establish performance budgets | done | story-01-performance-budgets.md | evidence-story-01.md |
| SB-8-02 | Decide worker and threading model | done | story-02-worker-threading-model.md | evidence-story-02.md |
| SB-8-03 | Harden persistence recovery | done | story-03-persistence-recovery.md | evidence-story-03.md |
| SB-8-04 | Verify browser compatibility | done | story-04-browser-compatibility.md | evidence-story-04.md |

## Where we are

Phase 8 is complete. SB-8-01 added a repeatable performance measurement script
and first-slice budgets. SB-8-02 chose a main-thread-first browser runtime with
Workers explicitly deferred until measured stop signals trip. SB-8-03 hardened
persistence recovery around corrupt, unsupported-version, failed, and
quota-limited browser storage. SB-8-04 proved the first playable slice across
desktop Chromium, Firefox, WebKit, mobile Chrome, and mobile Safari Playwright
positions, then closed the remaining compatibility and accessibility exit
criteria. Phase 9 is ready to begin release operations.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Performance issues appear after architecture locks | medium | Start measurement as soon as Phase 7 is playable | Tick/render time is unmeasured at release-candidate stage |
| IndexedDB/storage behavior corrupts local data | medium | Add migrations and reset/reimport flows | User cannot recover from bad persisted state |
| Mobile browser constraints invalidate assumptions | medium | Test mobile early in this phase | Product only works on the developer machine |

## Decisions made (this phase)

- 2026-06-09 — Initial Phase 8 budgets target the current first playable slice:
  average simulation tick <= 0.05 ms, desktop Chromium frame p95 <= 20 ms,
  local `SPAU.PA` import <= 1000 ms, save <= 100 ms, and reload/load <= 1000
  ms. These are regression tripwires, not release-grade performance promises —
  SB-8-01.
- 2026-06-09 — Keep the current playable slice main-thread-first. Workers are
  deferred because the measured tick, frame, import, save, and reload/load
  costs remain within SB-8-01 budgets. Revisit only when the stop signals in
  `worker-threading-decision.md` trip — SB-8-02.
- 2026-06-09 — Persistence recovery treats corrupt or unsupported-version
  imported-data and save records as explicit recoverable errors. `Clear data`
  resets imported data; `Clear save` resets only the local-game save and keeps
  imported data intact — SB-8-03.
- 2026-06-09 — Browser compatibility baseline passes across desktop Chromium,
  desktop Firefox, desktop WebKit, mobile Chrome, and mobile Safari Playwright
  positions. Physical mobile device contradiction remains a Phase 9 release
  readiness stop signal — SB-8-04.

## Decisions deferred

- Worker implementation boundary — deferred until measured pressure justifies a
  dedicated PMO story. The first candidate is deterministic simulation only,
  not a broad app/render/persistence Worker.
