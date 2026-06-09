# Renderer API Decision

**Status:** accepted for Phase 5 baseline.
**Date:** 2026-06-09.
**Story:** SB-5-01.

## Decision

Use a small first-party WebGL2 renderer as Serfbound's Phase 5 baseline.

Canvas2D remains allowed for generated debug fixtures, fallback diagnostics, and
test helpers, but it is not the main map renderer. WebGPU is deferred as a later
accelerator. Third-party render libraries are deferred until implementation
evidence shows the first-party adapter would become broader than the renderer
surface Serfbound actually needs.

## Why WebGL2

The reference renderer is a Silk.NET/OpenGL renderer with sprites, triangles,
texture atlases, shaders, render layers, and a virtual render view. Serfbound is
not porting that code, but the browser replacement needs the same core
capabilities:

- texture atlas upload and sprite quads;
- ordered render layers that map back to `Freeserf.Core/Rendering.txt`;
- map-size batching without creating one DOM node or canvas draw call per
  visible tile/object;
- projection and virtual-screen transforms that Phase 6 can reuse for pointer
  mapping;
- screenshot and pixel checks in Playwright.

WebGL2 is the closest browser-native baseline to those constraints. MDN marks
`WebGL2RenderingContext` as Baseline / widely available and available across
browsers since September 2021, while still exposing the texture, buffer, shader,
and framebuffer model the source renderer already proves useful. It also keeps
normal play pure browser: no desktop renderer, native OpenGL context, .NET
runtime, local helper, or hidden server process.

## Alternatives Considered

### Canvas2D

Canvas2D is widely available and excellent for simple generated fixtures. It is
also what the current app shell uses for the static terrain preview.

Rejected as the main renderer because Phase 5 is explicitly about a layered map
scene and texture/atlas path, not a static illustration. Canvas2D would push
batching, per-layer invalidation, image smoothing rules, and later shader-like
effects into ad hoc code. If a generated map scene and local `SPAU.PA` scene
meet the Phase 5 pixel/framing gates with Canvas2D and less code than WebGL2,
that is a valid stop signal to reopen this decision.

### WebGPU

WebGPU is the likely long-term high-performance browser graphics API and is
worth keeping in mind for workers, compute-heavy asset conversion, and large
scene throughput. As of the current decision, MDN still marks the WebGPU API as
limited availability and not Baseline because it does not work in some widely
used browsers. Google's web.dev support update shows active rollout across
Chrome/Edge, Firefox, and Safari platforms, but also lists platform gaps and
in-progress support areas.

Rejected as the Phase 5 baseline because Serfbound needs the first playable
browser path to be boring and broadly testable. WebGPU can become a later
accelerator when browser support and Serfbound's measured scene costs justify
the extra pipeline complexity.

### Library-backed renderer

Three.js, PixiJS, Phaser, Babylon.js, and similar libraries are browser-native
options. They can help when rendering complexity outgrows a small adapter.

Deferred because Phase 5's first scene needs a narrow 2D isometric layer model,
not a general engine. Adding a rendering library before the first scene would
make the package boundary larger than the known problem. A library becomes
acceptable if SB-5-03 proves that texture atlas management, batching, context
loss recovery, or mobile pixel correctness is taking more code than a focused
dependency would remove.

### Desktop/native renderer reuse

Rejected. Silk.NET/OpenGL, native OpenGL contexts, Electron/Tauri wrappers,
desktop launchers, and .NET rendering code violate the Serfbound runtime
constraint. The existing renderer remains source canon for concepts only.

## Browser Support Position

- Canvas API: widely available and suitable for tests/debug/simple generated
  fixtures.
- WebGL2: browser-native baseline for the production map renderer.
- WebGPU: deferred until it is safe to require or optional to use.

The renderer adapter must detect WebGL2 support at runtime and produce a
recoverable "renderer unavailable" state if the browser or GPU denies a context.
Tests must still include a generated data path so CI never needs original game
assets.

## Testing Implications

SB-5-02 should keep projection math platform-free where possible and document
how virtual-screen/view transforms map to `Rendering.txt`.

SB-5-03 should introduce a browser renderer package or module that:

- creates a WebGL2 context from a canvas;
- accepts typed asset catalog request handles or generated fixtures;
- prepares layer-ordered render records before upload;
- includes a generated fixture path for CI;
- can optionally run locally after importing/persisting `SPAU.PA`;
- does not import raw archive parser internals or storage internals.

SB-5-04 must prove desktop and mobile viewport framing with screenshots or
canvas-pixel checks. A nonblank canvas alone is not enough; the scene must be
framed coherently and not overlapped by shell UI.

## Stop Signals

Reopen this decision if any of the following happen:

- WebGL2 context creation fails on a supported target browser/device class that
  Serfbound cannot reasonably exclude.
- The first generated map scene cannot meet target interaction/render cadence
  after basic batching and atlas use.
- Canvas2D proves the Phase 5 generated and local map scene with materially less
  code while still satisfying layer ordering, viewport, and future input needs.
- WebGPU becomes Baseline/widely available across the target browser matrix and
  removes real measured renderer complexity.
- A focused library demonstrably replaces more code than it adds while keeping
  the Serfbound renderer boundary testable and pure browser.

## Sources

- `Freeserf.Core/Rendering.txt` - source render concepts: sprites/triangles,
  render layers, virtual screen, and `ScreenToView`.
- `Freeserf.Renderer/*` - source OpenGL implementation reference for texture,
  shader, buffer, sprite, triangle, and atlas concepts.
- MDN WebGL2RenderingContext:
  https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext
- MDN Canvas API:
  https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- MDN WebGPU API:
  https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API
- web.dev WebGPU support update:
  https://web.dev/blog/webgpu-supported-major-browsers
