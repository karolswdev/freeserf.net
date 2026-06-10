# SB-19-04 — PWA Install and Offline Shell

- **Project:** serfbound
- **Phase:** 19
- **Status:** done
- **Depends on:** SB-19-03
- **Unblocks:** SB-19-05
- **Owner:** unassigned

## Problem

An installable app that opens offline - service worker caching the app shell (never game data), a manifest with proper icons, and update flow that does not strand players mid-session.

## Scope

- **In:** Web manifest + icons (original-art-free), service-worker shell caching with versioned updates and update prompts, offline behavior with previously imported IndexedDB data, release-artifact checks extended to PWA assets.
- **Out:** Background sync, push notifications.

## Acceptance criteria

- [x] Installs as a PWA on desktop and mobile.
- [x] Cold-start offline reaches a playable state with imported data.
- [x] Updates apply without data loss
- [x]  original data never enters caches.

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
