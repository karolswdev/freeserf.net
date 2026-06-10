# SB-19-05 — Onboarding, Accessibility, and Settings

- **Project:** serfbound
- **Phase:** 19
- **Status:** done
- **Depends on:** SB-19-04
- **Unblocks:** SB-20-01
- **Owner:** unassigned

## Problem

The first five minutes and every-player concerns - a guided first-run that gets users from nothing to playing with their own data, plus keyboard playability, contrast, reduced-motion, and a coherent settings surface.

## Scope

- **In:** First-run onboarding flow (what SPAU.PA is, where it lives, drag-drop import, success state), keyboard map for core play, contrast and reduced-motion passes over the authentic UI, consolidated settings (audio/video/controls) persistence, accessibility audit with fixes.
- **Out:** Localization; tutorial gameplay content.

## Acceptance criteria

- [x] A new user reaches gameplay from a clean profile guided end-to-end (browser-tested).
- [x] Core loop playable by keyboard
- [x]  audit findings fixed or recorded.
- [x] Settings persist and apply across reloads and devices.

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
