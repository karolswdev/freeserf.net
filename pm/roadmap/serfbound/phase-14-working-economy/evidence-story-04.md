# Evidence — SB-14-04 — Mining, Metallurgy, and Tools

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/engine/src/serfs.ts` — the four mines (extract the
  matching deposit mineral within the mine's spiral, deposit amounts
  deplete, one delivered food consumed per extraction, hungry miners idle),
  steel and gold smelters as two-input converters (coal + ore), the
  toolmaker (plank + steel → the reference tool list round-robin), and the
  demand-routing table extended (food → mines, coal/ores → smelters,
  steel → toolmaker/weaponsmith).
- `serfbound/tests/ci/engine-economy-chains.test.mjs` — the refining proof.

## Verification artifacts

```text
node --test tests/ci/engine-economy-chains.test.mjs -> # tests 5 / pass 5
npm run test:unit -> # tests 108 / pass 108 / fail 0
```

Proven: a coal mine on tundra over a seeded deposit completes through serf
labor, extracts coal only while fed (the deposit visibly depletes), coal
routes to the steel smelter, steel to the toolmaker, and finished tools land
in the castle stock.

## Deviations from plan

- Profession staffing still draws generic serfs (tool-gated professions
  recorded for the refinement pass with Phase 15's weapon needs).

## Follow-ups

- SB-14-05: every chain concurrently + live stats + the real-data gate.
