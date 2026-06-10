# Phase 13 — Serf Engine and Animation

**Last updated:** 2026-06-10.
**Status:** complete.

## Goal

Bring the settlement to life: port the serf state machine core and authentic
serf animation so serfs walk out of the castle, level ground, build, and
carry resources along roads — replacing the Phase 12 interim time-stepped
construction.

## Scope

- **In:** Serf animation table decode (`DATA_SERF_ANIMATION_TABLE`), serf
  torso/head player-color compositing (the reference `SeparateSprites` path
  deferred since Phase 10), the core of `Freeserf.Core/Serf.cs` (9,659 lines —
  staged: movement/scheduling first, then transporters, then builders and
  diggers), and serf rendering on the decoded scene.
- **Out:** Profession serfs beyond transport/construction (Phase 14), knights
  (Phase 15), serf-related sounds (Phase 17).

## Non-negotiable constraints

- `Serf.cs` is the largest and most behavior-dense file in the reference; it
  is ported in verifiable stages with state-machine fixtures per stage, never
  as one heroic diff.
- Animation must use the decoded animation table, not hand-tuned frame lists.
- The Phase 12 interim construction path is deleted in this phase.

## Exit criteria (evidence required)

- [x] Serf sprites composite torso/head/arms with player colors from real
  data and animate via the decoded animation table. (SB-13-01)
- [x] The serf scheduler spawns, idles, and walks serfs with
  reference-matching pathing on fixture maps. (SB-13-02)
- [x] Transporters pick up and deliver resources along roads with correct
  carrying animations. (SB-13-03; carry-sprite rendering at the phase gate)
- [x] Diggers level sites and builders construct buildings, replacing the
  interim construction path. (SB-13-04)
- [x] Real-data capture shows an animated, working settlement. (SB-13-05)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-13-01 | Decode serf animation and player-color sprites | done | story-01-serf-animation-sprites.md | evidence-story-01.md |
| SB-13-02 | Port the serf state machine core | done | story-02-serf-state-machine-core.md | evidence-story-02.md |
| SB-13-03 | Transporters move resources along roads | done | story-03-transporters-on-roads.md | evidence-story-03.md |
| SB-13-04 | Builders and diggers construct buildings | done | story-04-builders-and-diggers.md | evidence-story-04.md |
| SB-13-05 | Animated settlement visual gate | done | story-05-animated-settlement-gate.md | evidence-story-05.md |

## Where we are

Phase 13 is complete. Serfs live: they spawn in the castle, walk roads on
the reference tick/counter/animation formulas, haul resources, and build
buildings — and they render through the authentic chain (animation table →
appearance tables → player-color composed torsos + heads), verified with
real local data and the full browser founding loop.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Serf.cs scope explodes the phase | high | Strict staging; only transport + construction states in scope | Stories spawning sub-stories repeatedly |
| Animation timing feels wrong vs original | medium | Drive frames from the decoded animation table and game ticks | Visible mismatch against reference recordings |
| Per-frame scene rebuilds too slow with many serfs | medium | Incremental sprite updates instead of full rebuilds; measure | Frame cadence below Phase 8 baseline |

## Decisions made (this phase)

- none yet.

## Decisions deferred

- Serf-vs-serf fighting states belong to Phase 15.
