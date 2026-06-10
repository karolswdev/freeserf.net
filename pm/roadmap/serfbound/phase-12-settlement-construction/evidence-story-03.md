# Evidence — SB-12-03 — Place the Castle and Claim Territory

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/engine/src/world-commands.ts` — serializable world
  actions (`build-castle`/`build-flag`/`build-road`/`build-building`/
  `demolish-flag`) with apply/replay; saves store the accepted-action log and
  restores replay it over the regenerated world.
- `serfbound/packages/engine/src/commands.ts` — world command routing
  (castle/flag/road via pathfinder/building/demolish), world facts in
  snapshots, world-action recording into game state.
- `serfbound/packages/engine/src/simulation.ts` — `worldActions` on game
  state snapshots.
- `serfbound/packages/engine/src/local-game.ts` — `SerfboundLocalGame.world()`
  rebuilds the world from landscape + replayed action log.
- `serfbound/packages/app/src/landscape-scene.ts` — building rendering via the
  reference `MapBuildingSprite` table (castle = map_object 0xb2), territory
  border markers on owner-different edges (simplified sprite pick recorded),
  all building sprites + border sprites precomposed.
- `serfbound/packages/app/src/main.ts` — castle placement mode (first click
  founds the settlement), world-routed flag building, world state attributes.
- `serfbound/packages/app/src/render-layer-scene.ts` — map_object decode range
  0..192 + map_border decodes.
- Tests: `engine-world-commands.test.mjs` (new), browser spec castle-first
  flow, fixture building/border entries, snapshot expectations updated.

## Verification artifacts

```text
node --test tests/ci/engine-world-commands.test.mjs -> # tests 3 / pass 3
npm run test:unit   -> # tests 91 / # pass 91 / # fail 0
npm run test:browser -> 6 passed (5.6s)
```

Proven: castle placement claims territory per the ported `UpdateLandOwnership`
(influence + closeness tables; landArea > 100 around a castle); second castle
rejected; flags/roads/buildings build inside territory and are rejected
outside; saved games replay the action log to per-tile identical worlds
(paths, owners, objects arrays deep-equal).

Real-data captures (`artifacts/story-03-castle-*.png`): the authentic castle
sprite (white towers, red roofs) stands on leveled grass with its flag, and
territory border stakes mark the ownership boundary. Reviewed zoomed.

## Acceptance criteria — re-checked

- [x] Castle placement validity matches reference rules (unowned land spiral
  check, open space, leveling constraints via CanBuildLarge).
- [x] Territory claim follows the reference influence computation; borders
  render visibly (sprite *selection* simplified — recorded).
- [x] The start-game flow requires castle placement before other actions
  (browser test: first click founds, then flags).

## Deviations from plan

- Border sprite selection is a deterministic terrain/parity pick until the
  RenderBorderSegment port (recorded; visuals reviewed as acceptable stakes).
- `SurrenderLand`/military occupation checks in ownership updates are
  Phase 15 scope (single-player phase cannot reach them); marked in code.

## Follow-ups

- SB-12-04: construction stages; SB-12-05: road/building UI + end-to-end.
