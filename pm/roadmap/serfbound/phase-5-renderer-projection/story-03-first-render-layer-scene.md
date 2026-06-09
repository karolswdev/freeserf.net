# SB-5-03 — Build First Render-Layer Scene

- **Project:** serfbound
- **Phase:** 5
- **Status:** ready
- **Depends on:** SB-5-01, SB-5-02, SB-4-04, SB-3-02
- **Unblocks:** SB-5-04, SB-6-01, SB-7-01
- **Owner:** unassigned

## Problem

The browser renderer needs a real scene tied to engine/map and asset data. A
nonblank scene with layers proves the renderer is attached to the game, not just
a graphics demo.

## Scope

- **In:** First map scene, render layers, generated fixture path, local
  `SPAU.PA` path where available, basic camera/viewport, and screenshot/pixel
  verification.
- **Out:** Full animation, all UI panels, audio, final art polish, or full map
  performance optimization.

## Acceptance criteria

- [ ] Browser scene renders a nonblank map-like view.
- [ ] Scene can run from generated fixtures in CI-safe mode.
- [ ] Scene can run locally using imported/cataloged `SPAU.PA` assets.
- [ ] Layer ordering is documented and testable.
- [ ] Renderer does not require desktop/native runtime.

## Test plan

- **Unit:** Render data preparation tests.
- **Integration / Cypress:** Browser screenshot or canvas-pixel smoke test.
- **Manual / device:** Open the scene with local assets and confirm visible map
  output.
- **Design handoff:** Basic screenshot evidence only.

## Notes / open questions

Generated fixtures are not optional; they keep CI alive without local assets.
