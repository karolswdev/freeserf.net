# SB-3-01 — Port Deterministic Numeric And Random Rules

- **Project:** serfbound
- **Phase:** 3
- **Status:** backlog
- **Depends on:** SB-2-02, SB-1-02
- **Unblocks:** SB-3-02, SB-3-03, SB-3-04
- **Owner:** unassigned

## Problem

Simulation parity depends on matching low-level numeric and random behavior.
JavaScript number semantics differ from C# integer behavior, so Serfbound must
encode the intended rules explicitly.

## Scope

- **In:** Integer helpers, wrapping/overflow policy, seed/random behavior needed
  by first oracle fixtures, focused tests, and documentation.
- **Out:** Full map generation, full game tick, rendering, or asset parsing.

## Acceptance criteria

- [ ] Numeric helper behavior is documented and tested.
- [ ] Random/seed behavior matches the selected oracle fixture.
- [ ] Tests include edge cases for signed/unsigned and overflow-sensitive
  behavior relevant to the selected source files.
- [ ] Browser code does not depend on C# runtime artifacts.
- [ ] Known divergences are recorded with rationale.

## Test plan

- **Unit:** Run numeric/random test suite.
- **Integration / Cypress:** n/a.
- **Manual / device:** Review failing parity cases, if any, against oracle
  output.
- **Design handoff:** n/a - non-visual.

## Notes / open questions

Do not generalize every C# integer pattern upfront. Port only the semantics
needed by selected oracle targets, then expand deliberately.
