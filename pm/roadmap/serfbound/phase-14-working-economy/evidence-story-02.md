# Evidence — SB-14-02 — Wood and Stone Production Chains

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/engine/src/serfs.ts` — the profession framework:
  completed production buildings request workers from the castle stock;
  workers settle in and run work cycles. Woodcutter (fells the nearest tree
  within the classic spiral, leaves a stub, emits lumber), forester (plants
  trees on open owned grass), sawmill (consumes delivered lumber into
  planks), stonecutter (depletes stone piles into stone). Products route to
  demanding consumers first (lumber → sawmills under stock 4), otherwise to
  the inventory flag, where deliveries store into the castle stock. Idle
  transporters now leave the collision map (the reference idle-on-path
  passability) — this also fixed a flag deadlock the chain test exposed.
- `serfbound/packages/engine/src/map-generator-extra.ts` — object predicates.
- `serfbound/tests/ci/engine-economy-chains.test.mjs` — three chain proofs.

## Verification artifacts

```text
node --test tests/ci/engine-economy-chains.test.mjs -> # tests 3 / pass 3
npm run test:unit    -> # tests 106 / pass 106 / fail 0 (post-forester test)
npm run test:browser -> 6 passed (1.9m)
```

Proven end-to-end on live game worlds: lumberjack + sawmill complete through
serf labor, trees fall, lumber routes to the sawmill, planks arrive in the
castle stock; the stonecutter erases a stone pile into castle stone; the
forester plants new trees inside territory.

## Deviations from plan

- Work cycle durations are condensed constants (recorded); the reference's
  outdoor free-walking harvest trips and tree growth stages are condensed to
  in-spiral effects (recorded for refinement with the Phase 16 visuals).

## Follow-ups

- SB-14-03 food chains reuse this framework.
