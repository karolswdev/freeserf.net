# Phase 16 — The Original Interface

**Last updated:** 2026-06-10.
**Status:** not started.

## Goal

Replace the temporary side-panel shell with the authentic Settlers interface,
rebuilt browser-native from decoded UI art: panel bar, popup system, minimap,
notifications, fonts, and cursors — so the game looks and drives like the
original.

## Scope

- **In:** Decoded font/icon/frame/cursor rendering; the panel bar
  (`PanelBar.cs`); the popup family (`PopupBox.cs` — build menus, stats,
  resource/serf lists, settings, distribution sliders via `SlideBar`);
  minimap (`Minimap.cs`) with navigation; notifications
  (`NotificationBox.cs`); and the game start screen (`GameInitBox.cs`). The
  reference `UI/` layer is ~17k lines; Serfbound reimplements it as
  browser-native components using decoded art, not a widget-for-widget port.
- **Out:** New (non-original) UI design beyond browser affordances; mobile
  layout adaptation (Phase 19); mission selection content (Phase 18 wires
  missions into the start screen).

## Non-negotiable constraints

- All visible chrome uses decoded original art (fonts, icons, frames); the
  temporary HTML side panel is removed by phase end.
- Every popup ships with a screenshot compared against the original layout.
- Keyboard/pointer accessibility is preserved (testids, focus order).

## Exit criteria (evidence required)

- [ ] Text renders with the decoded game font; icons/frames/cursors come from
  decoded art. (SB-16-01)
- [ ] The panel bar drives the game: build mode, stats access, settings,
  game speed. (SB-16-02)
- [ ] The popup system covers build menus, stats, and settings with original
  layouts. (SB-16-03)
- [ ] Minimap renders the world, supports click-to-navigate, and
  notifications surface events. (SB-16-04)
- [ ] The start screen handles game setup authentically. (SB-16-05)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-16-01 | Render decoded UI art: fonts, icons, frames, cursors | backlog | story-01-ui-art-foundation.md | — |
| SB-16-02 | Build the authentic panel bar | backlog | story-02-authentic-panel-bar.md | — |
| SB-16-03 | Build the popup system | backlog | story-03-popup-system.md | — |
| SB-16-04 | Minimap and notifications | backlog | story-04-minimap-notifications.md | — |
| SB-16-05 | Authentic game start screen | backlog | story-05-game-start-screen.md | — |

## Where we are

Scaffolded; starts after Phase 15 closes.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| PopupBox scope (dozens of popups) swallows the phase | high | Popups grouped by gameplay need; rare popups deferred with a recorded list | SB-16-03 exceeding its story budget |
| Pixel-art UI scales poorly on modern screens | medium | Integer scaling decision story early in SB-16-01 | Blurry/inconsistent chrome |
| Removing the temp panel breaks test selectors | medium | Keep testids stable through the swap | Browser suite churn beyond the UI stories |

## Decisions made (this phase)

- none yet.

## Decisions deferred

- Localization beyond the original English strings.
