# Evidence — SB-23-03 — Turn Flow and Pickup Countdown

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/app/src/hotseat.ts` — `HotseatController`, the
  match's chess clock: your-window (the live match plays, commands
  queue only here) → handover (the move is taken; the pickup countdown
  runs on an injected clock; expiry surfaces — enforcement is Phase
  24's mailbox) → recap (the move re-simulates on the *verify* match,
  one chunk per shell frame, rendered — so one machine still exercises
  the full trustless capture/transfer/verify path) → the next player's
  window. Verification failure parks the controller in `failed` with
  the reason.
- `serfbound/packages/engine/src/correspondence.ts` — the match exposes
  its game state for shell command routing.
- `serfbound/packages/app/src/main.ts` — the "Hot-seat 2P (pass and
  play)" control; the timer's hot-seat branch (controller tick, render
  the controller's current match, command authority follows the active
  player, notices for hand-over countdown/recap/your-window); Enter
  picks the turn up; `?window=` selects the window length (e2e uses
  short windows); `data-serfbound-cor-*` attributes (mode, window,
  player, countdown, expired, digest, failure).
- `serfbound/docs/player-guide.md` — hot-seat and the `?seed=` world
  pinning documented; docs gate passes.
- Tests: `tests/ci/app-hotseat.test.mjs`.

## Verification artifacts

```text
npm run test:ci -> # tests 206 / pass 206 / fail 0; 11 passed (1.8m)
npm run test:docs -> serfbound-docs-ok
node --test tests/ci/app-hotseat.test.mjs ->
  ok 1 - the turn flow walks your-window, handover, recap, next window
  ok 2 - the pickup countdown expires to zero and flags it
```

- The flow fixture plays player 1's full window (castle founded),
  hands over with the countdown on a scripted clock (30 → 18s),
  refuses queued commands while waiting, recaps across multiple frames
  on the verify match, lands checksum-identical to the live match, and
  alternates to player 2 and back.
- Expiry pins the countdown at 0 and raises the flag; pickup still
  works (forfeit enforcement is recorded for Phase 24).

## Deviations from plan

- The window closes exactly at its tick bound by construction
  (CorrespondenceMatch.advance stops at the boundary) — asserted
  through the flow fixture rather than a separate test.
- The hot-seat e2e (visible flow on the real canvas) lands with the
  SB-23-04 gate per the story's test plan.
- The digest surfaces as a data attribute plus single-line notices; a
  full digest panel in the popup chrome is recorded as Phase 24 UX
  polish.

## Follow-ups

- SB-23-04: the async gate (hot-seat e2e + two-tab async match) closes
  the phase.
