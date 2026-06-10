# SB-19-01 — Performance at Scale

- **Project:** serfbound
- **Phase:** 19
- **Status:** done
- **Depends on:** SB-18-05
- **Unblocks:** SB-19-02
- **Owner:** unassigned

## Problem

A 512x512 map with a full economy, hundreds of serfs, and AI opponents is the stress case. Measure it honestly, set budgets, and hit them with render batching, dirty updates, and allocation discipline.

## Scope

- **In:** Extended measurement harness (large-map scenarios, tick time, frame cadence, memory), recorded budgets per scenario, render-path optimizations (dirty-region sprite updates, buffer reuse), allocation audits in hot sim paths.
- **Out:** Worker threading (SB-19-02), gameplay changes.

## Acceptance criteria

- [x] Baselines and budgets recorded for defined scenarios.
- [x] Optimizations hit budgets with before/after measurements.
- [x] No sim behavior change (parity fixtures still green).

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
