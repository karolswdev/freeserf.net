# SB-23-03 — Turn Flow and Pickup Countdown

- **Project:** serfbound
- **Phase:** 23
- **Status:** done
- **Depends on:** SB-23-02
- **Unblocks:** SB-23-04
- **Owner:** Claude

## Problem

The match needs its chess clock: whose turn it is, what the waiting
player sees, the countdown to pick up a turn, the moment the window
ends, and the hand-over — including the simplest mode of all, hot-seat
on one machine (pass the keyboard).

## Scope

- **In:** The whose-turn state machine in the shell (your-window /
  their-window / recap / awaiting-pickup), window-end handling (the
  window closes at its tick bound; the move is produced), pickup
  countdown semantics (display + expiry surfacing; enforcement
  with deadlines is Phase 24's mailbox), hot-seat mode: one machine
  alternating players through the full capture/verify path.
- **Out:** Hosted deadlines/forfeits (Phase 24); spectators.

## Acceptance criteria

- [x] The shell walks your-window → hand-over → recap → their-window
  states with correct command gating (you can only act in your
  window).
- [x] The window ends exactly at its tick bound and produces the move.
- [x] Hot-seat: two players complete several windows on one machine
  through the same trustless verify path.

## Test plan

- **Unit:** Turn-state transitions and window-end capture in CI.
- **Integration / e2e:** Hot-seat flow assertions join the SB-23-04
  gate spec.
- **Manual / device:** n/a until the gate.
- **Design handoff:** Turn-flow screenshots under phase artifacts.

## Notes / open questions

- Preserves: single-player flows untouched; lockstep-realtime loopback
  untouched.
- Browser boundary: none new.
- .NET reference use: none.
- Phase gate advanced: exit criterion 3.
