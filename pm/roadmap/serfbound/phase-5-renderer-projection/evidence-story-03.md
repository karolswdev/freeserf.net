# Evidence — SB-5-03 — Build First Render-Layer Scene

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `serfbound/packages/app/src/render-layer-scene.ts` - adds the first WebGL2
  render-layer scene model and renderer.
- `serfbound/packages/app/src/main.ts` - mounts the WebGL2 scene, starts from
  generated fixture data, and switches scene metadata after `SPAU.PA` catalog
  import or restore.
- `serfbound/tests/ci/app-render-layer-scene.test.mjs` - verifies layer order,
  generated mode, engine-backed map size, primitive ordering, and typed DOS
  catalog renderer asset summaries.
- `serfbound/tests/browser/static-shell.spec.ts` - verifies browser scene state,
  generated and catalog-backed rendering metadata, IndexedDB restore, and
  nonblank WebGL2 pixels.
- `serfbound/scripts/test-local-assets.mjs` - extends the opt-in local
  `SPAU.PA` check to instantiate the first render-layer scene from the real
  typed catalog.
- `pm/roadmap/serfbound/adoption/render-layer-model.md` - documents the layer
  stack against `Freeserf.Core/Rendering.txt`.
- `pm/roadmap/serfbound/phase-5-renderer-projection/artifacts/story-03-render-layer-scene-desktop.png`
  - desktop screenshot artifact from the browser smoke.
- `pm/roadmap/serfbound/phase-5-renderer-projection/story-03-first-render-layer-scene.md`
  - marks SB-5-03 done.
- `pm/roadmap/serfbound/phase-5-renderer-projection/current-phase-status.md` -
  checks the render-scene exit criteria and opens SB-5-04 as ready.

## Behavior protected

- The app renders a nonblank map-like WebGL2 scene without original game data.
- The first scene is tied to `MapGeometry` and `MapProjectionTransform`, not a
  static image or detached graphics demo.
- Scene primitives are assigned to ordered `terrain`, `paths`, `shadows`,
  `objects`, and `markers` layers.
- Generated fixture rendering keeps CI data-free.
- Imported or restored `SPAU.PA` catalogs rebuild scene metadata from typed
  renderer asset requests without committing or redistributing asset payloads.
- The opt-in local asset path proves the real ignored `SPAU.PA` catalog can
  feed the first scene model.

## Sources reviewed

- `Freeserf.Core/Rendering.txt`
- `Freeserf.Core/Render/IRenderLayer.cs`
- `Freeserf.Core/Render/RenderMap.cs`
- `pm/roadmap/serfbound/adoption/renderer-api-decision.md`
- `pm/roadmap/serfbound/adoption/render-layer-model.md`

## Commands and output

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm test && npm run check:boundaries && npm run test:local:assets'
```

Output summary:

```text
31 unit tests passed.
1 chromium browser smoke passed.
serfbound-boundaries-ok
serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
```

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && npm run test:unit'
```

Output summary:

```text
31 unit tests passed.
```

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && npm run test:browser'
```

Output summary:

```text
1 chromium browser smoke passed.
WebGL2 scene pixel check passed with nonblank canvas output.
```

Command:

```bash
zsh -lc "source ~/.nvm/nvm.sh && cd serfbound && nvm use && SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 SERFBOUND_SPAU_PA='../serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA' npm run test:local:assets"
```

Output summary:

```text
serfbound-local-asset-tests-ok: parsed SPAU.PA catalog and matched Phase 1 oracle metadata plus typed catalog and render-layer scene facts.
```

## Proof Boundaries

This story proves the first browser render-layer scene, not sprite decoding,
texture atlas packing, animation, final art parity, mobile framing, or
performance. SB-5-04 owns desktop/mobile viewport framing proof.
