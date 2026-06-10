# Evidence — SB-12-04 — Construct Buildings with Progress Sprites

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/engine/src/game-world.ts` — buildings carry `startTick`;
  `advanceConstruction(tick)` progresses sites through the interim
  time-stepped stages (leveling → frame at 40 ticks → done at 120), explicitly
  marked for replacement by Phase 13 serf labor.
- `serfbound/packages/engine/src/world-commands.ts` / `commands.ts` —
  `build-building` actions record `atTick` from the game clock, so replay
  restores construction timing exactly.
- `serfbound/packages/engine/src/local-game.ts` — restored worlds advance
  construction to the saved clock after replay.
- `serfbound/packages/app/src/landscape-scene.ts` — the reference
  `MapBuildingFrameSprite` table; sites render nothing while leveling, the
  authentic frame sprite at the frame stage, and the finished sprite when
  done; frame sprites precomposed into the atlas.
- `serfbound/packages/app/src/main.ts` — the animation driver advances the
  simulation clock and construction for running world games and exposes
  `data-serfbound-world-building-done-count`.

## Verification artifacts

```text
node --test tests/ci/engine-world-commands.test.mjs -> # tests 4 / pass 4
npm run test:unit    -> # tests 92 / # pass 92 / # fail 0
npm run test:browser -> 6 passed (5.4s)
```

Proven: buildings start leveling at their dispatch tick, show the frame at
+40 ticks, complete at +120; restored games derive completion from the saved
clock (not wall time), keeping replay deterministic.

## Acceptance criteria — re-checked

- [x] Building placement validity matches reference rules (CanBuildSmall/
  Mine/Large/Military ports, proven in SB-12-01/03 suites).
- [x] Construction progresses through reference stages with the correct
  sprite at each stage (frame table ported; CI stage test).
- [x] Completed buildings persist through save/load (action-log replay +
  clock-derived completion test).

## Deviations from plan

- Progress is time-stepped (interim, flagged in code and phase docs);
  Phase 13's SB-13-04 deletes this path in favor of serf-driven work.

## Follow-ups

- SB-12-05 adds the road/building UI and the end-to-end founding proof.
