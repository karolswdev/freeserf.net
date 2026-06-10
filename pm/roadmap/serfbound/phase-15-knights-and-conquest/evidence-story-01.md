# Evidence — SB-15-01 — Arm and Recruit Knights

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/engine/src/serfs.ts` — the weaponsmith works the
  forge per `Serf.HandleSerfMakingWeaponState`: one coal + one steel make a
  sword, then a shield "for free" (the reference `FreeShieldPossible` flip,
  carried on the smith's work phase since one smith works one forge); coal
  demand routing extended to the weaponsmith; `#sweepMilitary` recruits the
  castle's wanted knight stock each pass and refreshes knight morale on a
  ~1024-tick stats cadence.
- `serfbound/packages/engine/src/inventory.ts` — `knights` stock on the
  inventory and `inventoryPromoteSerfToKnight`
  (`Inventory.PromoteSerfToKnight`: a generic serf + sword + shield become
  a knight; weapons and the serf are consumed).
- `serfbound/packages/engine/src/game-world.ts` — `WorldPlayer` gains
  `knightMorale`, `goldDeposited`, `castleKnightsWanted` (reference default
  3); `updateKnightMorale` ports `Player.UpdateKnightMorale` exactly
  (depot from inventory + military-building gold, the
  `while (totalGold > 0xffff)` pairwise shift, `min(depot, totalGold - 1)`
  clamp, `1024 + MapGoldMoraleFactor * depot / totalGold`, and the
  no-gold 4096 case); `mapGoldMoraleFactor` is the reference
  `10 * 1024 * playerCount`; `goldTotal` condenses `Game.GoldTotal` to
  unmined map gold plus gold ore/bars already in the economy.
- `serfbound/packages/app/src/main.ts` — live military stats:
  `data-serfbound-military-summary` publishes sword/shield/knight counts
  and knight morale alongside the stock summary.
- `serfbound/tests/ci/engine-military-supply.test.mjs` — four proofs:
  forging parity (two pairs → exactly two swords + two free shields, coal
  and steel fully consumed), promotion gating (weapons run out → third serf
  stays a serf), castle recruitment to the wanted stock of 3, and the
  morale formula against hand-computed reference fixtures including the
  large-total shift loop (morale 4437 at depot 65536 / total 196608).
- `serfbound/tests/browser/decoded-scene.spec.ts` — the founding e2e
  asserts the military summary is live with a nonzero knight stock (the
  castle recruits from its preset weapons).

## Verification artifacts

```text
node --test tests/ci/engine-military-supply.test.mjs -> # tests 4 / pass 4
npm run test:unit -> # tests 113 / pass 113 / fail 0
npm run test:browser -> 6 passed (1.9m)
SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 ... npm run capture:local:screenshots
  -> serfbound-local-screenshots-ok: 5194 decoded sprites on screen; saved
     artifacts/sb-15-01-import-preview-desktop.png,
     artifacts/sb-15-01-import-preview-canvas.png,
     artifacts/sb-15-01-running-game-desktop.png
```

## Deviations from plan

- `FreeShieldPossible` lives on the smith's work phase instead of the
  building record — behavior-identical because exactly one smith works a
  forge; recorded in the code comment.
- `Game.GoldTotal` is recomputed (map deposit + in-economy gold) instead of
  incrementally maintained; same invariant, no bookkeeping.
- `CastleScore` morale adjustment is omitted while castle score is always
  0 (no capture mechanics yet); SB-15-04 revisits it with defeat flows.

## Follow-ups

- SB-15-02: military occupation, knights walk out to garrison huts, border
  growth from occupied buildings, and gold delivery to military buildings
  (which then feeds `militaryGold` in the morale depot).
