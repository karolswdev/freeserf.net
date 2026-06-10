# Evidence — SB-10-04 — Prove Authentic Visuals with Real Local Data

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/scripts/capture-local-screenshots.mjs` — opt-in capture script:
  serves the static build, imports the user's local `SPAU.PA` in headless
  Chromium, waits for the decoded scene, starts a game, builds a flag, and
  saves screenshots to the phase artifacts folder.
- `serfbound/package.json` — adds `npm run capture:local:screenshots`.
- `serfbound/scripts/test-local-assets.mjs` — real-data decoded-scene
  assertions: decoded render assets build from the real archive, all four
  object sprites decode, the scene fills the canvas with >1000 sprites, and a
  built flag renders the real flag sprite.
- `serfbound/docs/developer-guide.md` — documents the extended local checks and
  the capture command.
- `serfbound/packages/app/src/render-layer-scene.ts` — terrain field upgraded
  from a 1D ridge to two crossed triangle waves (2D rolling terrain) with a
  clamped-mask fallback so steep slope combinations never leave holes; terrain
  thresholds adjusted for the taller field.

## Verification artifacts

Opt-in real-data suite (`npm run test:local:assets` with local `SPAU.PA`):

```text
serfbound-local-asset-tests-ok: parsed SPAU.PA catalog, matched Phase 1 oracle
metadata, decoded real palettes, terrain sprites, 122 masks, and object
sprites, composed real terrain triangles into a 512x32 atlas, and built a
decoded scene with 2354 sprites.
```

Opt-in capture run (`npm run capture:local:screenshots`):

```text
serfbound-local-screenshots-ok: 3882 decoded sprites on screen; saved
artifacts/story-04-decoded-real-terrain-desktop.png,
artifacts/story-04-decoded-real-terrain-canvas.png,
artifacts/story-04-decoded-real-flag-desktop.png
```

Data-free release suite (`npm run ci:release`, no local data in env):

```text
# tests 60 / # pass 60 / # fail 0
6 passed (4.8s)            (Playwright browser suite)
serfbound-boundaries-ok
serfbound-release-artifact-ok: inspected 3 static files in dist/.
serfbound-static-hosting-ok: served dist at /serfbound/, imported generated SPAU.PA, and restored IndexedDB state after reload.
serfbound-docs-ok: player, developer, and static hosting docs cover required release topics.
serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
```

## Visual review note (human-checkable gate)

Reviewed `story-04-decoded-real-terrain-canvas.png` and
`story-04-decoded-real-flag-desktop.png` against Settlers I expectations:

- Terrain is real decoded ground art, not flat colors: textured green grass,
  brown dirt/desert transitions, snowy peaks, and deep-blue water ponds, tiled
  from masked 32x20 ground sprites with visible height relief.
- Authentic map objects render: trees (canopy + trunk + overlay shadows),
  pines, and stones from real `map_object`/`map_shadow` sprites.
- The built flag renders the real 16x19 `map_object` flag sprite (pole +
  banner) at the selected tile — verified in a zoomed crop during review.
- Remaining known gap (recorded, not hidden): the terrain layout comes from
  the deterministic synthetic height field, not the original map generator,
  and the view does not scroll. Both are explicitly out of phase scope.

## Acceptance criteria — re-checked

- [x] Opt-in script captures decoded-scene browser screenshots from real local
  `SPAU.PA` into the phase `artifacts/` folder.
- [x] Screenshots visibly show authentic terrain and authentic map
  objects/flag; review note above.
- [x] `npm run test:local:assets` asserts real-data decode and decoded-scene
  invariants.
- [x] `npm run ci:release` passes data-free; capture stays opt-in.

## Deviations from plan

- The visual review surfaced that the original 1D height ridge read as
  artificial diagonal stripes; the field was upgraded to a 2D crossed-wave
  terrain before accepting the screenshot. This stayed within story scope
  (the gate is "visibly resembles Settlers terrain").

## Follow-ups

- Next phase candidates: original map generator parity, viewport scrolling,
  waves and path masks, building sprites, then serf rendering/animation.
