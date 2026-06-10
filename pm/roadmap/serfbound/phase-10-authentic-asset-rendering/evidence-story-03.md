# Evidence — SB-10-03 — Render Decoded Sprites in the Browser Scene

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/app/src/render-layer-scene.ts` — decoded-asset scene
  path: `buildDecodedRenderAssets()` (archive → decoded sprites → composed
  terrain combos → runtime atlas), a deterministic height/terrain lattice,
  sprite-primitive scene generation using the reference placement
  (`X = apexX − 16`, `Y = 20·apexRow − 4·apexHeight + maskOffsetY`), object
  and shadow placement, real flag sprites for built structures, and a textured
  WebGL2 render path (one atlas texture, alpha-blended quads). Non-decodable
  archives keep the existing catalog/fixture scene.
- `serfbound/packages/app/src/main.ts` — passes imported/restored archive bytes
  into the scene pipeline, tracks decoded assets alongside the typed catalog,
  exposes `data-serfbound-scene-source="dos-pa-decoded"` and
  `data-serfbound-sprite-count`, and shows decoded-scene status text.
- `serfbound/packages/test-support/src/decodable-pa-fixture.ts` — generated,
  CI-safe decodable `.PA` fixture (palette, 33 grounds, 81+81 masks, tree,
  flag, shadows) so the decode → compose → render path runs data-free.
- `serfbound/tests/ci/app-decoded-render-scene.test.mjs` — scene-structure CI
  tests over the fixture.
- `serfbound/tests/browser/decoded-scene.spec.ts` — end-to-end browser test:
  import → decoded scene → IndexedDB reload restore → start game → build flag,
  with a screenshot artifact.

## Verification artifacts

Scene CI tests (`node --test tests/ci/app-decoded-render-scene.test.mjs`):

```text
# tests 4
# pass 4
# fail 0
```

Full data-free unit suite (`npm run test:unit`): 60 tests, 0 failures.
Boundary check (`npm run check:boundaries`): `serfbound-boundaries-ok`.

Browser suite (`npm run test:browser`):

```text
✓ decoded-scene.spec.ts › importing a decodable archive renders the decoded sprite scene
✓ static-shell.spec.ts › static app shell renders without original data or a desktop companion
✓ static-shell.spec.ts › render layer scene stays framed on desktop and mobile viewports
✓ static-shell.spec.ts › corrupt imported data can be reset from the browser shell
✓ static-shell.spec.ts › corrupt save data can be reset without losing imported data
✓ static-shell.spec.ts › quota and write errors produce recoverable browser feedback
6 passed (5.1s)
```

The pre-existing browser tests (which import the minimal catalog-only archive)
pass unchanged, proving the graceful fallback. The new test proves the decoded
scene in a real Chromium browser: scene source flips to `dos-pa-decoded`, over
1000 sprites render, the scene survives reload via IndexedDB restore, and a
built flag renders through the decoded path. Screenshot (generated fixture
colors, not original art):
`artifacts/story-03-decoded-scene-generated-desktop.png` — full terrain
coverage with no gaps.

Real-data spot check (node, local `SPAU.PA`, not committed to CI):

```text
terrainCombos: 32 objects: obj:tree,obj:pine,obj:stone,obj:flag atlas: 512x82
scene source: dos-pa-decoded | sprites: 2354 | terrain: 2312 | flag sprites: 1
```

## Acceptance criteria — re-checked

- [x] Decodable archives render the decoded scene; the CI-generated minimal
  archive keeps the catalog scene and all existing browser tests pass.
- [x] Terrain sprite primitives use composed atlas regions with reference
  placement math (CI scene tests, including key→region resolution).
- [x] Built flags render the real `map_object` flag sprite (CI + browser test).
- [x] Decoded scene survives reload via IndexedDB restore (browser test).
- [x] `npm test` data-free passes; decoded path exercised in CI via the
  synthetic decodable fixture.

## Deviations from plan

- The decoded scene's terrain/height field is a deterministic synthetic
  lattice as planned; one detail beyond plan: atlas combos are collected over
  a fixed 84x104 lattice so the atlas is canvas-size independent, and scene
  cells outside known combos skip gracefully.

## Follow-ups

- SB-10-04 captures and reviews real-data screenshots and wires real-data
  scene assertions into the opt-in local suite.
