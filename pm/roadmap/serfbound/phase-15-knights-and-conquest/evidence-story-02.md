# Evidence — SB-15-02 — Military Occupation and Border Growth

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/engine/src/game-world.ts` — the reference occupant
  tables (`HutOccupantsFromLevel` 1/1/2/2/3, tower 1/2/3/4/6, fortress
  1/3/6/9/12) behind `militaryKnightsNeeded` (player `KnightOccupation`
  settings, reference defaults `0x10/0x21/0x32/0x43`, high nibble = max
  occupied level); `militaryGoldCap` (hut 2, tower 4, fortress 8);
  `WorldBuilding` gains `knights`, `requestedKnights`, `threatLevel`;
  `updateLandOwnership` now requires occupation (`knights > 0`) before a
  military building projects influence — the reference `IsActive` gate
  this phase was scaffolded to add.
- `serfbound/packages/engine/src/serfs.ts` — `spawnKnightSerf` draws from
  the inventory's recruited knight stock; `#sweepMilitary` runs
  `Building.UpdateMilitary`: every completed, road-connected military
  building requests knights up to its occupation level; knights walk the
  roads to their post, and the first arrival activates the building and
  recomputes land ownership (borders grow). Gold-bar demand routing sends
  bars only to occupied posts, capped at the reference per-type stock.
- `serfbound/tests/ci/engine-military-occupation.test.mjs` — five proofs:
  the occupancy/gold tables as fixtures; a hut garrisons one knight at
  threat 0 and territory grows past the castle radius (an unowned frontier
  tile becomes owned, land area and border segments change); an
  unoccupied hut projects no territory; a threat-3 tower fills to six
  knights; gold bars route from the gold smelter to the occupied hut
  within the cap and count toward the morale depot.

## Verification artifacts

```text
node --test tests/ci/engine-military-occupation.test.mjs -> # tests 5 / pass 5
npm run test:unit -> # tests 118 / pass 118 / fail 0
npm run test:browser -> 6 passed (1.9m)
SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 ... npm run capture:local:screenshots
  -> serfbound-local-screenshots-ok: 5194 decoded sprites on screen; saved
     artifacts/sb-15-02-import-preview-desktop.png,
     artifacts/sb-15-02-import-preview-canvas.png,
     artifacts/sb-15-02-running-game-desktop.png
```

Border re-rendering: the landscape scene reads `world.borderSegments()`
every frame, so the occupation-driven ownership change re-renders without
new code; the CI fixture asserts the segment set changes on occupation.

## Deviations from plan

- Garrisoned knights are tracked as a per-building count plus serf records
  parked in the building (the reference keeps a linked knight list with
  ranks); rank-ordered defender selection lands with SB-15-03 combat.
- Threat-level recomputation from enemy proximity (reference
  `CalculateThreatLevel`) is deferred to SB-15-03/04 when a second player
  exists; buildings default to interior threat 0 and tests set levels
  explicitly.
- Knight kick-out when occupancy settings drop (the reference leaving
  flow) is recorded for the Phase 16 settings UI, which is what changes
  occupancy at runtime.

## Follow-ups

- SB-15-03: combat — attacking knights, the fight state machine, and
  parity fixtures for outcome sequences.
