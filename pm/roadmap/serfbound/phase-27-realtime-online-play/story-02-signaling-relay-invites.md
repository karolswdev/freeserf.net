# SB-27-02 — Signaling Relay and Invite Links

- **Project:** serfbound
- **Phase:** 27
- **Status:** backlog
- **Depends on:** SB-27-01
- **Unblocks:** SB-27-03
- **Owner:** unassigned

## Problem

Copy-paste signaling proves the path but humans want a link. The one
hosted piece the SB-20-04 decision allows is a tiny signaling relay:
exchange offer/answer blobs behind an invite code, then get out of the
way.

## Scope

- **In:** A minimal signaling relay (deployment story recorded; small
  enough to self-host), invite-link UX (create/join by code), relay
  contract tests proving it never sees gameplay traffic, graceful
  fallback to manual signaling when the relay is unreachable.
- **Out:** Lobbies/discovery (Phase 25), TURN, persistence of sessions.

## Acceptance criteria

- [ ] An invite link/code establishes a session end-to-end.
- [ ] The relay handles signaling blobs only; gameplay stays P2P
  (contract-tested).
- [ ] Relay-down degrades to the manual signaling path with clear UX.

## Test plan

- **Unit:** Relay protocol and contract tests in CI.
- **Integration / e2e:** Invite-link session in Playwright against a
  local relay instance.
- **Manual / device:** Real session via a deployed relay recorded in
  evidence.
- **Design handoff:** Invite UX screenshots under phase artifacts.

## Notes / open questions

- Preserves: zero-server play remains available; the relay is optional
  convenience.
- Browser boundary: network (fetch/WebSocket to the relay).
- .NET reference use: none.
- Phase gate advanced: exit criterion 2.
