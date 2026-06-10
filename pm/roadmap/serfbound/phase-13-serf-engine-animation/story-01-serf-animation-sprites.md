# SB-13-01 — Decode Serf Animation and Player-Color Sprites

- **Project:** serfbound
- **Phase:** 13
- **Status:** done
- **Depends on:** SB-12-05
- **Unblocks:** SB-13-02
- **Owner:** unassigned

## Problem

Serf rendering needs two deferred decode paths: the binary animation table
(archive entry 2: per-animation frame/offset rows) and player-colored serf
sprites — the reference composes torso sprites twice with color offsets 64/72
and separates them (`SeparateSprites`) to build a recolorable mask, then
sticks arms from `DATA_SERF_ARMS`.

## Scope

- **In:** Animation table parsing in `@serfbound/assets`; torso/head/arms
  compositing with player-color palettes; atlas integration for serf frames;
  CI tests on synthetic fixtures plus opt-in real-data checks.
- **Out:** State machine (SB-13-02), rendering loop integration (SB-13-03+).

## Acceptance criteria

- [x] Animation table parses with the reference size check and exposes
  per-animation frame sequences.
- [x] Serf sprites composite with at least two distinct player colors from
  real data (opt-in check) and from synthetic fixtures in CI.
- [x] Head/torso/arm combination matches reference offsets.

## Test plan

- **Unit:** Table parsing + compositing pixel tests on fixtures.
- **Integration / Cypress:** n/a yet.
- **Manual / device:** Opt-in real-data decode of sample serf frames.
- **Design handoff:** Decoded frame strip image as evidence.

## Notes / open questions

- Preserves: `DataSourceDos.GetSpriteParts` serf torso special case.
- Browser boundary: none new.
- .NET reference use: read-only porting reference.
- Phase gate advanced: serfs become drawable.
