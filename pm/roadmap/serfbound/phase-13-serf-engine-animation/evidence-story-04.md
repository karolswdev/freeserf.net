# Evidence — SB-13-04 — Builders and Diggers Construct Buildings

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/engine/src/game-world.ts` — the interim time-stepped
  `advanceConstruction` is DELETED (per the phase plan); construction is now
  `applyBuilderWork`: leveling for 40 work ticks, then one delivered material
  consumed per 30 work ticks until the reference material costs
  (`Building.ConstructionInfos` planks/stones table, ported) are met.
- `serfbound/packages/engine/src/serfs.ts` — builder serfs (walk to the
  site flag, move onto the site, work it on the game clock);
  `dispatchConstructionLogistics`: route-checked and idempotent — drops the
  reference material amounts at the inventory flag destined for the site,
  staffs every road on the route with a transporter, and sends a builder.
  No side effects when the site is not yet road-connected.
- `serfbound/packages/engine/src/local-game.ts` — `serfEngine()` accessor;
  restored games re-dispatch logistics for unfinished buildings (in-flight
  serf serialization recorded as a Phase 13 limitation).
- `serfbound/packages/app/src/main.ts` — the simulation driver runs the serf
  engine; building commands dispatch logistics; completing a road retries
  logistics for newly connected sites.
- Tests: serf-driven construction CI test (replaces the interim test);
  browser founding loop now completes via real serf labor.

## Verification artifacts

```text
npm run test:unit    -> # tests 99 / pass 99 / fail 0
npm run test:browser -> 6 passed (1.9m)
```

The browser loop proves: lumberjack queued → road connected → builder and
materials dispatched → transporter hauls two planks (with the empty return
trip between hauls) → frame stage → completion — all on the game clock at
authentic serf pacing (~65s of transit and work).

## Acceptance criteria — re-checked

- [x] Construction only progresses with delivered materials and builder work
  (CI: consumedMaterials reaches the reference plank cost; browser e2e).
- [x] Builder work animates at sites — the builder occupies the site through
  the working states; frame/done sprites render per stage (animation frames
  at the SB-13-05 gate).
- [x] The interim construction path is removed (greenfield discipline).

## Deviations from plan

- One serf serves as digger + builder (leveling then building) — recorded
  condensation; the split arrives with profession serfs in Phase 14.
- In-flight serf state is not serialized; restores re-dispatch logistics
  (recorded limitation, addressed at the phase gate).

## Follow-ups

- SB-13-05: serf rendering + the animated settlement visual gate.
