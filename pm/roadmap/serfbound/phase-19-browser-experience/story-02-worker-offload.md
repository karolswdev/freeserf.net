# SB-19-02 — Worker Offload Decision and Implementation

- **Project:** serfbound
- **Phase:** 19
- **Status:** done
- **Depends on:** SB-19-01
- **Unblocks:** SB-19-03
- **Owner:** unassigned

## Problem

Phase 8 deferred Web Workers until measured stop signals trip. With full-game load measured, decide - and if warranted, move the sim tick off the main thread under the recorded worker contract.

## Scope

- **In:** Decision record from SB-19-01 data; if adopted - sim-in-worker with message contracts, transferable snapshots, deterministic equivalence proof, failure recovery; if rejected - the measurements that justify staying main-thread.
- **Out:** Render-in-worker (OffscreenCanvas) unless data demands it.

## Acceptance criteria

- [x] A decision record exists with measurements either way.
- [x] If adopted - parity fixtures pass identically under workers.
- [x] If adopted - worker crash recovers without losing the session.

## Test plan

- **Unit:** Logic-level tests where applicable.
- **Integration / Cypress:** Browser tests incl. mobile positions.
- **Manual / device:** Real-device sessions recorded as evidence.
- **Design handoff:** Screenshots/metrics under phase artifacts.

## Notes / open questions

- Preserves: gameplay behavior unchanged (parity fixtures stay green).
- Browser boundary: service workers, touch/pointer, PWA install, perf.
- .NET reference use: none.
- Phase gate advanced: see phase exit criteria.
