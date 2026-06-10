# SB-11-02 — Port the Classic Map Generator

- **Project:** serfbound
- **Phase:** 11
- **Status:** done
- **Depends on:** SB-11-01
- **Unblocks:** SB-11-03
- **Owner:** unassigned

## Problem

The decoded scene still draws a synthetic height field. The original
experience requires the classic generator: seeded height waves, smoothing,
water bodies, and terrain typing from `Freeserf.Core/MapGenerator.cs`
(~1,300 lines) on top of the already-ported `MapGeometry`.

## Scope

- **In:** TypeScript port of `ClassicMapGenerator` height generation,
  smoothing passes, sea-level handling, and terrain typing in
  `@serfbound/engine`, driven by the ported `FreeserfRandom`.
- **Out:** Object/mineral placement (SB-11-03), rendering (SB-11-04).

## Acceptance criteria

- [x] Generated heights and terrain types match the SB-11-01 fixture exactly
  for the committed seed(s).
- [x] Generation is deterministic across runs and platforms (typed arrays,
  integer math only).
- [x] Engine exposes a map snapshot the renderer can consume without DOM or
  archive dependencies.

## Test plan

- **Unit:** Fixture parity tests in CI (per-stage: heights, then types).
- **Integration / Cypress:** n/a until SB-11-04.
- **Manual / device:** Generate larger local maps and inspect summaries.
- **Design handoff:** n/a.

## Notes / open questions

- Preserves: classic generator semantics including RNG call order.
- Browser boundary: none new.
- .NET reference use: read-only porting reference.
- Phase gate advanced: authentic world layout becomes computable in browser.
