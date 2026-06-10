# Evidence — SB-18-03 — Classic AI Economy and Military Behaviors

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/engine/src/ai.ts` — the AI grows past the opening:
  - The expansion plan (pig farm, butcher, steel smelter, weaponsmith,
    toolmaker, the mines, gold smelter) follows the establishment plan;
    siteless types (mines without mountains) are skipped instead of
    blocking the rest, and garrison huts scale with the settlement
    (1 + buildings/8).
  - Threat levels on the AI's military buildings follow enemy proximity
    in distance bands (reference `CalculateThreatLevel`, condensed),
    feeding the engine's occupation tables so frontier garrisons fill
    deeper.
  - The attack behavior: with a knight surplus in stock the AI marches on
    the closest enemy military post or castle through the engine's
    `launchAttack`, keeps a war pacing cooldown, and logs every assault
    in the decision fixture stream.
- `serfbound/tests/ci/engine-ai-behaviors.test.mjs` — seeded behavior
  fixtures: the established AI reaches the meat/steel expansion without
  mines blocking it; AI garrisons carry computed threat levels near the
  human; a knight-rich AI launches an attack on the nearest enemy post
  (decision logged, attacking knights on the map).

## Verification artifacts

```text
node --test tests/ci/engine-ai-behaviors.test.mjs -> # tests 3 / pass 3
npm run test:unit -> # tests 166 / pass 166 / fail 0
```

## Deviations from plan

- The AI consumes the same engine flows the human does (world actions,
  logistics, launchAttack), so behavior beyond ordering (combat outcomes,
  production) is already fixture-pinned by the engine suites; the AI
  fixtures pin the decision ORDER and determinism, as recorded in
  SB-18-02's fixture boundary.
- Knight-count attack selection uses the stock surplus rather than the
  reference's per-distance `KnightsAvailableForAttack` rings; recorded —
  the rings come with the war UI when attacks become player-visible.

## Follow-ups

- SB-18-04: original DOS savegame loading.
