# SB-13-05 — Animated Settlement Visual Gate

- **Project:** serfbound
- **Phase:** 13
- **Status:** done
- **Depends on:** SB-13-04
- **Unblocks:** SB-14-01
- **Owner:** unassigned

## Problem

The phase gate: prove with real data that the settlement is alive — serfs
walking, carrying, digging, hammering — at acceptable performance, and that
the whole loop survives save/load.

## Scope

- **In:** Real-data capture (stills + a short frame sequence) of an active
  settlement; performance measurement against Phase 8 baselines with tens of
  active serfs; save/load round-trip of full serf state; phase close-out.
- **Out:** New behavior.

## Acceptance criteria

- [x] Capture shows serfs animating through transport and construction with
  player colors, reviewed in evidence.
- [x] Tick + frame timing stays within recorded baselines.
- [x] Save/load restores serfs mid-task without desync.

## Test plan

- **Unit:** n/a — gate story.
- **Integration / Cypress:** Long-running browser scenario test.
- **Manual / device:** Real-data capture review.
- **Design handoff:** Stills + capture under phase artifacts.

## Notes / open questions

- Phase gate advanced: closes Phase 13.
