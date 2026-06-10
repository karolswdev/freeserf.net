# SB-16-04 — Minimap and Notifications

- **Project:** serfbound
- **Phase:** 16
- **Status:** done
- **Depends on:** SB-16-03
- **Unblocks:** SB-16-05
- **Owner:** unassigned

## Problem

The minimap is the world at a glance - terrain, ownership, buildings - with click-to-jump; notifications surface events (attacks, completions) the player must not miss.

## Scope

- **In:** Minimap rendering from map snapshot (terrain colors, ownership overlay, building dots) with mode toggles, click/drag navigation tied to the viewport, NotificationBox queue with authentic icons and jump-to-location.
- **Out:** Fog of war (not in reference scope).

## Acceptance criteria

- [x] Minimap modes match reference rendering on fixture maps.
- [x] Click-to-navigate moves the viewport correctly (wrapping included).
- [x] Notifications queue, render, and jump per reference behavior.

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
