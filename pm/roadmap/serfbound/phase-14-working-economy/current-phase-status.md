# Phase 14 — A Working Economy

**Last updated:** 2026-06-10.
**Status:** in progress.

## Goal

Every classic production chain runs: wood, stone, food, mining, metallurgy,
and tools — with inventories, distribution priorities, and the profession
serfs that work them, so a settlement sustains and grows on its own.

## Scope

- **In:** `Inventory.cs` port (castle/stock buildings, serf and resource
  stock), the profession serf states from `Serf.cs` (woodcutter, forester,
  sawmill worker, stonecutter, farmer, miller, baker, fisher, pig farmer,
  butcher, miners, smelters, toolmaker), production logic in
  `Building.cs`/`Game.cs`, resource distribution/priority settings from
  `Player.cs`, and demolition/burning flows.
- **Out:** Weapons/knight recruitment (Phase 15), stats UI polish (Phase 16 —
  this phase exposes the data), audio (Phase 17).

## Non-negotiable constraints

- Chain behavior is fixture-checked (production rates, consumption gating),
  not tuned by feel.
- Each chain story ends with the chain visibly working in the browser.

## Exit criteria (evidence required)

- [x] Inventories and distribution priorities match reference fixtures.
  (SB-14-01; priority sliders transfer to chain/UI stories — recorded)
- [x] Wood and stone chains run end-to-end and feed construction. (SB-14-02)
- [ ] Food chains run and feed mines per reference gating. (SB-14-03)
- [ ] Mining and metallurgy produce steel and tools that re-enter the
  economy. (SB-14-04)
- [ ] A settlement runs all chains concurrently with live stats data and
  real-data capture evidence. (SB-14-05)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-14-01 | Port inventories and resource distribution | done | story-01-inventories-distribution.md | evidence-story-01.md |
| SB-14-02 | Wood and stone production chains | done | story-02-wood-stone-chains.md | evidence-story-02.md |
| SB-14-03 | Food production chains | in-progress | story-03-food-chains.md | — |
| SB-14-04 | Mining, metallurgy, and tools | backlog | story-04-mining-metallurgy-tools.md | — |
| SB-14-05 | Full-economy gate with live stats | backlog | story-05-full-economy-gate.md | — |

## Where we are

SB-14-02 is done: the profession framework runs the founding chains —
woodcutter, forester, sawmill, stonecutter — with products routed to
consumers and the castle stock. SB-14-03 (food chains) is in progress.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Per-profession behaviors hide many edge states | high | One chain per story; fixtures per profession | Chain stories repeatedly splitting |
| Balance drift vs original rates | medium | Rate fixtures from reference runs | Measured rates diverge |
| Serf count growth hurts performance | medium | Measure at each chain; incremental rendering from Phase 13 | Below Phase 8 baselines |

## Decisions made (this phase)

- none yet.

## Decisions deferred

- Boat/water transport: evaluate during SB-14-01 scoping.
