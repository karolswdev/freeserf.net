# SB-5-04 — Verify Viewport Framing

- **Project:** serfbound
- **Phase:** 5
- **Status:** done
- **Depends on:** SB-5-03
- **Unblocks:** SB-6-01, SB-7-04, SB-8-04
- **Owner:** Codex

## Problem

A scene that only works on one desktop viewport is not enough. Serfbound needs
early evidence that the map is framed coherently across realistic browser sizes.

## Scope

- **In:** Desktop/mobile viewport checks, canvas sizing rules, screenshot or
  pixel checks, resize behavior, and overlap/nonblank assertions.
- **Out:** Full responsive UI design, accessibility audit, performance budgets,
  or final visual polish.

## Acceptance criteria

- [x] Automated or scripted checks cover at least one desktop and one mobile
  viewport.
- [x] Checks prove the canvas/scene is nonblank.
- [x] Map scene remains framed without incoherent overlap from shell UI.
- [x] Resize behavior is documented or intentionally deferred.
- [x] Evidence artifacts are referenced from the story evidence when shipped.

## Test plan

- **Unit:** n/a unless sizing helpers are extracted.
- **Integration / Cypress:** Browser viewport screenshot/canvas-pixel checks.
- **Manual / device:** Spot-check one real browser viewport if automation is
  incomplete.
- **Design handoff:** Screenshot evidence required.

## Notes / open questions

Shipped with automated desktop and mobile Playwright framing checks. The canvas
backing buffer now follows the displayed canvas size, and the render-layer scene
is regenerated for that virtual size on resize.

This is a technical framing check, not a visual redesign pass.
