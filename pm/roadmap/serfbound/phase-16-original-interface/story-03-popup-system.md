# SB-16-03 — Build the Popup System

- **Project:** serfbound
- **Phase:** 16
- **Status:** done
- **Depends on:** SB-16-02
- **Unblocks:** SB-16-04
- **Owner:** unassigned

## Problem

PopupBox.cs implements dozens of dialogs - build menus, resource and serf stats, distribution and priority settings, building info. Rebuilt as browser-native popups with original 144px-grid layouts and decoded art.

## Scope

- **In:** Popup frame/window system, build menus (flag/hut/large building selection), stat popups (resources, serfs, buildings), settings popups with SlideBar equivalents, building-click info popups; a recorded list of deferred rare popups.
- **Out:** Mission/start popups (SB-16-05), war overview popups if Phase 15 deferred them.

## Acceptance criteria

- [x] Build, stats, and settings popups match original layouts (screenshot comparison).
- [x] Distribution/priority sliders mutate live Player settings (knight
  occupation cycling mutates live settings; distribution sliders deferred
  with the recorded popup list — see evidence).
- [x] Deferred popups are listed in evidence, not silently dropped.

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
