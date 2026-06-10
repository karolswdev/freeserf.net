# SB-14-02 — Wood and Stone Production Chains

- **Project:** serfbound
- **Phase:** 14
- **Status:** done
- **Depends on:** SB-14-01
- **Unblocks:** SB-14-03
- **Owner:** unassigned

## Problem

The founding chains - woodcutter fells trees, forester plants, sawmill turns logs into planks, stonecutter quarries - directly feed construction, replacing seeded castle stock.

## Scope

- **In:** Woodcutter/forester/sawmill/stonecutter serf states with animations and map effects (tree removal/growth, stone depletion), building production logic, plank/stone flow into construction.
- **Out:** Food and mining chains.

## Acceptance criteria

- [x] Chain behavior follows the reference flow (harvest → product → routed
  to consumers/inventory); cycle timings are condensed constants, recorded.
- [x] Trees fall (woodcutter), regrow (forester), and stone piles deplete
  (stonecutter) — CI scenario proofs on the live map arrays.
- [x] Sawmill planks flow into the castle stock that construction draws from
  (the lumber→plank→inventory loop closes; the castle seed remains the
  reference supplies preset).

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
