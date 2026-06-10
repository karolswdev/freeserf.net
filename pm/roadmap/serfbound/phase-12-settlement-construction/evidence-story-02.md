# Evidence — SB-12-02 — Port Road Pathfinding and Road-Building Mode

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/engine/src/pathfinder.ts` — A* port of
  `Pathfinder.FindShortestPath`: searches end→start, walk-cost table
  [255,319,383,447,511] by height difference, distance heuristic, binary-heap
  open set. Deterministic node-expansion cap replaces the reference's
  wall-clock abort (recorded divergence).
- `serfbound/packages/app/src/landscape-scene.ts` — road segment rendering per
  `RenderRoadSegment`: mask = heightDiff + 4 + direction*9; ground sprite from
  slope class (+0/+1/+2) and terrain class (grass/desert/snow/water); per-
  direction terrain/offset rules; all 270 path combos precomposed into the
  atlas; world flags render real flag sprites; scenes read the live world's
  mutable arrays when present.
- `serfbound/packages/app/src/render-layer-scene.ts` — raw path_ground (10)
  and path_mask (27) decodes on the decoded assets.
- `serfbound/packages/test-support/src/decodable-pa-fixture.ts` — fixture
  gains path mask/ground entries.
- `serfbound/tests/ci/engine-pathfinder.test.mjs`,
  `serfbound/tests/ci/app-road-rendering.test.mjs` — new tests.

## Verification artifacts

```text
node --test tests/ci/engine-pathfinder.test.mjs   -> # tests 4 / pass 4
node --test tests/ci/app-road-rendering.test.mjs  -> # tests 2 / pass 2
npm run test:unit                                 -> # tests 88 / pass 88 / fail 0
```

Proven: straight flat routes at exactly 255/segment; obstacle/foreign-land
detours that remain segment-valid end-to-end; slope cost increases;
unreachable targets return null; 270 path combos in the atlas; built roads
and world flags render with the reference mask/ground selection
(flat right segment = path:1:4).

## Acceptance criteria — re-checked

- [x] Pathfinder routes + costs match reference expectations.
- [x] Engine enforces segment validity; interactive road mode transferred to
  SB-12-05 (recorded in story Notes).
- [x] Roads render with correct path-mask sprites for slope/direction.

## Deviations from plan

- Wall-clock abort → deterministic node cap (recorded).
- Interactive browser road mode transferred to SB-12-05 where the build UI
  lives.

## Follow-ups

- SB-12-03 wires castle placement, territory, and border rendering.
