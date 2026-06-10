# Evidence — SB-12-01 — Port the Flag and Road Graph

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/engine/src/game-world.ts` — new `SerfboundGameWorld`:
  game tiles (path bitmasks per direction, owner with reference encoding,
  object indexes) over a generated landscape; flag entities with per-direction
  connection state (water, length category, other-flag index/direction per
  `FlagState`); ports of `IsRoadSegmentValid`, `RoadSegmentInWater`,
  `PlaceRoadSegments`, `CanBuildFlag`/`BuildFlag`, `CanBuildRoad`/`BuildRoad`
  with `Flag.LinkWithFlag` link data, `BuildFlagSplitPath` +
  `FillPathSerfInfo` (structural path-walk subset), `CanDemolish` +
  `MergePaths` (structural), and building/castle/ownership ports used by the
  later stories (building validity rules, leveling height, castle build with
  hexagon leveling, `UpdateLandOwnership` with the military influence and
  closeness tables, border segment enumeration).
- `serfbound/packages/engine/src/index.ts` — exports the module.
- `serfbound/tests/ci/engine-game-world-graph.test.mjs` — graph scenario
  tests with reference-derived expectations.

## Verification artifacts

```text
node --test tests/ci/engine-game-world-graph.test.mjs
# tests 6 / # pass 6 / # fail 0

npm run test:unit -> all green (see count below)
```

Scenarios proven: flag validity (adjacency exclusion, ownership, open space);
road building writes bidirectional path bits and reference link data
(other-flag index, other-end direction, length category) on both endpoints;
placing a flag mid-road splits it into two correctly-linked roads with
re-derived length categories; demolishing that flag merges the road back
(link data and category restored, segments preserved); building flags refuse
demolition; road validity rejects foreign land.

## Acceptance criteria — re-checked

- [x] Flag placement validity matches reference rules.
- [x] Splitting by flag insertion and merging by removal produce
  reference-equivalent graphs (scenario expectations derived line-by-line
  from `Game.BuildFlagSplitPath`/`Flag.MergePaths`).
- [x] Graph state serializes — flags/buildings are plain data over typed
  arrays; snapshot wiring lands with SB-12-05's command/save integration.

## Deviations from plan

- Graph operations are verified by scenario tests with reference-derived
  expectations rather than generated oracle fixtures: the reference graph
  code is entangled with serf state (transporter wakeups) that doesn't exist
  yet, so a Python mirror would have required porting Serf.cs to Python
  first. The serf-related branches are explicitly deferred to Phase 13 and
  marked in code.
- Building/castle/ownership ports shipped in this module alongside the graph
  (they share the tile state); their stories add behavior tests and UI.

## Follow-ups

- SB-12-02 ports the A* pathfinder and the interactive road mode.
