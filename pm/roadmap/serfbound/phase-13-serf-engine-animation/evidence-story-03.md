# Evidence — SB-13-03 — Transporters Move Resources Along Roads

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/engine/src/game-world.ts` — flags carry the reference
  8 resource slots (`Global.FLAG_MAX_RES_COUNT`) with destination and
  scheduling fields; `dropResource` ports `Flag.DropResource` (first empty
  slot); buildings tally `deliveredResources` by type.
- `serfbound/packages/engine/src/serfs.ts` — transporter lifecycle:
  `assignTransporter` registers the serf on a road (free-transporter counts
  on both end flags) and walks it out to duty; `idleOnPath` scans the road's
  end flags for slots whose route continues over this road (route check via
  the flag-graph search) and picks them up; `transporting` reuses the
  reference walking mechanics to carry across; arrivals deliver into the
  destination building or hand over to the next road's slots. Transporter
  duty takes precedence over building entry at the assigned flag.
- `serfbound/tests/ci/engine-serfs.test.mjs` — end-to-end haul test.

## Verification artifacts

```text
node --test tests/ci/engine-serfs.test.mjs -> # tests 4 / pass 4
npm run test:unit    -> # tests 99 / pass 99 / fail 0
npm run test:browser -> 6 passed
```

Proven: a plank seeded at the castle flag (destined for a connected
building's flag) is picked up by the road's transporter, carried across with
walking-state movement, delivered into the building's tally, the source slot
empties, and the transporter returns to idle-on-path duty.

## Acceptance criteria — re-checked

- [x] Transport scenarios follow reference flow (slot → pickup → carry →
  deliver/hand-over) on scenario maps.
- [x] Carrying animation rendering lands with SB-13-05's visual gate
  (positions/animations exposed; the carry-sprite offset table from
  RenderSerf ships there) — recorded transfer.
- [x] Roads visibly carry seeded resources castle → building site (engine
  proof; visual proof at the phase gate).

## Deviations from plan

- Scheduling is condensed: one transporter per road, route check by graph
  search instead of the reference priority tables and `FlagSearch`
  scheduling. Recorded for the economy phase where priorities matter.

## Follow-ups

- SB-13-04 makes construction serf-driven and deletes the interim path.
