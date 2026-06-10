# Phase 14 — Final Summary

**Closed:** 2026-06-10.

## Goal — was it met?

Yes. A settlement sustains itself: inventories hold the reference supply
presets, every classic chain produces (wood, stone, food, meat, mining,
metallurgy, tools), products route to the buildings that demand them, and
the whole economy runs concurrently in one settlement without deadlock —
proven by the gate scenario and visible live in the browser.

## Exit criteria — final state

- [x] Inventories and distribution priorities match reference fixtures
  (SB-14-01).
- [x] Wood and stone chains run end-to-end and feed construction
  (SB-14-02).
- [x] Food chains run and feed mines per reference gating (SB-14-03/04).
- [x] Mining and metallurgy produce steel and tools that re-enter the
  economy (SB-14-04).
- [x] All chains concurrently with live stats data, real-data capture,
  and performance within baselines (SB-14-05).

## Stories shipped

| ID | Story | Evidence |
|---|---|---|
| SB-14-01 | Port inventories and resource distribution | evidence-story-01.md |
| SB-14-02 | Wood and stone production chains | evidence-story-02.md |
| SB-14-03 | Food production chains | evidence-story-03.md |
| SB-14-04 | Mining, metallurgy, and tools | evidence-story-04.md |
| SB-14-05 | Full-economy gate with live stats | evidence-story-05.md |

## What the gate proved

Twelve buildings on five road chains (the castle flag's five free edges,
hub flags beyond) complete through serf labor, then run concurrently:
trees fall and replant, stone quarries, fields grow into bread, pigs become
meat, the coal deposit depletes under food-gated mining, steel smelts, and
finished tools land in the castle stock — with only iron ore hand-fed
(no iron mine stands in the scenario). 4M ticks simulate in 1.6 s.

## What the phase intentionally did not do

- Player priority sliders / distribution settings UI (data is ported;
  sliders land with Phase 16's interface).
- Production history graphs (stock stats are live; graphs land with the
  Phase 16 stats popups).
- Weapons and knight recruitment (Phase 15 opens with them).
- Demolition/burning flows beyond the existing flag demolition (recorded;
  Phase 15-16 surface them in the UI).
- Tool-gated professions (workers still draw from the generic pool;
  recorded for Phase 15's recruitment work).

## Carry-forward recommendations

1. Phase 15 should give knights the weapon/recruitment chain on top of the
   demand routing this phase hardened.
2. The condensed BFS flag routing should become the reference FlagSearch
   with transport priorities when traffic grows (military supply lines).
3. Serf state serialization in saves (carried from Phase 13) remains open;
   conquest will make mid-journey serfs more common.
4. The economy gate scenario is a good regression harness — extend it with
   knights' food/gold consumption in Phase 15.
