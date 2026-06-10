# SB-25-03 — Challenges and the Turn Mailbox

- **Project:** serfbound
- **Phase:** 25
- **Status:** backlog
- **Depends on:** SB-25-02
- **Unblocks:** SB-25-04
- **Owner:** unassigned

## Problem

Correspondence play (Phase 23) needs its post office: challenge someone
to a match ("ten-minute windows, 24-hour pickup"), store-and-forward
the tiny turn moves, run the pickup deadlines for real (forfeit on
expiry), and tell players it's their turn — the "registration +
challenge + async session" experience, on a service that never sees
game data.

## Scope

- **In:** Challenge issue/accept/decline with match terms (window
  ticks, pickup deadline), the turn mailbox (store-and-forward of
  encoded window moves keyed by match), server-side pickup deadlines
  with forfeit semantics, turn notifications (in-shell on open;
  push/email recorded as a separate decision), open-match listing for a
  player, lobby listing for open challenges, contract tests pinning the
  service to moves-and-checksums-only payloads.
- **Out:** Ratings (SB-25-04); spectators; realtime play (Phase 27).

## Acceptance criteria

- [ ] A challenge flows issue → accept → match created with agreed
  terms; declines and expiries resolve cleanly.
- [ ] Turn moves post and fetch through the mailbox; the receiving
  client still re-verifies every move (the service is never trusted
  with rules).
- [ ] A missed pickup deadline forfeits per the recorded semantics; the
  shell surfaces whose turn it is and the countdown from service time.

## Test plan

- **Unit:** Challenge/mailbox/deadline logic in CI against a local
  service instance.
- **Integration / e2e:** Two contexts play a mailbox-backed match with
  a deadline; forfeit path asserted.
- **Manual / device:** A deployed-service match recorded in evidence.
- **Design handoff:** Challenge/turn UX screenshots under phase
  artifacts.

## Notes / open questions

- Preserves: trustless verification (the mailbox stores, never
  referees); the asset boundary (moves and checksums only).
- Browser boundary: network (mailbox API).
- .NET reference use: none.
- Phase gate advanced: exit criterion 3.
