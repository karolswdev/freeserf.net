# Evidence — SB-14-03 — Food Production Chains

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/engine/src/serfs.ts` — food professions on the worker
  framework: farmer (sows reference Seeds objects on open territory, harvests
  into wheat), mill/baker/butcher as converters, pig farm (two wheat per
  pig), fisher (draws from the generator's water fish stocks). Demand routing
  generalizes to a product→consumers table. Two systemic fixes surfaced by
  the chain tests: the reference waiting-swap in ChangeDirection (hub-flag
  deadlocks under traffic), and the inventory outbound queue (the castle
  flag's 8 slots overflowed silently with three construction orders;
  materials now queue per the reference MoveResourceOut scheduling).
- `serfbound/packages/engine/src/inventory.ts` — `pendingOut` queue.
- `serfbound/tests/ci/engine-economy-chains.test.mjs` — the bread chain
  proof: farm + mill + baker built by serfs, field sown, bread arriving in
  the castle stock.

## Verification artifacts

```text
node --test tests/ci/engine-economy-chains.test.mjs -> # tests 4 / pass 4
npm run test:unit    -> # tests 107 / pass 107 / fail 0
npm run test:browser -> 6 passed (1.9m)
```

## Deviations from plan

- Field growth stages are condensed to sow→harvest (stage timers recorded
  for refinement); fisher uses spiral proximity instead of free-walking
  fishing trips (recorded).

## Follow-ups

- SB-14-04: mining gated on this food.
