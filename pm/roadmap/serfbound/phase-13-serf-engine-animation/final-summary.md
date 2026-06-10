# Phase 13 — Final Summary

**Closed:** 2026-06-10.

## Goal — was it met?

Yes. The settlement is alive: the serf state machine core is ported (the
reference tick/counter pattern, walking animations and counters, collision
waiting), transporters haul resources over the flag graph, builders construct
buildings gated on materials and labor (the interim time-stepped model is
deleted), and serfs render through the authentic animation chain.

## Exit criteria — final state

- [x] Animation table + player-color torso compositing from real data
  (SB-13-01).
- [x] State machine core with journey-proven walking (SB-13-02).
- [x] Transporters with pickup/carry/deliver/hand-over (SB-13-03).
- [x] Serf-driven construction at reference material costs (SB-13-04).
- [x] Rendering gate: serfs visible in the live browser from real data
  (SB-13-05).

## Stories shipped

| ID | Story | Evidence |
|---|---|---|
| SB-13-01 | Decode serf animation and player-color sprites | evidence-story-01.md |
| SB-13-02 | Port the serf state machine core | evidence-story-02.md |
| SB-13-03 | Transporters move resources along roads | evidence-story-03.md |
| SB-13-04 | Builders and diggers construct buildings | evidence-story-04.md |
| SB-13-05 | Animated settlement visual gate | evidence-story-05.md |

## What the phase intentionally did not do

- Profession serfs beyond transport/construction (Phase 14).
- Reference priority tables and full FlagSearch scheduling (condensed
  versions recorded; Phase 14 economy work refines them).
- In-flight serf serialization (re-dispatch on restore; recorded).
- Reference head-offset table per state (head anchored by sprite header).

## Carry-forward recommendations

1. Phase 14 should serialize serf state into saves alongside professions.
2. The condensed flag-graph routing should become the reference FlagSearch
   when transport priorities land.
3. A debug zoom view would strengthen future serf visual evidence.
