# SB-24-03 — Lobby and Matchmaking

- **Project:** serfbound
- **Phase:** 24
- **Status:** backlog
- **Depends on:** SB-24-02
- **Unblocks:** SB-24-04
- **Owner:** unassigned

## Problem

Invite links require knowing someone. A lobby lists open games and a
simple matchmaker pairs players who don't — built on the signaling
relay, which still never touches gameplay traffic.

## Scope

- **In:** Open-game listing (host posts, others browse/join), quick
  match pairing (ladder-aware once SB-24-04 lands), lobby UI in the
  shell, stale-listing expiry, accountless participation (local profiles
  suffice), relay contract tests extended to listing semantics.
- **Out:** Tournaments, parties, chat.

## Acceptance criteria

- [ ] A hosted game appears in the lobby and a stranger-context can join
  it to a played game.
- [ ] Quick match pairs two waiting players.
- [ ] Listings expire; the relay still carries no gameplay traffic.

## Test plan

- **Unit:** Listing/expiry/pairing logic in CI.
- **Integration / e2e:** Two-context lobby join and quick match against
  a local relay.
- **Manual / device:** Deployed-relay lobby session in evidence.
- **Design handoff:** Lobby UI screenshots under phase artifacts.

## Notes / open questions

- Preserves: P2P gameplay; the relay stays a coordinator.
- Browser boundary: network (relay listing API).
- .NET reference use: none.
- Phase gate advanced: exit criterion 3.
