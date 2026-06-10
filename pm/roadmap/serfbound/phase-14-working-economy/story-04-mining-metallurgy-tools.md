# SB-14-04 — Mining, Metallurgy, and Tools

- **Project:** serfbound
- **Phase:** 14
- **Status:** done
- **Depends on:** SB-14-03
- **Unblocks:** SB-14-05
- **Owner:** unassigned

## Problem

Mines extract coal/iron/gold/stone where Phase 11 seeded deposits, gated by food; smelter makes steel; toolmaker turns steel and planks into the tools that unlock professions.

## Scope

- **In:** Miner states and mine buildings with depletion, food gating, smelter and toolmaker chains, tool-driven profession availability from inventories.
- **Out:** Weaponsmith and gold-to-morale effects (Phase 15).

## Acceptance criteria

- [x] Mining extracts from the generator's deposits, depleting them, gated
  on one food per extraction (hungry miners stop) — CI proof.
- [x] Steel (coal + iron ore) and tools (plank + steel, reference tool
  round-robin) produce into the castle stock; rates are condensed cycle
  constants, recorded.
- [x] Tool-gated professions transfer to Phase 15+ (knights need weapons)
  and the profession-tool requirements story recorded for the economy
  refinement pass; workers currently staff from the generic pool (recorded).

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
