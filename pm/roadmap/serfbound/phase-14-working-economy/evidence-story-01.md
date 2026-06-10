# Evidence — SB-14-01 — Port Inventories and Resource Distribution

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/engine/src/inventory.ts` — new: the 26 reference
  resource types, the `Inventory.SuppliesTemplates` rows, and
  `suppliesPresetResources` with the verbatim fixed-point interpolation
  (including the 0x8000 rounding increment); inventory take/store and serf
  stocking.
- `serfbound/packages/engine/src/game-world.ts` — `BuildCastle` allocates the
  player's first inventory with the supplies preset (level 20, the default
  custom-game setting).
- `serfbound/packages/engine/src/serfs.ts` — serf spawns consume stocked
  generic serfs; construction logistics draw planks/stones from the castle
  stock instead of conjuring them.
- `serfbound/tests/ci/engine-inventory.test.mjs` — preset boundary rows +
  interpolation math, depletion/refusal behavior, and logistics consumption.

## Verification artifacts

```text
node --test tests/ci/engine-inventory.test.mjs -> # tests 3 / pass 3
npm run test:unit    -> # tests 103 / pass 103 / fail 0
npm run test:browser -> 6 passed (1.9m)
```

Proven: preset rows at supplies 0/10/40 match the reference templates
exactly; mid-range interpolation matches the reference fixed-point math
(including the rounding the first hand-derived expectation missed — caught
by the test run); a castle at supplies 20 stocks 40 planks/20 stones/25
serfs; lumberjack logistics remove exactly 2 planks from stock; empty
stocks refuse serfs and resources.

## Acceptance criteria — re-checked

See story file — all checked with the recorded scope transfer for priority
sliders.

## Deviations from plan

- Serf stocking is condensed (base crew + supplies level) until game-setup
  options arrive (Phase 18 start screen).

## Follow-ups

- SB-14-02: the wood/stone chains produce into this inventory.
