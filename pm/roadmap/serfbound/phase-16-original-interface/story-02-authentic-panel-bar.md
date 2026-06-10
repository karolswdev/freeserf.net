# SB-16-02 — Build the Authentic Panel Bar

- **Project:** serfbound
- **Phase:** 16
- **Status:** done
- **Depends on:** SB-16-01
- **Unblocks:** SB-16-03
- **Owner:** unassigned

## Problem

The panel bar is mission control - build button, stats, map, settings, game speed - replacing the temporary HTML side panel as the primary way to drive the game.

## Scope

- **In:** PanelBar layout and buttons from decoded panel_button/frame_bottom art, button state logic (disabled/active/flashing) per reference, wiring to existing commands, removal plan for the temp panel.
- **Out:** Popup contents (SB-16-03), minimap drawing (SB-16-04).

## Acceptance criteria

- [x] Panel bar renders authentically and drives build/road modes.
- [x] Button states match reference behavior.
- [x] Temporary panel functions migrate or are explicitly retired (road/flag
  driven by the bar; retirement completes with SB-16-05 — recorded).

## Test plan

- **Unit:** Layout/state logic tests in CI.
- **Integration / Cypress:** Browser tests drive the UI via testids.
- **Manual / device:** Real-data screenshot comparison vs original layouts.
- **Design handoff:** Screenshots under phase artifacts (required - UI story).

## Notes / open questions

- Preserves: original layouts and behavior; browser-native
  reimplementation, not a widget-for-widget port.
- Browser boundary: DOM/canvas UI composition over WebGL.
- .NET reference use: UI/ layer read as layout/behavior reference.
- Phase gate advanced: see phase exit criteria.
