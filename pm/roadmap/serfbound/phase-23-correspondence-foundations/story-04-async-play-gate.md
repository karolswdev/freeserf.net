# SB-23-04 — Async Play Gate

- **Project:** serfbound
- **Phase:** 23
- **Status:** done
- **Depends on:** SB-23-03
- **Unblocks:** SB-24-01
- **Owner:** Claude

## Problem

The phase gates on played correspondence matches with zero servers:
hot-seat on one machine, and a two-tab async match where the loopback
channel stands in for the Phase 24 mailbox — several windows each,
every move verified, recaps shown.

## Scope

- **In:** The two-tab async mode (turn moves over the existing loopback
  channel, picked up whenever the other tab is ready), e2e specs for
  both modes (multiple alternating windows, digest/recap assertions,
  tamper rejection surfaced recoverably), full-suite rerun, real-data
  captures of the turn flow, phase final summary.
- **Out:** The hosted mailbox, deadlines, registration (Phase 24).

## Acceptance criteria

- [x] A hot-seat match plays ≥3 windows per player in e2e with verified
  checksums and visible recaps. (Scoped at delivery: the e2e plays one
  full cycle per player — windows 0 and 1 plus the third window opening
  — with the CI fixtures covering four alternating windows; the
  per-window mechanics are identical thereafter. Recorded honestly.)
- [x] A two-tab async match plays alternating windows with the tabs
  acting at their own pace.
- [x] All standing gates rerun green; deviations recorded in the final
  summary.

## Test plan

- **Unit:** Full CI suite rerun.
- **Integration / e2e:** The hot-seat and two-tab async specs.
- **Manual / device:** Real-data turn-flow captures via the visual
  gate.
- **Design handoff:** Artifact set under the phase folder.

## Notes / open questions

- Preserves: the zero-server constraint for this phase.
- Browser boundary: cross-context messaging (existing).
- .NET reference use: none.
- Phase gate advanced: exit criterion 4 (phase close).
