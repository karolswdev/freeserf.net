# Phase 16 — Final Summary

**Closed:** 2026-06-10.

## Goal — was it met?

Yes. The game looks and drives like the original, browser-native from
decoded UI art: the game font, icons, frames, panel buttons, and cursor
render at crisp 2x integer scale; the authentic panel bar runs build and
road modes and opens the popup family (three build pages at the reference
positions, the exact resources box, knight-occupation settings); the
minimap renders the world in the reference palette with
click-to-navigate; notifications surface events in the game font; and the
authentic start screen — crowned by the decoded Blue Byte logo — fronts
seeded custom games with configurable supplies.

## Exit criteria — final state

- [x] Text renders with the decoded game font; icons/frames/cursors come
  from decoded art (SB-16-01).
- [x] The panel bar drives the game (SB-16-02).
- [x] The popup system covers build menus, stats, and settings with
  original layouts (SB-16-03; deferred popups recorded).
- [x] Minimap renders, navigates, and notifications surface events
  (SB-16-04).
- [x] The start screen handles game setup authentically (SB-16-05).

## Stories shipped

| ID | Story | Evidence |
|---|---|---|
| SB-16-01 | Render decoded UI art: fonts, icons, frames, cursors | evidence-story-01.md |
| SB-16-02 | Build the authentic panel bar | evidence-story-02.md |
| SB-16-03 | Build the popup system | evidence-story-03.md |
| SB-16-04 | Minimap and notifications | evidence-story-04.md |
| SB-16-05 | Authentic game start screen | evidence-story-05.md |

## Decisions made

- 2x integer pixel-art scaling through the NEAREST-filtered WebGL path.
- The temporary HTML panel survives only for the catalog-only fallback
  mode and browser-shell duties (save/load/import); decoded play drives
  entirely through the authentic UI, proven end-to-end in the founding
  e2e.

## What the phase intentionally did not do (recorded lists)

- Deferred popups: serf stats, distribution/transport sliders, building
  stats, ground analysis, message boxes — each lands with the feature it
  fronts (mostly Phase 18).
- Game-speed buttons, message/return icons, button blink, minimap modes,
  per-height minimap shading — Phase 18/19 polish.
- Player colors / multi-slot start screen — Phase 18 AI opponents.
- Mobile layout adaptation — Phase 19.

## Carry-forward recommendations

1. Phase 18's missions wire into the start screen and bring the
   notification variety the NotificationBox popup exists for.
2. Phase 19's performance pass should baseline larger map sizes before
   unlocking the map-size option.
3. The war UI (attack popups) should drive `launchAttack` from the
   building-stats popup when Phase 18 makes enemies visible.
