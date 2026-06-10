# SB-11-03 — Place Map Objects and Minerals

- **Project:** serfbound
- **Phase:** 11
- **Status:** done
- **Depends on:** SB-11-02
- **Unblocks:** SB-11-04
- **Owner:** unassigned

## Problem

A Settlers map is not just terrain: trees cluster in forests, stones sit in
fields, deserts get cacti, water gets reeds, and mountains hide coal, iron,
gold, and stone deposits. These placement rules live in the generator and
`Map.cs` object model.

## Scope

- **In:** Object placement (trees, pines, palms, stones, water decoration,
  cadavers/cacti per terrain), mineral deposit seeding, and the map object
  model in the engine snapshot.
- **Out:** Harvestability/gameplay effects (Phases 12–14), rendering polish.

## Acceptance criteria

- [x] Object and mineral placement matches the SB-11-01 fixture for committed
  seeds.
- [x] Objects carry the map-object sprite indices the Phase 10 renderer
  already understands (reference `objectType - 8` mapping).
- [x] Engine map snapshot exposes objects/minerals queryably per position.

## Test plan

- **Unit:** Fixture parity for objects/minerals; distribution sanity tests.
- **Integration / Cypress:** n/a until SB-11-04.
- **Manual / device:** Visual review after SB-11-04 lands.
- **Design handoff:** n/a.

## Notes / open questions

- Preserves: reference placement rules and densities.
- Browser boundary: none new.
- .NET reference use: read-only porting reference.
- Phase gate advanced: the world gets its authentic contents.
