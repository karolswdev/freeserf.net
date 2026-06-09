# SB-5-04 — Verify Viewport Framing

- **Project:** serfbound
- **Phase:** 5
- **Status:** ready
- **Depends on:** SB-5-03
- **Unblocks:** SB-6-01, SB-7-04, SB-8-04
- **Owner:** unassigned

## Problem

A scene that only works on one desktop viewport is not enough. Serfbound needs
early evidence that the map is framed coherently across realistic browser sizes.

## Scope

- **In:** Desktop/mobile viewport checks, canvas sizing rules, screenshot or
  pixel checks, resize behavior, and overlap/nonblank assertions.
- **Out:** Full responsive UI design, accessibility audit, performance budgets,
  or final visual polish.

## Acceptance criteria

- [ ] Automated or scripted checks cover at least one desktop and one mobile
  viewport.
- [ ] Checks prove the canvas/scene is nonblank.
- [ ] Map scene remains framed without incoherent overlap from shell UI.
- [ ] Resize behavior is documented or intentionally deferred.
- [ ] Evidence artifacts are referenced from the story evidence when shipped.

## Test plan

- **Unit:** n/a unless sizing helpers are extracted.
- **Integration / Cypress:** Browser viewport screenshot/canvas-pixel checks.
- **Manual / device:** Spot-check one real browser viewport if automation is
  incomplete.
- **Design handoff:** Screenshot evidence required.

## Notes / open questions

This is a technical framing check, not a visual redesign pass.
