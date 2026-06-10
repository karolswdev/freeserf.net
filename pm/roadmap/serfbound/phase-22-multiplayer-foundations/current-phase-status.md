# Phase 22 — Multiplayer Foundations

**Last updated:** 2026-06-10.
**Status:** complete — see final-summary.md.

## Goal

Build the network-free core of lockstep multiplayer on the engine's
deterministic world-action log, per the recorded SB-20-04 transport
decision: per-tick state checksums, an input-delay lockstep scheduler,
a versioned session wire protocol, and a two-tab loopback game as the
gate — all provable without a single hosted server.

## Scope

- **In:** Per-tick world-state checksums with desync-detection fixtures,
  lockstep session core (tick-stamped world actions, input delay, stall
  handling) proven with in-process simulated peers, versioned message
  encoding for handshake/settings/actions/checksums over the existing
  world-action log, and a two-browser-context loopback game (e.g.
  BroadcastChannel transport) as the phase gate.
- **Out:** WebRTC, signaling, and anything hosted (Phase 23); accounts
  and matchmaking (Phase 24); spectators.

## Non-negotiable constraints

- Determinism is the contract: identical settings + seed + action
  schedule must produce identical checksums on every peer, enforced by
  fixtures.
- The protocol carries world actions and checksums only — never original
  game data (the asset boundary applies to the wire too: each player
  imports their own data).
- Single-player paths must not regress; lockstep wraps the engine, it
  does not fork it.

## Exit criteria (evidence required)

- [x] Per-tick checksums are stable across runs and divergence is
  detected at the exact tick in fixtures. (SB-22-01)
- [x] Two simulated peers play one game through the lockstep scheduler
  with matching checksums under latency/jitter schedules. (SB-22-02)
- [x] The session protocol encodes handshake, settings, actions, and
  checksums with versioning and rejects mismatches recoverably.
  (SB-22-03)
- [x] Two browser tabs play one game over a loopback transport in e2e
  with matching final checksums. (SB-22-04)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-22-01 | Determinism checksums and desync detection | done | story-01-determinism-checksums.md | evidence-story-01.md |
| SB-22-02 | Lockstep session core | done | story-02-lockstep-session-core.md | evidence-story-02.md |
| SB-22-03 | Session wire protocol | done | story-03-session-wire-protocol.md | evidence-story-03.md |
| SB-22-04 | Two-tab loopback gate | done | story-04-two-tab-loopback-gate.md | evidence-story-04.md |

## Where we are

The phase is closed: two browser tabs host/join one lockstep game over
a BroadcastChannel — both players act from their own tab, both worlds
materialize both castles, and the cross-tab checksums agree (196/196
unit, 11/11 browser, boundaries/docs/real-data green). See
final-summary.md. Standing record for Phase 23: rejoin-resync must
replay from tick 0 or ship serf serialization first.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Hidden nondeterminism (iteration order, float drift) | medium | Checksum fixtures across seeds and replay | Any checksum mismatch on replay |
| Lockstep stalls feel bad at human latencies | medium | Input-delay tuning with jitter schedules | Stalls beyond budget in loopback play |
| Protocol churn once WebRTC lands | medium | Version field + mismatch rejection from day one | Breaking change without version bump |

## Decisions made (this phase)

- none yet.

## Decisions deferred

- Rollback (GGPO-style) vs pure input-delay lockstep if stalls trip the
  stop signal.
