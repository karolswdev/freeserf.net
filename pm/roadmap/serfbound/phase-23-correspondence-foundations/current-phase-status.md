# Phase 23 — Correspondence Foundations

**Last updated:** 2026-06-10.
**Status:** complete — see final-summary.md.

## Goal

Async multiplayer — offline chess over the lockstep core: a match
divides into session windows (e.g. ten game-minutes); the active player
plays their window live while both economies simulate, then their
tick-stamped action segment plus end checksum becomes the "move"; the
opponent's client re-simulates the window (trustlessly — the rules and
the checksum are the referee), watches a high-speed recap of what
happened, and plays theirs against a pickup countdown. Provable with
zero servers: hot-seat on one machine and two tabs over the existing
loopback are the gate.

## Scope

- **In:** The `TurnWindow` match model over the Phase 22 primitives
  (window bounds, action segment capture, end checksum, trustless
  re-simulation apply path, resume-by-replay from tick 0), window
  digests (per-player deltas: buildings, roads, resources, land, combat
  events) plus the high-speed recap replay in the shell, the turn-flow
  UX (whose-turn state machine, pickup countdown semantics, hand-over),
  and the async gate: hot-seat pass-the-turn on one machine plus a
  two-tab async match over the loopback channel-as-mailbox.
- **Out:** Hosted anything (registration, challenges, the real turn
  mailbox with deadlines — Phase 24); realtime play (Phase 26);
  fog-of-war (recorded as a deferred game-feel decision).

## Non-negotiable constraints

- Trustless verification: the receiving client re-simulates every
  window from shared deterministic state; an invalid action or checksum
  mismatch rejects the move recoverably. No client is ever believed.
- Resume is replay: a match opens anywhere by replaying the action log
  from tick 0 (the Phase 22 record made canon — no serf-state
  serialization dependency).
- The move payload carries actions and checksums only — never game
  data.
- Single-player and realtime-loopback flows must not regress.

## Exit criteria (evidence required)

- [x] A match advances window by window: capture, transfer, trustless
  re-simulation, checksum verification, tamper rejection — all in CI
  fixtures. (SB-23-01)
- [x] A window produces an accurate digest and the shell replays the
  opponent's window at high speed. (SB-23-02)
- [x] The turn flow runs: whose-turn states, pickup countdown,
  hand-over; hot-seat play works on one machine. (SB-23-03)
- [x] The async gate passes: a hot-seat match and a two-tab async match
  play several windows each with verified checksums in e2e. (SB-23-04)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-23-01 | Turn-window match model | done | story-01-turn-window-match-model.md | evidence-story-01.md |
| SB-23-02 | Window digests and recap replay | done | story-02-window-digests-recap.md | evidence-story-02.md |
| SB-23-03 | Turn flow and pickup countdown | done | story-03-turn-flow-countdown.md | evidence-story-03.md |
| SB-23-04 | Async play gate | done | story-04-async-play-gate.md | evidence-story-04.md |

## Where we are

The phase is closed: hot-seat and two-tab async matches both play in
e2e with every window crossing the trustless verify path — 208/208
unit, 13/13 browser (three consecutive full runs), boundaries, docs,
static hosting, and the real-data sweep all green, with hot-seat
turn-flow captures from real data under artifacts. See
final-summary.md. Next: Phase 24 gives these matches their online home
(registration, challenges, the turn mailbox with deadlines).

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Replay-from-zero cost grows with match length | low | Measured 2M ticks/s headroom; budget asserted in fixtures | Resume slower than seconds for day-scale matches |
| Window semantics feel unfair (second-mover information) | medium | Alternating windows, automatic defense; game-feel notes recorded | Playtest verdict at the gate |
| Async state leaks into single-player paths | medium | Match model stays a layer over the engine; full suite reruns | Any SP regression |

## Decisions made (this phase)

- **Correspondence before realtime (2026-06-10):** async play needs no
  WebRTC, no NAT traversal, and no presence; it delivers
  play-against-people on top of the shipped lockstep core with zero
  servers, and gives Phase 24's identity/mailbox services a concrete
  headline feature. The SB-20-04 realtime track moves to Phase 26
  unchanged in substance.

## Decisions deferred

- Fog-of-war / information asymmetry between windows (game feel).
- Window length presets and clock rules (tuned at the Phase 24
  challenge UX).
