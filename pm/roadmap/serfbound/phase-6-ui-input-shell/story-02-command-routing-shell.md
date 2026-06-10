# SB-6-02 — Add Command Routing Shell

- **Project:** serfbound
- **Phase:** 6
- **Status:** done
- **Depends on:** SB-6-01, SB-3-03
- **Unblocks:** SB-7-02
- **Owner:** unassigned

## Problem

UI events need a controlled path into engine state. Without a command routing
shell, browser components will mutate state ad hoc and break determinism.

## Scope

- **In:** Command types, validation path, engine dispatch entry point, command
  logging/debug output, and tests for accepted/rejected commands.
- **Out:** Full gameplay command set, multiplayer protocol, final UI styling, or
  undo/redo.

## Acceptance criteria

- [ ] Commands are typed and routed through a single engine boundary.
- [ ] Invalid commands produce structured errors.
- [ ] At least one no-op or debug command proves end-to-end routing.
- [ ] Command execution remains deterministic and testable without DOM.
- [ ] Future Phase 7 build action has an explicit route.

## Test plan

- **Unit:** Command validation and dispatch tests.
- **Integration / Cypress:** Browser control triggers a command route.
- **Manual / device:** Inspect debug output for selected map command.
- **Design handoff:** n/a - non-visual architecture.

## Notes / open questions

Shipped `SerfboundCommandRouter` in `@serfbound/engine`; browser pointer
selection now dispatches `debug.inspect-map-tile` through that boundary.
`game.build` is typed and routed, but rejected with a structured
`build-command-deferred` result until Phase 7 owns build semantics.

Keep commands semantic. Do not route raw DOM events into the engine.
