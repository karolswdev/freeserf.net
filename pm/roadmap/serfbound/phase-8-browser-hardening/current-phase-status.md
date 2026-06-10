# Phase 8 — Browser Hardening

**Last updated:** 2026-06-09.

**Status:** ready.

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

- [ ] Tick/render frame budgets are measured on representative browsers.
- [ ] Main-thread and worker strategy is documented and implemented or
  explicitly deferred.
- [ ] Persistence survives reloads and has recovery/reset behavior.
- [ ] Browser compatibility matrix is documented with at least Chrome, Firefox,
  Safari/WebKit, and mobile Safari/Chrome positions.
- [ ] Accessibility basics are verified for keyboard, focus, contrast, and
  reduced-motion expectations where applicable.

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-8-01 | Establish performance budgets | ready | story-01-performance-budgets.md | — |
| SB-8-02 | Decide worker and threading model | backlog | story-02-worker-threading-model.md | — |
| SB-8-03 | Harden persistence recovery | backlog | story-03-persistence-recovery.md | — |
| SB-8-04 | Verify browser compatibility | backlog | story-04-browser-compatibility.md | — |

## Where we are

Phase 8 is ready. Phase 7 has produced the first browser-playable loop with
manual evidence, so the next responsible move is SB-8-01: measure tick/render
budgets on the playable slice before adding hardening work.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Performance issues appear after architecture locks | medium | Start measurement as soon as Phase 7 is playable | Tick/render time is unmeasured at release-candidate stage |
| IndexedDB/storage behavior corrupts local data | medium | Add migrations and reset/reimport flows | User cannot recover from bad persisted state |
| Mobile browser constraints invalidate assumptions | medium | Test mobile early in this phase | Product only works on the developer machine |

## Decisions made (this phase)

- none yet.

## Decisions deferred

- Worker-first vs main-thread-first simulation — revisit in SB-8-02 — default to
  simple main-thread until measured pressure justifies workers.
