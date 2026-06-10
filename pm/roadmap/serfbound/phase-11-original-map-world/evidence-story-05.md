# Evidence — SB-11-05 — Render Waves and Map Borders

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/app/src/landscape-scene.ts` — wave composition (16
  frames x full/up/down shore variants, masks widened to the 48px wave width
  per the reference `ClearTo`), wave placement per `RenderMap.UpdateWave`
  (frame `((pos ^ 5) + (tick >> 3)) & 0xf`, full waves on open water,
  masked variants on up/down shores at the reference offsets).
- `serfbound/packages/app/src/render-layer-scene.ts` — decoded assets carry
  the 16 raw `map_waves` sprites.
- `serfbound/packages/app/src/main.ts` — wave animation timer (reference
  cadence: one frame per 8 ticks), paused when the tab is hidden and disabled
  entirely under `prefers-reduced-motion`.
- `serfbound/packages/test-support/src/decodable-pa-fixture.ts` — fixture
  archive gains the 16 wave entries so the path runs data-free in CI.
- `serfbound/tests/ci/app-landscape-scene.test.mjs` — wave variant, layer,
  coverage, and frame-advance tests.
- `serfbound/docs/developer-guide.md` — capture env documentation.

## Verification artifacts

```text
node --test tests/ci/app-landscape-scene.test.mjs -> # tests 6 / pass 6
npm run test:unit    -> # tests 76 / # pass 76 / # fail 0
npm run test:browser -> 6 passed (5.1s)
```

Real-data capture: `artifacts/story-05-waves-running-game-desktop.png`
(4741 decoded sprites on screen; the wave layer adds 87 sprites over the
visible lakes versus the SB-11-04 capture).

## Acceptance criteria — re-checked

- [x] Water triangles show animated waves with correct masking against shores
  (full/up/down variants, reference frame selection; CI frame-advance test).
- [x] Map borders: re-scoped with evidence — the reference world is a torus
  with no map edge. `map_border` sprites belong to `RenderBorderSegment`
  (player territory borders), confirmed in source; they ship with territory
  rendering in Phase 12 (SB-12-03). Recorded as a phase decision.
- [x] Animation pauses when the tab is hidden and respects reduced-motion.
- [x] Real-data screenshots recorded as evidence.

## Deviations from plan

- "Map borders" turned out not to exist in the reference (torus world); the
  border art is territory-border art. Re-scoped to Phase 12 with the source
  citation rather than inventing a non-original world edge.

## Follow-ups

- Phase 12 renders territory borders using `map_border` sprites (SB-12-03).
