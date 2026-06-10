# Evidence — SB-15-04 — Capture, Defeat, and Game Over

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/engine/src/game-world.ts` — the conquest port:
  - `captureBuilding` is `Game.OccupyEnemyBuilding`, condensed: a captured
    castle is demolished outright; a military building transfers with its
    flag, the conquering knight occupies it before the ownership recompute
    (reference `KnightOccupy`, so the post projects influence), the
    immediate ring changes owner, civilian buildings in the reference
    second ring (spiral 7..18) are demolished, stolen flag resources lose
    their destinations, and the captured flag's roads are cut.
  - `demolishBuildingAt` (`Game.DemolishBuilding`, condensed — the flag
    survives); castle demolition flips the owner to
    `defeated`, clears `hasCastle`/`castlePosition`, and removes the
    castle inventory.
  - `demolishRoad` clears a road's path bits end to end and disconnects
    both flag records.
- `serfbound/packages/engine/src/serfs.ts` — `#engageBuilding` resolves an
  empty garrison as conquest: the marching knight captures the post and
  garrisons it (or stands down at a fallen castle).
- `serfbound/packages/app/src/main.ts` — game-over exposure:
  `data-serfbound-game-over` plus the "Game over / Your castle has
  fallen." command state when player 0's castle falls.
- `serfbound/tests/ci/engine-conquest.test.mjs` — four proofs on a
  two-player battlefield: capture transfers building/flag/ground ownership
  and cuts the captured flag's roads, with the post's own influence
  holding the recompute; capture demolishes a civilian building in the
  reference ring; the castle falls (demolished, player defeated, inventory
  gone, territory collapses); a garrisoned castle cannot fall to a lone
  knight.
- `serfbound/tests/ci/engine-combat-resolution.test.mjs` — end-state
  assertions updated for capture: a won assault now takes the post.

## Verification artifacts

```text
node --test tests/ci/engine-conquest.test.mjs -> # tests 4 / pass 4
npm run test:unit -> # tests 126 / pass 126 / fail 0
npm run test:browser -> 6 passed (1.9m)
SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 ... npm run capture:local:screenshots
  -> serfbound-local-screenshots-ok: 5194 decoded sprites; saved
     artifacts/sb-15-04-import-preview-desktop.png,
     artifacts/sb-15-04-import-preview-canvas.png,
     artifacts/sb-15-04-running-game-desktop.png
```

A reference-faithful subtlety the fixtures caught: recomputing land
ownership while the captured post is momentarily unoccupied let the old
owner's castle win the ground back — the fix occupies the post with the
conquering knight before the recompute, exactly the reference order.

## Deviations from plan

- The browser shell is single-player until Phase 18's AI opponents, so a
  live conquest cannot be driven from the UI yet; the full conquest loop
  (assault → defender replacement → capture → territory transfer → castle
  fall → game over) runs in the CI battlefield fixtures, and the visual
  gate captures the standing real-data scene. Phase 18 makes conquest
  player-visible and re-captures it.
- `PlayerDefeated` consequences beyond the defeat flag (serf cleanup,
  score) land with Phase 18's missions; the reference method body is
  itself a TODO.

## Follow-ups

- Phase 16: the war UI (attack popups, occupancy settings) on top of
  `launchAttack` and the occupation settings this phase shipped.
