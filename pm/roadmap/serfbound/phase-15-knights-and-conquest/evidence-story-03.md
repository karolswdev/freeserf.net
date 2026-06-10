# Evidence — SB-15-03 — Port Combat Resolution with Parity Fixtures

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/engine/src/serfs.ts` — the combat port:
  - The three `Serf.cs` fight tables copied flat exactly
    (`KnightAttackMoves` with its 15-entry later rows — the reference
    quirk where `RandomInt() & 0x70` sequence starts land mid-row is
    preserved — plus `KnightFightAnim` and `KnightFightAnimMax`).
  - `#setFightOutcome` is the exact `SetFightOutcome` math: rank-doubling
    experience factor, the 0x1000 own-land factor vs the player's
    gold-driven knight morale on foreign land,
    `morale = (0x400 * exp * land) >> 16`, winner =
    `((morale + defenderMorale) * RandomInt()) >> 16 < morale`, then
    `Move = RandomInt() & 0x70` — same RandomInt order as the reference.
  - `#handleKnightAttacking` drives both serfs through the move sequence
    (`4 - move` mirror for a losing attacker, fight animations
    `146 + (anim >> 4 & 0xf)` / `156 + (anim & 0xf)`, counter
    `72 + (RandomInt() & 0x18)`); a negative move resolves: the loser
    dies (death animations `152 + rank` / `147 + rank`, counter 255), a
    winning defender re-enters its building, a winning attacker waits out
    the body and re-engages — the defender-replacement loop.
  - `launchAttack` marches castle knights on an enemy post;
    `#handleKnightMarching` is the condensed off-road walk (greedy descent
    on the reference hex distance, buildings block).
  - The engine carries a seeded `FreeserfRandom`; serf states
    `knightMarching/knightAttacking/knightDefending/knightAttackingVictory/dead`.
- `serfbound/packages/engine/src/local-game.ts` — the engine's combat RNG
  seeds from the game seed string, so identical games fight identical
  fights.
- `serfbound/tests/ci/engine-combat-resolution.test.mjs` — parity proofs:
  five seeds resolved on a two-player battlefield, each predicted by an
  independent reimplementation of the reference math reading the same RNG
  state (both outcomes covered across seeds; engine result must match the
  prediction exactly); fight animations sampled mid-fight inside the
  reference knight ranges (attacker 146–161, defender 156–171); a
  four-on-two assault runs the defender-replacement loop to a consistent
  conservation outcome with no serf stuck mid-fight; knight losses update
  occupancy per the predicted winner.

## Verification artifacts

```text
node --test tests/ci/engine-combat-resolution.test.mjs -> # tests 4 / pass 4
npm run test:unit -> # tests 122 / pass 122 / fail 0
npm run test:browser -> 6 passed (1.9m)
SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 ... npm run capture:local:screenshots
  -> serfbound-local-screenshots-ok: 5194 decoded sprites; saved
     artifacts/sb-15-03-import-preview-desktop.png,
     artifacts/sb-15-03-import-preview-canvas.png,
     artifacts/sb-15-03-running-game-desktop.png
```

## Deviations from plan

- Attack initiation pulls knights from the castle stock and marches them
  directly (the reference `KnightsAvailableForAttack` distance-ringed
  selection from military buildings lands with the Phase 16 war UI that
  exposes those choices).
- Off-road marching is a greedy hex-distance descent rather than the full
  `FreeWalking` state pair; on contested open ground the path is the same.
- Defenders fight at the building position with the attacker at the flag
  (the reference's flag-adjacent shuffle is condensed); the animation
  values rendered are the reference ones.
- Fight rendering in the live browser requires a second player to attack;
  the e2e visual gate covers the single-player scene — fight-range
  animation values are fixture-asserted in CI instead.

## Follow-ups

- SB-15-04: capture (`OccupyEnemyBuilding`), territory loss/surrender,
  castle defeat and game over.
