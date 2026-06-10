# Phase 23 — Final Summary

**Closed:** 2026-06-10.

## Goal — was it met?

Yes. Correspondence Serfbound — offline chess over the lockstep core —
is real and played: a match divides into alternating session windows;
the active player plays live while both economies simulate; the move
(tick-stamped actions + end checksum) transfers; the opponent's client
re-simulates it trustlessly, watches the high-speed recap, reads the
digest ("while you waited: buildings, flags, land, stock"), and plays
their window against the pickup countdown. Proven with zero servers,
twice over: hot-seat pass-and-play on one machine (where every window
still crosses the verify path) and a two-tab async match over the
loopback channel standing in for Phase 24's mailbox.

## Exit criteria — final state

- [x] Window-by-window match advancement with trustless re-simulation,
  checksum verification, and tamper rejection (SB-23-01).
- [x] Accurate window digests and the high-speed recap replay
  (SB-23-02).
- [x] The turn flow: whose-turn states, pickup countdown, hand-over,
  hot-seat (SB-23-03).
- [x] The async gate: hot-seat and two-tab async matches in e2e with
  verified checksums (SB-23-04).

## Stories shipped

| ID | Story | Evidence |
|---|---|---|
| SB-23-01 | Turn-window match model | evidence-story-01.md |
| SB-23-02 | Window digests and recap replay | evidence-story-02.md |
| SB-23-03 | Turn flow and pickup countdown | evidence-story-03.md |
| SB-23-04 | Async play gate | evidence-story-04.md |

## Decisions and honest records

- Correspondence-first reorder (the phase's founding decision): async
  play needed no networking at all and ships play-against-people now;
  realtime WebRTC holds at Phase 26.
- Resume is replay, made canon: matches reopen by replaying the
  accepted history from tick 0, re-verifying everything.
- The sender records only live-accepted actions; a rules rejection
  during re-simulation is treated as tampering (strict by design).
- Defects fixed along the way, each found by this phase's work: the
  uint16 game-tick wrap (monotonicTick now carries window/turn math —
  it would have broken 24-minute realtime sessions and every day-scale
  match), hidden browser tabs freezing the lockstep pump, Math.random
  e2e worlds (?seed= pins them — shipped as shareable worlds), and the
  shell layout pushing the map below the fold as the action list grew.
- Suite growth this phase: 196→208 unit tests, 11→13 browser suites,
  all stable across repeated full runs.

## What's next

Phase 24 — community and identity: registration, challenges with match
terms, the turn mailbox with real pickup deadlines and forfeits, and
the ladder — the hosted home for exactly the matches this phase plays
serverlessly.
