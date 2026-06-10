# Phase 6 — UI And Input Shell

**Last updated:** 2026-06-09.

**Status:** in progress.

## Goal

Turn browser pointer/keyboard input into intentional game actions through a UI
shell that is ergonomic enough for the first playable slice.

## Scope

- **In:** Pointer and keyboard mapping, viewport interaction, command routing,
  basic panels/menus, missing-data/import states, pause/speed controls, and
  input feedback.
- **Out:** Full UI parity, final visual design, multiplayer UI, tutorial flow,
  or desktop input compatibility.

## Non-negotiable constraints

- Final product code is pure browser.
- No .NET product runtime, desktop wrapper, native launcher, local companion
  process, or browser shell around a desktop runtime.
- Original DOS/Amiga data is user-provided only; Serfbound does not commit,
  host, bundle, or redistribute it.

## Exit criteria (evidence required)

- [x] Pointer input maps to map positions through tested conversion logic.
- [ ] Keyboard shortcuts are chosen or deferred with explicit browser conflicts.
- [ ] Basic game command routing exists from UI to engine state.
- [ ] Missing/invalid data and import flows are user-recoverable.
- [ ] Manual browser checks cover mouse, trackpad, and touch viability at a
  minimum exploratory level.

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-6-01 | Implement pointer-to-map interaction | done | story-01-pointer-map-interaction.md | evidence-story-01.md |
| SB-6-02 | Add command routing shell | ready | story-02-command-routing-shell.md | — |
| SB-6-03 | Build basic panels and states | backlog | story-03-basic-panels-states.md | — |
| SB-6-04 | Verify interaction ergonomics | backlog | story-04-interaction-ergonomics.md | — |

## Where we are

Phase 6 is in progress. SB-6-01 added pointer-to-map hover and selection debug
state over the WebGL2 scene using the Phase 5 projection transform. The next
responsible move is SB-6-02: add the command routing shell.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| UI chases full original parity too early | medium | Implement only commands needed for Phase 7 | Panels outnumber working game actions |
| Browser input conflicts with original shortcuts | medium | Document substitutions explicitly | Required action cannot be triggered reliably |
| Touch/trackpad assumptions are untested | medium | Add exploratory manual checks | Interaction only works with one desktop mouse setup |

## Decisions made (this phase)

- 2026-06-09 — Use browser Pointer Events for first map interaction; resolve
  canvas-relative positions through `resolveFirstRenderLayerPointer()` and the
  shared Phase 5 `MapProjectionTransform`; keep physical-device ergonomics for
  SB-6-04 — SB-6-01.

## Decisions deferred

- Exact keyboard shortcut set — resolve in SB-6-02 — default to browser-safe
  equivalents over exact DOS/desktop parity.
