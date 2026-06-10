# Evidence — SB-14-05 — Full-Economy Gate with Live Stats

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/engine/src/serfs.ts` — demand-driven dispatch ported
  from the reference building stock model: `#emitProduct` now counts
  in-flight requests (`requestedResources`) alongside delivered stock so
  producers stop pushing once a consumer's pipeline holds 4; transporters
  only pick up cargo when the next hop can take the hand-over (final
  destinations always accept, intermediate flags need a free slot); carried
  resources are never destroyed — a carrier that cannot hand over waits at
  the flag and retries. These three rules remove the saturation livelock
  where the castle flag's eight slots jammed with through-traffic and
  arriving cargo silently vanished.
- `serfbound/packages/engine/src/game-world.ts` — `WorldBuilding` gains
  `requestedResources` (the reference requested/available stock split).
- `serfbound/packages/app/src/main.ts` — live economy stats exposed from
  game state: `data-serfbound-stock-summary` publishes the castle stock's
  key lines (plank, stone, lumber, bread, steel) every sim frame.
- `serfbound/tests/ci/engine-economy-chains.test.mjs` — the gate scenario:
  one settlement, twelve buildings (lumberjack, forester, sawmill,
  stonecutter, farm, mill, baker, pig farm, butcher, coal mine, steel
  smelter, toolmaker) on five road chains off the castle flag (which has
  exactly five free edges), every chain hanging off hub flags with
  multi-hop routing. All twelve complete through serf labor, then the
  economy must prove itself alive with no manual feeding except iron ore
  (no iron mine stands): net plank gain after construction, baker bread
  reaching the miners over the roads, and finished tools landing in stock.
- `serfbound/tests/browser/decoded-scene.spec.ts` — live-stats assertions:
  the stock summary attribute is well-formed before construction and has
  changed by completion (logistics drew planks from the stock).

## Verification artifacts

```text
node --test tests/ci/engine-economy-chains.test.mjs -> # tests 6 / pass 6
npm run test:unit -> # tests 109 / pass 109 / fail 0
npm run test:browser -> 6 passed (1.9m)
SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 SERFBOUND_SPAU_PA=... npm run test:local:assets
  -> serfbound-local-asset-tests-ok: parsed SPAU.PA catalog, ... 200 serf
     animations, and player-color torsos; composed terrain into a 512x32
     atlas and a decoded scene with 2386 sprites.
SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 ... npm run capture:local:screenshots
  -> serfbound-local-screenshots-ok: 5194 decoded sprites on screen; saved
     artifacts/sb-14-05-import-preview-desktop.png,
     artifacts/sb-14-05-import-preview-canvas.png,
     artifacts/sb-14-05-running-game-desktop.png
```

Performance: the full twelve-building settlement simulates 4,000,000 ticks
(250,000 engine updates) in 1.6 s wall (`/usr/bin/time -p` → real 1.60), or
~2.5M ticks/s. The browser drives 8 sim ticks per 175 ms frame, so engine
cost per frame is microseconds — far inside the Phase 8 baselines.

Long-run soak (instrumented replica, 4M ticks): bread in stock grows
unbounded (529 loaves), the mine eats only routed bread (never seeded),
the 30-unit coal deposit fully depletes, and tools rise 46 → 76 until coal
runs out — production, routing, consumption, and depletion all live at once
with zero stuck flags.

## Deviations from plan

- Stats exposure is the stock-summary data attribute (resource counts,
  live); production *history* graphs are recorded for Phase 16's stats
  popups, which render from the same source.
- The gate scenario hand-feeds iron ore only, because the settlement has no
  iron mine; everything else routes itself.

## Follow-ups

- Phase 15 takes the carry-forwards recorded in the phase final summary
  (serf state serialization, reference FlagSearch with priorities,
  tool-gated professions).
