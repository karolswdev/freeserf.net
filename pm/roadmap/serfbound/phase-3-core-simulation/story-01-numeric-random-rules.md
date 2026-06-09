# SB-3-01 — Port Deterministic Numeric And Random Rules

- **Project:** serfbound
- **Phase:** 3
- **Status:** done
- **Depends on:** SB-2-02, SB-1-02
- **Unblocks:** SB-3-02, SB-3-03, SB-3-04
- **Owner:** Codex

## Problem

Simulation parity depends on matching low-level numeric and random behavior.
JavaScript number semantics differ from C# integer behavior, so Serfbound must
encode the intended rules explicitly.

## Scope

- **In:** Integer helpers, wrapping/overflow policy, seed/random behavior needed
  by first oracle fixtures, focused tests, and documentation.
- **Out:** Full map generation, full game tick, rendering, or asset parsing.

## Acceptance criteria

- [x] Numeric helper behavior is documented and tested.
- [x] Random/seed behavior matches the selected oracle fixture.
- [x] Tests include edge cases for signed/unsigned and overflow-sensitive
  behavior relevant to the selected source files.
- [x] Browser code does not depend on C# runtime artifacts.
- [x] Known divergences are recorded with rationale.

## Test plan

- **Unit:** Run numeric/random test suite.
- **Integration / Cypress:** n/a.
- **Manual / device:** Review failing parity cases, if any, against oracle
  output.
- **Design handoff:** n/a - non-visual.

## Notes / open questions

Shipped explicit `uint16`, `int16`, `uint32`, and `rotateRight16` helpers plus
`FreeserfRandom` in `@serfbound/engine`. The implementation matches every
case and step in `rng-fixed-seed-sequence.json`. There are no intentional
behavior divergences from the captured RNG fixture; the only note is a Phase 1
fixture metadata quirk where the operator-`^` case's `constructor.values` field
reflects a mutable list after sequence generation, so tests reconstruct the
initial state from `leftState` and `rightState`.
