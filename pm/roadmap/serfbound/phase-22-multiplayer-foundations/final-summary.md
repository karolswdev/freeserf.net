# Phase 22 — Final Summary

**Closed:** 2026-06-10.

## Goal — was it met?

Yes. Lockstep multiplayer's network-free core is real and proven: the
materialized game state fingerprints deterministically
(`computeGameChecksum`), the lockstep session schedules tick-stamped
action bundles with input delay and holds rather than guesses
(`LockstepSession`), the versioned session protocol carries handshake,
turns, checksums, and leave with strict decode validation and
recoverable rejection (`session-protocol.ts`), and the phase gate is a
played game: two browser tabs host/join over a BroadcastChannel, both
players found castles from their own tab, both full simulations agree
checksum for checksum — multiplayer with zero servers, exactly as the
SB-20-04 decision drew it.

## Exit criteria — final state

- [x] Per-tick checksums stable across runs; divergence at its cadence
  tick (SB-22-01).
- [x] Two simulated peers under jitter/stall schedules agree exactly
  (SB-22-02).
- [x] Versioned protocol with recoverable mismatch rejection (SB-22-03).
- [x] Two tabs play one game over loopback in e2e with matching
  checksums (SB-22-04).

## Stories shipped

| ID | Story | Evidence |
|---|---|---|
| SB-22-01 | Determinism checksums and desync detection | evidence-story-01.md |
| SB-22-02 | Lockstep session core | evidence-story-02.md |
| SB-22-03 | Session wire protocol | evidence-story-03.md |
| SB-22-04 | Two-tab loopback gate | evidence-story-04.md |

## Decisions and honest records

- Desync exactness follows the checksum cadence (512 ticks in the
  shell; per-tick is affordable when needed).
- Snapshot restores replay the action log but not in-flight serf state
  (the standing Phase 13 limitation): Phase 23 rejoin-resync must
  replay from tick 0 or ship serf serialization first — recorded
  against SB-23-03.
- The handshake demands identical app versions (lockstep needs
  identical simulation builds); JSON wire texts over binary encoding
  (bundles are tiny; WebRTC carries strings natively).
- Lockstep mode pins game speed at 1x; synchronized speed changes are a
  protocol extension for later.
- Suite growth this phase: 181→196 unit tests, 10→11 browser suites.

## What's next

Phase 23 — online play: the WebRTC data-channel transport behind the
same channel seam, copy-paste signaling first, then the minimal relay,
reconnect/resync, and the online e2e gate.
