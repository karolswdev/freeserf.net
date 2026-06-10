# Phase 6 — UI And Input Shell

**Last updated:** 2026-06-09.

**Status:** complete; Phase 7 ready.

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
- [x] Keyboard shortcuts are chosen or deferred with explicit browser conflicts.
- [x] Basic game command routing exists from UI to engine state.
- [x] Missing/invalid data and import flows are user-recoverable.
- [x] Manual browser checks cover mouse, trackpad, and touch viability at a
  minimum exploratory level.

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-6-01 | Implement pointer-to-map interaction | done | story-01-pointer-map-interaction.md | evidence-story-01.md |
| SB-6-02 | Add command routing shell | done | story-02-command-routing-shell.md | evidence-story-02.md |
| SB-6-03 | Build basic panels and states | done | story-03-basic-panels-states.md | evidence-story-03.md |
| SB-6-04 | Verify interaction ergonomics | done | story-04-interaction-ergonomics.md | evidence-story-04.md |

## Where we are

Phase 6 is complete. SB-6-04 added the manual interaction script, browser
shortcut conflict review, and interaction ergonomics audit. Browser checks pass
for mouse-style pointer input, trackpad-equivalent pointer paths,
touch-style PointerEvent handling, import recovery, start-game state, selected
tile feedback, and desktop/mobile panel layout. No Phase 7 blocking ergonomics
issue was found; broader cross-device hardening remains Phase 8 work.

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
- 2026-06-09 — Route UI actions as semantic commands through
  `SerfboundCommandRouter` in `@serfbound/engine`; use `debug.inspect-map-tile`
  as the no-op end-to-end proof; reserve `game.build` as a structured
  `build-command-deferred` route for Phase 7 — SB-6-02.
- 2026-06-09 — Defer exact keyboard shortcut bindings until visible action
  panels exist; command payloads already support `source: "keyboard"`, and
  Phase 6 will prefer browser-safe bindings over legacy shortcuts that collide
  with browser navigation, find, reload, text editing, or assistive technology
  conventions — SB-6-02.
- 2026-06-09 — Keep Phase 6 panels restrained and player-facing: Data, Game,
  Map, Hover, Selected Tile, and Action are the first playable shell; technical
  proof stays in `data-serfbound-*` attributes and tests, not visible copy —
  SB-6-03.
- 2026-06-09 — Do not add global keyboard shortcuts in Phase 6; Phase 7 may add
  scoped bindings only after visible action/focus behavior exists. Preserve
  browser reload, navigation, find, tab traversal, text editing, and escape
  conventions — SB-6-04.
- 2026-06-09 — Treat Playwright mouse movement/click as the mouse and
  trackpad-equivalent pointer path for this environment; touch is covered at
  the browser Pointer Events boundary, while physical touch/device breadth is
  deferred to Phase 8 hardening — SB-6-04.

## Decisions deferred

- Broader physical-device and cross-browser input coverage — Phase 8 browser
  hardening.
