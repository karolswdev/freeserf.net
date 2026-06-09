# SB-3-04 — Prove First Simulation Parity

- **Project:** serfbound
- **Phase:** 3
- **Status:** done
- **Depends on:** SB-3-01, SB-3-02, SB-3-03, SB-2-02
- **Unblocks:** SB-5-03, SB-7-01
- **Owner:** Codex

## Problem

The first engine slice is not credible until it passes a parity test against a
reference oracle. This story turns primitives into evidence that Serfbound can
match known behavior.

## Scope

- **In:** One end-to-end data-free parity test using Phase 1 fixture(s), test
  output, divergence notes, and phase-status updates.
- **Out:** Full engine parity, local asset import, rendering, UI, or broad
  gameplay systems.

## Acceptance criteria

- [x] A parity test consumes at least one Phase 1 CI-safe fixture.
- [x] The test passes locally and is suitable for default CI.
- [x] Any mismatch is either fixed or recorded as an intentional divergence with
  user-visible consequences.
- [x] Phase 3 status records what behavior is now protected.
- [x] Later renderer/playable stories can name the protected engine behavior.

## Test plan

- **Unit:** Run the parity test suite.
- **Integration / Cypress:** n/a.
- **Manual / device:** Inspect output diff on a forced mismatch to confirm it is
  actionable.
- **Design handoff:** n/a - non-visual.

## Notes / open questions

Shipped `engine-simulation-parity.test.mjs` as the first combined engine proof.
It consumes both Phase 1 CI-safe fixtures, drives a single `SerfboundGameState`
through RNG mutation, map movement, and tick advancement, and compares RNG/map
facts against captured oracle data.

No intentional behavior divergence exists for the protected fixture-backed
surface. Scope boundaries remain explicit: this is not full gameplay parity,
asset import, terrain mutation, pathfinding, player AI, rendering, savegame
serializer parity, or a playable loop.
