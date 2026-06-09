# Serfbound Render Layer Model

**Status:** accepted for Phase 5 SB-5-03.

## Source Concept

`Freeserf.Core/Rendering.txt` describes rendering as a set of sprites or
triangles assigned to render layers. Those layers are then added to a render
view with a virtual screen independent of real screen resolution.

Serfbound keeps that concept, but makes the first browser implementation a
small WebGL2 triangle renderer:

- `FirstRenderLayerScene.primitives` are the sprite/triangle equivalents.
- `RenderScenePrimitive.layer` is the layer assignment.
- `renderLayerOrder` is the render-view layer stack.
- `MapProjectionTransform` owns virtual-screen/map/screen conversion.

## Phase 5 Layer Stack

| Order | Serfbound layer | Source concept | First scene contents |
|---:|---|---|---|
| 0 | `terrain` | map tile triangles | Generated projected terrain diamonds tied to `MapGeometry` |
| 1 | `paths` | path ground sprites/triangles | Generated path strips using typed `path_ground` request metadata |
| 2 | `shadows` | overlay/shadow sprites | Object shadow triangles using typed `map_shadow` request metadata |
| 3 | `objects` | map/game object sprites | Generated map object triangles using typed `map_object` request metadata |
| 4 | `markers` | gameplay object markers/sprites | Generated flag/marker triangles using typed `game_object` request metadata |

The first scene deliberately uses generated geometry and colors for CI safety.
When a local `SPAU.PA` catalog is imported or restored, the scene rebuilds from
the same generated geometry but records availability from the typed renderer
asset requests. Sprite decoding and texture atlas packing remain later work.

## Test Contract

- `tests/ci/app-render-layer-scene.test.mjs` verifies layer order, primitive
  ordering, generated fixture mode, engine-backed map size, and typed DOS
  catalog renderer asset status.
- `tests/browser/static-shell.spec.ts` verifies the browser shell renders the
  WebGL2 scene without original data, switches to catalog-backed scene metadata
  after importing generated `SPAU.PA`, restores that state from IndexedDB, and
  proves nonblank pixels through `WebGL2RenderingContext.readPixels()`.

## Resize Contract

The app treats the displayed canvas rectangle as the render view's virtual
screen. On mount and resize:

- the canvas backing width and height are set to the rounded CSS pixel size;
- `createFirstRenderLayerScene({ size })` regenerates projected primitives for
  that virtual size;
- the WebGL viewport matches the backing size;
- generated and catalog-backed scene modes use the same resize path.

This is intentionally a first framing contract, not final camera behavior. Map
scrolling, zoom, and richer camera controls move to Phase 6 and Phase 7 once
pointer-to-map interaction exists.
