# Phase 27 — Realtime Online Play

**Last updated:** 2026-06-10.
**Status:** not started.

## Goal

Take the Phase 22 lockstep stack onto the internet per the SB-20-04
decision: WebRTC data channels carry the session protocol peer-to-peer,
starting with zero-server copy-paste signaling, then a minimal signaling
relay with invite links, with reconnect/resync resilience and a
two-browser e2e gate.

## Scope

- **In:** WebRTC data-channel transport behind the Phase 22 transport
  contract, manual copy-paste signaling first (zero hosted pieces), a
  minimal signaling relay and invite links as the only hosted component,
  reconnect and late-rejoin from action-log replay, desync recovery UX,
  NAT-traversal outcome metrics (local, privacy-respecting) against the
  recorded ~15% TURN stop signal.
- **Out:** TURN relay (only if the stop signal trips), accounts,
  matchmaking, ratings (Phase 25); voice/chat.

## Non-negotiable constraints

- Gameplay traffic stays peer-to-peer; the relay sees signaling blobs
  only — never world actions, never game data.
- The game remains fully playable with zero hosted services (copy-paste
  signaling path stays).
- Privacy: no telemetry beyond the local error/intake patterns already
  shipped.

## Exit criteria (evidence required)

- [ ] Two browsers complete a game over WebRTC with manual signaling and
  matching checksums. (SB-27-01)
- [ ] Invite links through the minimal relay establish sessions; the
  relay never carries gameplay traffic. (SB-27-02)
- [ ] A dropped peer reconnects and resyncs from the action log; desync
  surfaces recoverably. (SB-27-03)
- [ ] The online-play e2e gate passes and NAT outcome measurement is in
  place with the TURN stop signal recorded. (SB-27-04)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-27-01 | WebRTC transport with manual signaling | backlog | story-01-webrtc-transport.md | — |
| SB-27-02 | Signaling relay and invite links | backlog | story-02-signaling-relay-invites.md | — |
| SB-27-03 | Reconnect, resync, and desync recovery | backlog | story-03-resilience-reconnect.md | — |
| SB-27-04 | Online play gate | backlog | story-04-online-play-gate.md | — |

## Where we are

Scaffolded; the SB-20-04 realtime track, re-ordered behind correspondence play (Phase 23 decision): starts after Phase 25 closes.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| NAT traversal failures in the field | medium | Measure outcomes; recorded TURN fallback plan | >~15% failure rate |
| Hosted relay scope creep | medium | Relay carries signaling blobs only, by contract test | Any gameplay payload at the relay |
| Reconnect windows corrupt determinism | medium | Resync = replay from the log, never state merge | Checksum mismatch after rejoin |

## Decisions made (this phase)

- none yet.

## Decisions deferred

- TURN relay deployment (gated on the field stop signal).
- Session hosting for >2 players.
