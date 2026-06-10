# Evidence — SB-23-01 — Turn-Window Match Model

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/engine/src/correspondence.ts` —
  `CorrespondenceMatch`: alternating session windows over the Phase 22
  primitives; live play queues commands for the next tick (the
  canonical advance → apply-stamped-actions → engine-at-16-ticks order
  that makes replay bit-exact), captures accepted actions into the
  window move (`takeMove`), and `applyMove` re-simulates a received
  window trustlessly — rejecting out-of-turn/wrong-window/wrong-player
  moves before simulation and stamp-range violations, opponent-unit
  commands, rules-rejected actions, and checksum mismatches with full
  state restoration by history replay. `resumeCorrespondenceMatch`
  reopens a match anywhere by replaying and re-verifying from tick 0.
- `serfbound/packages/engine/src/session-protocol.ts` — the
  `window-move` message (player, window, endTick, endChecksum, stamped
  actions) with structural decode validation.
- `pm/roadmap/serfbound/phase-23-correspondence-foundations/match-model.md`
  — the design handoff.
- `serfbound/tests/ci/engine-correspondence.test.mjs` — five fixtures.

## Verification artifacts

```text
npm run test:ci -> # tests 201 / pass 201 / fail 0
npx playwright test -> 11 passed (1.4m)
node --test tests/ci/engine-correspondence.test.mjs ->
  ok 1 - a match advances window by window to identical checksums
  ok 2 - tampered and rules-invalid moves reject and restore the match
  ok 3 - out-of-turn and wrong-window moves reject without simulation
  ok 4 - a match resumes anywhere by replaying the accepted history
  ok 5 - the window-move message round-trips on the session protocol
```

- Two match instances play four alternating 1024-tick windows (castles
  founded in windows 0 and 1, two autopilot windows) to identical
  checksums after every transfer.
- Checksum tampering, opponent-unit commands, and rules-violating
  actions each reject with their stable reason and restore the receiver
  to the window start; the honest move then applies cleanly.
- A four-window match resumes by replay from tick 0 well inside the
  2-second fixture budget.

## Deviations from plan

- Rejected moves restore state by replaying the accepted history (no
  state cloning); cost scales with match length, bounded by the same
  replay budget the resume test asserts.
- The sender records only actions that succeeded live, so any
  rules-rejection during re-simulation is treated as tampering — a
  deliberate strictness recorded in the match-model notes.

## Follow-ups

- SB-23-02: window digests and the high-speed recap replay.
