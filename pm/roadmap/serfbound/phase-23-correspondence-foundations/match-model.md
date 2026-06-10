# Correspondence Match Model — design notes (SB-23-01)

**Recorded:** 2026-06-10. Source of truth:
`serfbound/packages/engine/src/correspondence.ts`.

## The shape

A match is `(game settings, seed, accepted move history)`. A move is
one session window: the active player's tick-stamped action segment
plus the end-of-window checksum. Windows alternate players
(window N → player N mod playerCount). Both economies simulate during
every window — the waiting player's serfs work, mines dig, garrisons
defend automatically (the original's standing-orders model); only
command authority alternates.

## The canonical tick order

Identical live and on replay, by construction:

1. advance to tick t
2. apply the actions stamped t, in submission order
3. run the serf engine at 16-tick boundaries

Live commands queue for the *next* tick instead of applying mid-tick —
that one deferral (imperceptible at ~46 ticks/s) is what makes the
replay bit-exact.

## Trustless verification

`applyMove` re-simulates the window from shared deterministic state and
rejects recoverably on: out-of-turn application, wrong window index,
wrong player, stamps outside the window, actions carrying another
player, rules-rejected actions (the sender only records actions that
succeeded live — a rejection on replay means tampering or divergence),
and end-checksum mismatch. Rejection restores the pre-move state by
replaying the accepted history. The mailbox (Phase 24) stores moves; it
never referees.

## Resume is replay

`resumeCorrespondenceMatch(settings, moves)` rebuilds and re-verifies a
match from tick 0 — the canonical way to open a match on any device.
Fixture-asserted budget: a four-window match resumes in well under two
seconds (the engine replays hundreds of thousands of ticks per second),
so day-scale matches stay interactive. No serf-state serialization
dependency.

## On the wire

`window-move` joins the session protocol (player, window, endTick,
endChecksum, stamped actions), validated structurally on decode like
every other message. Protocol v1 finalizes at the first hosted ship
(Phase 24).

## Deferred

Fog-of-war/information asymmetry (the second mover sees the recap
before playing); window-length presets and clock rules (Phase 24
challenge terms); draws/resignation semantics (Phase 24).
