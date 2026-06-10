# SB-27-04 — Online Play Gate

- **Project:** serfbound
- **Phase:** 27
- **Status:** backlog
- **Depends on:** SB-27-03
- **Unblocks:** —
- **Owner:** unassigned

## Problem

The phase gates on a played online game and on operational honesty:
the full e2e suite covering online flows, NAT-outcome measurement wired
to the recorded TURN stop signal, and docs that tell players exactly
what is hosted (a signaling relay) and what never leaves their machine.

## Scope

- **In:** Full-suite rerun with the online e2e set, local
  privacy-respecting NAT outcome counters surfaced in the existing
  error-report path, player/developer docs for online play, phase final
  summary.
- **Out:** TURN deployment (separate decision if the signal trips).

## Acceptance criteria

- [ ] All standing gates plus the online e2e set pass at the closing
  commit.
- [ ] NAT outcomes are measurable against the ~15% stop signal without
  telemetry.
- [ ] Docs cover online play, the relay's role, and the privacy
  boundary.

## Test plan

- **Unit:** Full CI suite rerun.
- **Integration / e2e:** Full browser suite including online scenarios.
- **Manual / device:** A real cross-network match recorded in evidence.
- **Design handoff:** Artifact set under the phase folder.

## Notes / open questions

- Preserves: telemetry-free operations from Phase 20.
- Browser boundary: none new.
- .NET reference use: none.
- Phase gate advanced: exit criterion 4 (phase close).
