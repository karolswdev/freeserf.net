# SB-8-02 — Decide Worker And Threading Model

- **Project:** serfbound
- **Phase:** 8
- **Status:** ready
- **Depends on:** SB-8-01, SB-3-03
- **Unblocks:** SB-8-04, SB-9-04
- **Owner:** unassigned

## Problem

The simulation may need to move off the main thread, but workers add complexity
and serialization costs. Serfbound needs an evidence-based worker decision after
there is a playable slice to measure.

## Scope

- **In:** Main-thread baseline, worker prototype or rejection rationale,
  message/state boundary, performance comparison, and browser support notes.
- **Out:** Premature worker architecture before measurement, multiplayer
  networking, or broad engine refactor unrelated to measured pressure.

## Acceptance criteria

- [ ] Decision document records main-thread vs worker choice.
- [ ] Decision cites Phase 8 performance evidence.
- [ ] If workers are chosen, message contracts and transfer costs are tested.
- [ ] If workers are deferred, stop signals for revisiting are explicit.
- [ ] Normal play remains pure browser.

## Test plan

- **Unit:** Message contract tests if worker boundary exists.
- **Integration / Cypress:** Browser worker smoke test if implemented.
- **Manual / device:** Compare measured behavior with and without worker path if
  prototyped.
- **Design handoff:** n/a - architecture evidence.

## Notes / open questions

Do not add workers to feel sophisticated. Add them only when measurements say
they buy something.
