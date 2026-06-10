# SB-8-01 — Establish Performance Budgets

- **Project:** serfbound
- **Phase:** 8
- **Status:** done
- **Depends on:** SB-7-04
- **Unblocks:** SB-8-02, SB-9-04
- **Owner:** unassigned

## Problem

Browser performance must be measured before release work. Serfbound needs
budgets for simulation, rendering, import, and save/load so regressions are
visible.

## Scope

- **In:** Measurement harness, representative browser/device notes, frame/tick
  budgets, import/save timings, and baseline results.
- **Out:** Full optimization pass, worker implementation, multiplayer scaling,
  or final release signoff.

## Acceptance criteria

- [x] Performance budget document exists.
- [x] Baseline measurements cover simulation tick and render frame time.
- [x] Import and save/load timing are measured for local `SPAU.PA` flow where
  possible.
- [x] Results include browser/device/viewport metadata.
- [x] At least one stop signal is defined for unacceptable performance.

## Test plan

- **Unit:** Run any performance helper tests if added.
- **Integration / Cypress:** Optional browser performance smoke capture.
- **Manual / device:** Capture baseline on representative local browsers.
- **Design handoff:** n/a - performance evidence.

## Notes / open questions

Budgets can start rough. They must be explicit enough to catch obvious
regressions.

Budget artifacts:

- `performance-budgets.md`
- `artifacts/story-01-performance-baseline-local.json`
- `serfbound/scripts/measure-performance.mjs`
