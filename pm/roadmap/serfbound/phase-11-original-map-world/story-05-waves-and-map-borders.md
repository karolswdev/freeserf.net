# SB-11-05 — Render Waves and Map Borders

- **Project:** serfbound
- **Phase:** 11
- **Status:** done
- **Depends on:** SB-11-04
- **Unblocks:** SB-12-01
- **Owner:** unassigned

## Problem

Original water is alive — animated wave sprites masked to water triangles —
and the world edge reads as a deliberate border, not a render cutoff. Both
were explicitly deferred in Phase 10 and complete the authentic world look.

## Scope

- **In:** Decode `map_waves` sprites; wave placement/animation per the
  reference (`UpdateWaves` cadence, full/up/down wave masks); `map_border`
  sprite rendering at world edges; first animated layer in the decoded
  renderer (requestAnimationFrame tick).
- **Out:** Serf animation (Phase 13), audio (Phase 17).

## Acceptance criteria

- [x] Water triangles show animated waves with correct masking against shores.
- [x] Map borders render with authentic border sprites.
- [x] Animation pauses when the tab is hidden and respects reduced-motion.
- [x] Real-data screenshots (and a short capture) recorded as evidence.

## Test plan

- **Unit:** Wave sprite/mask selection tests.
- **Integration / Cypress:** Browser test asserts animation tick state.
- **Manual / device:** Visual review of wave motion with real data.
- **Design handoff:** Screenshots under phase artifacts.

## Notes / open questions

- Preserves: reference wave sprite cycling (`(pos ^ 5) + (tick >> 3)) & 0xf`).
- Browser boundary: first persistent animation loop in the product.
- .NET reference use: `RenderMap.cs` wave path read as reference.
- Phase gate advanced: closes the authentic-world phase.
