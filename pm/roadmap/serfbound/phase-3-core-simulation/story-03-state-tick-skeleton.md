# SB-3-03 — Add State And Tick Skeleton

- **Project:** serfbound
- **Phase:** 3
- **Status:** done
- **Depends on:** SB-3-01, SB-3-02
- **Unblocks:** SB-3-04, SB-7-01, SB-7-03
- **Owner:** Codex

## Problem

The playable game needs a deterministic state container and tick loop before
actions, saves, or rendering can mean anything. This skeleton should be small
but shaped like the future engine.

## Scope

- **In:** Minimal game state, tick clock, deterministic update entry point,
  serialization or snapshot shape, and tests against oracle expectations.
- **Out:** Full economy, AI, complete savegame compatibility, rendering, or UI
  commands.

## Acceptance criteria

- [x] State and tick skeleton exists inside the engine boundary.
- [x] Tests prove tick advancement is deterministic.
- [x] Snapshot or serialization shape is explicit and stable.
- [x] The skeleton can be driven without DOM/browser APIs.
- [x] Deferred systems are listed with source references.

## Test plan

- **Unit:** Run state/tick tests and snapshot comparison.
- **Integration / Cypress:** n/a.
- **Manual / device:** Review snapshot shape for readability and future save
  migration implications.
- **Design handoff:** n/a - non-visual.

## Notes / open questions

Shipped `SerfboundGameState` in `@serfbound/engine` with source-derived tick
clock behavior, default speed constants, `GameTime` accumulation,
`tickDifference` overflow behavior, first schedule counters, RNG snapshot
fields, map dimensions, and stable JSON snapshot/restore.

This is not a full savegame port and does not claim byte-level serializer
parity. Deferred systems are `Map.Update()`, terrain/object mutation, players,
AI, visuals, stats/history counters, text/binary save compatibility, dirty-state
serialization, local asset-backed initialization, and full game command
handling. Source references: `Freeserf.Core/GameState.cs`,
`Freeserf.Core/Game.cs`, `Freeserf.Core/Freeserf.cs`,
`Freeserf.Core/Map.cs`, `Freeserf.Core/Player.cs`,
`Freeserf.Core/Savegame.cs`, and `Freeserf.Core/Serialize/*`.
