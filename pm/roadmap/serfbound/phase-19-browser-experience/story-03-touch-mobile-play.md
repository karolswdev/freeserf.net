# SB-19-03 — Touch and Mobile Play

- **Project:** serfbound
- **Phase:** 19
- **Status:** done
- **Depends on:** SB-19-02
- **Unblocks:** SB-19-04
- **Owner:** unassigned

## Problem

First-class means playable on an iPad on the couch - touch-first map interaction (pan, tap-select, road laying), hit targets and popup layouts that work on small screens, all device-tested.

## Scope

- **In:** Touch gesture layer (pan/tap/long-press/pinch-zoom), zoom support in the decoded renderer, responsive adaptation of the authentic UI (panel/popup scaling), Playwright mobile-position coverage, real-device test notes.
- **Out:** Native app wrappers.

## Acceptance criteria

- [x] Full game loop playable with touch only (browser-tested in mobile positions).
- [x] Pinch zoom and pan feel responsive (measured input latency).
- [x] Real-device session notes recorded for tablet and phone.

## Test plan

- **Unit:** Logic-level tests where applicable.
- **Integration / Cypress:** Browser tests incl. mobile positions.
- **Manual / device:** Real-device sessions recorded as evidence.
- **Design handoff:** Screenshots/metrics under phase artifacts.

## Notes / open questions

- Preserves: gameplay behavior unchanged (parity fixtures stay green).
- Browser boundary: service workers, touch/pointer, PWA install, perf.
- .NET reference use: none.
- Phase gate advanced: see phase exit criteria.
