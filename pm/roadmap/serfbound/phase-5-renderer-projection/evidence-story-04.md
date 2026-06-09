# Evidence — SB-5-04 — Verify Viewport Framing

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `serfbound/packages/app/src/main.ts` - resizes the canvas backing buffer to
  the displayed CSS pixel size and regenerates generated/catalog-backed scenes
  for that virtual size.
- `serfbound/tests/browser/static-shell.spec.ts` - adds desktop and mobile
  viewport framing checks with layout assertions, backing-size assertions, and
  WebGL2 nonblank pixel checks.
- `pm/roadmap/serfbound/adoption/render-layer-model.md` - documents the resize
  contract.
- `pm/roadmap/serfbound/phase-5-renderer-projection/artifacts/story-04-framing-desktop.png`
  - desktop viewport screenshot proof.
- `pm/roadmap/serfbound/phase-5-renderer-projection/artifacts/story-04-framing-mobile.png`
  - mobile viewport screenshot proof.
- `pm/roadmap/serfbound/phase-5-renderer-projection/story-04-viewport-framing-verification.md`
  - marks SB-5-04 done.
- `pm/roadmap/serfbound/phase-5-renderer-projection/current-phase-status.md` -
  closes the final Phase 5 exit criterion and marks the phase complete.

## Behavior protected

- Desktop viewport `1280x720` renders a nonblank WebGL2 map scene with the
  status panel beside the scene and no incoherent scene/status overlap.
- Mobile viewport `390x844` renders a nonblank WebGL2 map scene with the status
  panel stacked below the scene and no incoherent scene/status overlap.
- Canvas backing dimensions match the displayed canvas size after mount/resize.
- The same resize path supports generated fixture mode and catalog-backed scene
  mode.

## Screenshots

- Desktop: `artifacts/story-04-framing-desktop.png`
- Mobile: `artifacts/story-04-framing-mobile.png`

## Commands and output

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm test && npm run check:boundaries && npm run test:local:assets'
```

Output summary:

```text
31 unit tests passed.
2 chromium browser tests passed.
serfbound-boundaries-ok
serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
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

This story proves first-pass desktop/mobile framing for the Phase 5 scene. It
does not prove final responsive UI design, broad browser/device coverage,
camera controls, zoom, or gameplay input. Phase 6 owns pointer-to-map
interaction and input ergonomics.
