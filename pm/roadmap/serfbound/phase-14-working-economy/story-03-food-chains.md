# SB-14-03 — Food Production Chains

- **Project:** serfbound
- **Phase:** 14
- **Status:** done
- **Depends on:** SB-14-02
- **Unblocks:** SB-14-04
- **Owner:** unassigned

## Problem

Mines run on food. Farmer fields, mill, bakery, fisher, pig farm, and butcher form the food web with crop growth stages on the map.

## Scope

- **In:** Farmer (sow/harvest with field growth stages), miller, baker, fisher, pig farmer, butcher serf states and production buildings; food resource types and routing.
- **Out:** Mine consumption gating (SB-14-04 wires it).

## Acceptance criteria

- [x] Food chains follow the reference flow (sow/harvest, grind, bake,
  feed/butcher, fish from generated fish stocks); cycle timings condensed and
  recorded.
- [x] Fields appear on the map as the reference Seeds/Field objects and are
  harvested away (growth-stage timing condensed; stage sprites render via the
  existing object pipeline).
- [x] Food routes to demanding consumers first, then to the castle stock
  (demand table: wheat → mill/pig farm, flour → baker, pig → butcher).

## Test plan

- **Unit:** Fixture parity for the story's chain/state logic in CI.
- **Integration / Cypress:** Browser scenario test on the fixture archive.
- **Manual / device:** Real-data capture via the standing visual gate.
- **Design handoff:** Screenshots under phase artifacts.

## Notes / open questions

- Preserves: reference behavior of the ported systems; intentional
  divergences must be recorded here at ship time.
- Browser boundary: none new expected.
- .NET reference use: read-only porting reference.
- Phase gate advanced: see phase exit criteria.
