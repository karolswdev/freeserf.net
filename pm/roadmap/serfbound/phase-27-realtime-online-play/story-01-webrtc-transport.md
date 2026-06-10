# SB-27-01 — WebRTC Transport with Manual Signaling

- **Project:** serfbound
- **Phase:** 27
- **Status:** backlog
- **Depends on:** SB-26-04
- **Unblocks:** SB-27-02
- **Owner:** unassigned

## Problem

The lockstep stack speaks through a transport contract; the internet
needs a real one. WebRTC data channels carry the session protocol
peer-to-peer, with copy-paste offer/answer signaling so online play
works before any hosted piece exists.

## Scope

- **In:** An RTCDataChannel transport implementing the Phase 22
  contract (ordered/reliable configuration recorded), copy-paste
  offer/answer UI, ICE candidate handling, transport-level error
  surfacing, two-browser proof with matching checksums.
- **Out:** Hosted signaling (SB-27-02), reconnect (SB-27-03).

## Acceptance criteria

- [ ] Two browsers establish a data channel via copy-paste signaling and
  complete a lockstep game with matching checksums.
- [ ] Transport failures surface as recoverable session errors, not
  hangs.
- [ ] The transport passes the Phase 22 transport contract tests.

## Test plan

- **Unit:** Transport contract tests against a local RTC loopback pair.
- **Integration / e2e:** Two-context Playwright game over WebRTC on one
  machine.
- **Manual / device:** A real two-machine session recorded in evidence.
- **Design handoff:** Signaling UI screenshots under phase artifacts.

## Notes / open questions

- Preserves: P2P gameplay traffic per the SB-20-04 decision.
- Browser boundary: network (WebRTC).
- .NET reference use: none.
- Phase gate advanced: exit criterion 1.
