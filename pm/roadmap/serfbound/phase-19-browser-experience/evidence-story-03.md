# Evidence — SB-19-03 — Touch and Mobile Play

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/app/src/panel-bar.ts` — `uiScaleFor`: canvases
  narrower than 700 px drop the chrome to 1x integer scale so the
  original 320-wide layouts (panel bar, popups, init screen) fit phone
  canvases without overflow or fractional scaling.
- `serfbound/packages/app/src/landscape-scene.ts` /
  `render-layer-scene.ts` / `main.ts` — every chrome surface (HUD, panel
  bar, popups, minimap, init screen) renders AND hit-tests at the
  responsive scale; pointer handling is identical for touch (the
  PointerEvent path already unified mouse/touch in Phase 6).
- `serfbound/tests/browser/mobile-play.spec.ts` — an iPhone-13 viewport
  with `hasTouch`: the whole flow drives by tap — the init screen START
  begins the game, map taps found the castle, the panel's road slot
  toggles road mode, and the stats popup opens and closes — all against
  the 1x mobile layout.

## Verification artifacts

```text
npx playwright test tests/browser/mobile-play.spec.ts -> 1 passed
npm run test:browser -> 7 passed (2.0m)
npm run test:unit -> # tests 171 / pass 171 / fail 0
```

Device facts from the run: a 354 px-wide canvas on the iPhone-13 viewport
renders the full authentic chrome at 1x; the init box, panel slots, and
popups land where the responsive hit-testing expects them.

## Deviations from plan

- Device-lab hardware testing remains the Phase 8 compatibility matrix's
  emulated positions plus this touch-flow proof; physical-device notes
  join the launch checklist (SB-20).
- Pinch-zoom of the map is recorded for the polish backlog (scroll and
  drag-pan already work by touch).

## Follow-ups

- SB-19-04: PWA install and offline shell.
