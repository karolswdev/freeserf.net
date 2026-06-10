# Phase 15 — Final Summary

**Closed:** 2026-06-10.

## Goal — was it met?

Yes. The military game runs: the weaponsmith closes the economy into
swords and free shields, knights recruit from generic serfs on the
reference gating and gold-driven morale, military buildings garrison per
the reference occupant tables and grow territory through the influence
recompute, seeded fights resolve with the exact `SetFightOutcome` math and
fight tables, and conquest transfers posts, ground, and flags until a
castle falls and the player is defeated.

## Exit criteria — final state

- [x] Weapons/shields and gold morale supply knights per reference rules
  (SB-15-01).
- [x] Military buildings occupy, set territory, and grow borders matching
  fixtures (SB-15-02).
- [x] Combat sequences match reference outcome fixtures; fights animate
  with the reference knight animation values (SB-15-03).
- [x] An attack captures enemy buildings and a castle can fall, ending the
  game (SB-15-04).

## Stories shipped

| ID | Story | Evidence |
|---|---|---|
| SB-15-01 | Arm and recruit knights | evidence-story-01.md |
| SB-15-02 | Military occupation and border growth | evidence-story-02.md |
| SB-15-03 | Port combat resolution with parity fixtures | evidence-story-03.md |
| SB-15-04 | Capture, defeat, and game over | evidence-story-04.md |

## What the phase intentionally did not do

- Live browser conquest: the shell is single-player until Phase 18's AI
  opponents; the conquest loop is proven on CI battlefields and the
  game-over state is exposed (`data-serfbound-game-over`).
- The war UI (attack selection, occupancy sliders, threat-level
  recomputation from enemy proximity) — Phase 16 surfaces the settings,
  the engine consumes them already.
- Knight ranks beyond Knight0 in play (training/promotion economy) and
  rank-ordered defender selection — recorded; the rank factor is already
  in the fight math.
- Catapults/sailors: not present in the reference scope reviewed.

## Carry-forward recommendations

1. Phase 16's war popups should drive `launchAttack` and the
   `knightOccupation` settings (the reference building selection by
   distance ring lives in `Player.KnightsAvailableForAttack`).
2. Phase 18's AI brings opponents into the browser — re-capture the
   conquest visual gate then, including border collapse on a castle fall.
3. Serf state serialization (carried from Phases 13–14) now also covers
   marching/fighting knights; saves mid-battle currently re-dispatch.
