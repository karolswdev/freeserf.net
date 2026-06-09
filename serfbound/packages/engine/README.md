# @serfbound/engine

`@serfbound/engine` owns deterministic simulation primitives. Product code in
this package must stay platform-free: no DOM, Canvas, WebAudio, storage, local
file APIs, desktop wrappers, native launchers, or `.NET` runtime dependency.

## Numeric Policy

The first ported numeric surface is the subset needed by
`Freeserf.Core/Random.cs` and the Phase 1 `rng.fixed-seed-sequence` fixture.

- `uint16(value)` wraps a JavaScript number to C# `UInt16` range.
- `int16(value)` interprets a wrapped 16-bit value as signed two's-complement.
- `uint32(value)` wraps a JavaScript number to unsigned 32-bit range.
- `rotateRight16(value, bits)` rotates inside a 16-bit word after wrapping the
  input.

All overflow-sensitive code must use these helpers or similarly explicit
helpers. Do not rely on implicit JavaScript number behavior for simulation
state.

## Random Policy

`FreeserfRandom` mirrors the captured behavior of `Freeserf.Random` for:

- `Random(ushort)`;
- `Random(ushort base0, ushort base1, ushort base2)`;
- `Random(string)` for 16-character strings containing digits `1` through `8`;
- `Next()`;
- `ToString()`;
- `operator ^`.

The implementation is fixture-backed by
`pm/roadmap/serfbound/reference-fixtures/ci/rng-fixed-seed-sequence.json`.
There are no intentional behavior divergences from the captured fixture.

Known fixture note: the operator-`^` fixture's `constructor.values` metadata is
not used as the initial state because the Phase 1 capture recorded that field
from a mutable list. Tests reconstruct the initial state from `leftState` and
`rightState`, then compare the fixture's `initialState` and every step.

## Map Geometry Policy

`MapGeometry` mirrors the captured Phase 1 behavior of
`Freeserf.Core/MapGeometry.cs` for:

- `Direction`, `DirectionExtensions.Turn()`, and `Reverse()`;
- default clockwise/counter-clockwise direction cycles and
  `DirectionCycleCW.CreateWithout()`;
- `MapGeometry` dimensions derived from map size;
- `Position()`, `PositionColumn()`, `PositionRow()`, `PositionAdd()`, movement,
  direction-to-neighbor, and shortest signed `DistanceX()` / `DistanceY()`;
- pure projection helpers corresponding to the captured subset of
  `CoordinateSpace.TileSpaceToMapSpace()`, `MapSpaceToViewSpace()`,
  `ViewSpaceToMapSpace()`, `MapSpaceToTileSpace()`, and
  `ViewSpaceToTileSpace()`.

The implementation is fixture-backed by
`pm/roadmap/serfbound/reference-fixtures/ci/map-geometry-facts.json`, including
sizes 3 and 4, edge wraparound, direction offsets, distance samples, and
projection samples using the fixture's synthetic height model.

Known primitive boundary: only the first seven `PositionAddSpirally()` offsets
are present because the captured `MapSpaceToTileSpace()` search needs the
center tile plus the first ring. The full 295-entry spiral search belongs to a
later state/pathfinding story if a fixture requires it.

## Projection Transform Policy

`MapProjectionTransform` is the shared coordinate conversion surface for
renderer and input code. It composes the map/view helpers above with a
browser-neutral virtual screen transform inspired by
`Freeserf.Core/Rendering.txt` and `FreeserfNet/GameView.cs`:

- render code works in a virtual view size independent of the real browser
  viewport;
- real screen coordinates are clipped to the active display rectangle before
  becoming view coordinates;
- letterboxing preserves the virtual aspect ratio and exposes the active
  `displayRect`;
- `resize(screenSize)` returns an equivalent transform for a new viewport;
- map, tile, view, and screen conversions are available without DOM, Canvas,
  WebGL, CSS, storage, desktop, or `.NET` dependencies.

The implementation is fixture-backed by
`tests/ci/engine-projection-transform.test.mjs`. Tests cover letterboxed
screen-to-view conversion, quarter-turn rotation, resize behavior, map-to-screen
projection, screen-to-map conversion, and screen-to-tile lookup through the same
synthetic height fixture used by `MapGeometry`.

## State And Tick Policy

`SerfboundGameState` is the first deterministic state container. It mirrors the
source-visible tick and save-facing fields from `Freeserf.Core/GameState.cs`,
`Freeserf.Core/Game.cs`, and `Freeserf.Core/Freeserf.cs` for:

- `DEFAULT_GAME_SPEED = 2`;
- `TICK_LENGTH = 20` and `TICKS_PER_SEC = 50`;
- 16-bit `Tick` wrapping and 32-bit `ConstTick` wrapping;
- `GameTimeTicksOfSecond`, `GameTime`, and `NextGameTime` progression;
- the source `tickDifference` overflow formula used by `Game.Update()`;
- source-owned random mutation through `nextRandomInt()`, matching
  `Game.RandomInt()`;
- the first scheduling counters for knight morale and inventory dispatch;
- a stable JSON snapshot with map dimensions, clock fields, RNG state/string,
  and counters.

Known skeleton boundary: this does not port `Map.Update()`, players, AI,
visuals, stats/history, savegame text/binary compatibility, dirty-state
serialization, or local asset-backed initialization. Those systems require
their own fixtures or later phase evidence.

## Combined Parity Policy

`engine-simulation-parity.test.mjs` is the first combined engine slice. It
drives one `SerfboundGameState` through source-owned RNG mutation, map movement,
and tick advancement while consuming the Phase 1 RNG and map geometry fixtures.

This proof protects the integration boundary between deterministic primitives.
It is not full gameplay parity: there is still no terrain mutation, economy,
pathfinding, player AI, rendering, asset-backed initialization, or savegame
serializer parity.
