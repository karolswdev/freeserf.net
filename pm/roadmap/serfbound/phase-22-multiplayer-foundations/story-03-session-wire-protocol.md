# SB-22-03 — Session Wire Protocol

- **Project:** serfbound
- **Phase:** 22
- **Status:** done
- **Depends on:** SB-22-02
- **Unblocks:** SB-22-04
- **Owner:** Claude

## Problem

The lockstep core needs a serialized form: a versioned message protocol
for handshake (protocol/app version, settings, seed), tick-stamped
actions, checksums, and clean leave/abort — independent of whichever
transport carries it (loopback now, WebRTC in Phase 23).

## Scope

- **In:** Versioned message encoding/decoding for handshake, settings
  sync, actions, checksum exchange, and session end; mismatch rejection
  (versions, settings, checksums) with recoverable errors; fixtures for
  round-trip and malformed input.
- **Out:** Transports, signaling, persistence of sessions.

## Acceptance criteria

- [x] All session message kinds round-trip byte-exactly.
- [x] Version and settings mismatches reject with actionable errors.
- [x] Malformed messages never crash the engine loop.

## Test plan

- **Unit:** Round-trip and malformed-message fixtures in CI.
- **Integration / e2e:** Simulated peers from SB-22-02 rerun over the
  encoded protocol instead of direct calls.
- **Manual / device:** n/a.
- **Design handoff:** Protocol doc in the phase folder.

## Notes / open questions

- Preserves: no original game data on the wire — actions and checksums
  only; each peer imports their own assets.
- Browser boundary: none new (encoding only).
- .NET reference use: none (`Freeserf.Core` network serialization may be
  consulted read-only for prior art).
- Phase gate advanced: exit criterion 3.
