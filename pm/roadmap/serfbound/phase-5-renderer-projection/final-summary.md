# Phase 5 Final Summary — Renderer And Projection

**Completed:** 2026-06-09.
**Status:** complete; Phase 6 ready.

## Result

Phase 5 proved Serfbound can render a map-like scene in the browser with a
source-grounded projection model and ordered render layers. The phase selected a
small first-party WebGL2 renderer, added a browser-neutral
`MapProjectionTransform`, built the first WebGL2 render-layer scene, connected
that scene to generated CI-safe data and typed `SPAU.PA` catalog metadata, and
proved desktop/mobile viewport framing with Playwright pixel and layout checks.

This does not decode original sprite pixels or implement final camera controls.
It proves the renderer/projection gate needed for Phase 6 input work without
adding a .NET runtime, desktop wrapper, native launcher, local companion
process, or committed original asset payloads.

## Shipped Stories

| Story | Commit | Evidence | Result |
|---|---|---|---|
| SB-5-01 Choose browser renderer API | `2b65e33` | [evidence-story-01](./evidence-story-01.md) | Chose first-party WebGL2, rejected desktop/native renderer reuse, kept Canvas2D as debug/test-only, and deferred WebGPU. |
| SB-5-02 Implement map projection transform | `64b44db` | [evidence-story-02](./evidence-story-02.md) | Added browser-neutral map/tile/view/screen conversion and virtual-screen resize support in `@serfbound/engine`. |
| SB-5-03 Build first render-layer scene | `c848374` | [evidence-story-03](./evidence-story-03.md) | Added ordered WebGL2 triangle layers, generated CI-safe rendering, typed catalog-backed scene metadata, local real-asset scene proof, and a desktop screenshot. |
| SB-5-04 Verify viewport framing | `cd90c46` | [evidence-story-04](./evidence-story-04.md) | Added desktop/mobile viewport checks, canvas backing resize, nonblank pixel proof, layout overlap assertions, and framing screenshots. |

## Protected Renderer Surface

| Surface | Product artifact | Proof |
|---|---|---|
| Browser renderer baseline | WebGL2 decision artifact and app renderer | SB-5-01 decision plus browser smoke |
| Projection/input conversion | `MapProjectionTransform` | Unit tests over screen/view/map/tile conversion |
| Render layer stack | `renderLayerOrder`, `RenderScenePrimitive.layer` | Unit tests and `render-layer-model.md` |
| CI-safe scene path | generated scene mode | Browser smoke with local asset env vars unset |
| Local asset scene path | typed catalog-backed scene mode | Generated browser import and opt-in real `SPAU.PA` check |
| Viewport framing | canvas resize and Playwright layout checks | Desktop/mobile screenshots and WebGL2 `readPixels()` checks |

## Exit Criteria Audit

| Exit criterion | Evidence | Status |
|---|---|---|
| A browser scene renders a map-like view from typed assets or generated fixtures | SB-5-03 WebGL2 scene tests and screenshot | passed |
| Projection/coordinate conversion is documented and tested | SB-5-02 projection tests and engine README | passed |
| Render layers map back to `Freeserf.Core/Rendering.txt` concepts or intentionally replace them | `render-layer-model.md` and SB-5-03 tests | passed |
| Renderer can run without original data using generated fixtures and can run locally with imported `SPAU.PA` | Default browser smoke plus opt-in local `SPAU.PA` scene check | passed |
| Screenshots or pixel checks prove the scene is nonblank and correctly framed on desktop and mobile viewport sizes | SB-5-04 desktop/mobile Playwright screenshots, pixel checks, and layout assertions | passed |

## Verification Commands

These commands were used during the completion audit:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm test && npm run check:boundaries && npm run test:local:assets'
zsh -lc "source ~/.nvm/nvm.sh && cd serfbound && nvm use && SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 SERFBOUND_SPAU_PA='../serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA' npm run test:local:assets"
git diff --check
```

Representative output:

```text
1..31
# tests 31
# pass 31

✓  1 [chromium] › tests/browser/static-shell.spec.ts:25:1 › static app shell renders without original data or a desktop companion
✓  2 [chromium] › tests/browser/static-shell.spec.ts:146:1 › render layer scene stays framed on desktop and mobile viewports
2 passed

serfbound-boundaries-ok
serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
serfbound-local-asset-tests-ok: parsed SPAU.PA catalog and matched Phase 1 oracle metadata plus typed catalog and render-layer scene facts.
```

## Decisions

- Use a small first-party WebGL2 renderer for the Phase 5 baseline.
- Keep coordinate conversion in browser-neutral engine code so renderer and
  input shell can share the same projection math.
- Represent the first render scene as ordered triangle primitives assigned to
  `terrain`, `paths`, `shadows`, `objects`, and `markers` layers.
- Treat the displayed canvas rectangle as the render view's virtual screen for
  Phase 5; resize the WebGL backing buffer to CSS pixels and regenerate the
  scene for that size.
- Keep generated fixtures mandatory for CI and use local `SPAU.PA` only through
  explicit opt-in checks.

## Known Limitations

- Phase 5 does not decode sprite payloads, build a texture atlas, animate
  objects, or render final art parity.
- The camera is fixed to the first generated scene. Scroll, zoom, selection,
  and command-driven camera behavior belong to Phase 6 and Phase 7.
- Browser proof currently uses Chromium. Broader browser/device coverage remains
  Phase 8 hardening.
- Mobile verification proves first-pass framing and nonblank pixels, not final
  touch ergonomics or full responsive UI design.

## Phase 6 Handoff

Phase 6 starts with SB-6-01: implement pointer-to-map interaction. It now has
the required inputs from Phase 5: a WebGL2 canvas scene, stable canvas resize
behavior, and shared `MapProjectionTransform` conversion for pointer positions.
Phase 6 should prove hover/selection mapping before wiring destructive or
state-mutating commands.
