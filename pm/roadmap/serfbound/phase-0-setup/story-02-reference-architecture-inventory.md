# SB-0-02 — Inventory Reference Architecture

- **Project:** serfbound
- **Phase:** 0
- **Status:** backlog
- **Depends on:** SB-0-01
- **Unblocks:** SB-0-03, SB-0-04, SB-1-01
- **Owner:** unassigned

## Problem

`freeserf.net` is already split into core, renderer, audio, network, and desktop
shell projects, but those boundaries are not automatically the right browser
boundaries. Serfbound needs a concrete inventory that says which files are
gameplay reference, which are platform adapters, which are serialization/data
oracles, and which are desktop-only behavior.

## Scope

- **In:** Inventory `Freeserf.Core`, `Freeserf.Renderer`, `Freeserf.Audio`,
  `Freeserf.Network`, `Silk.NET.Window`, `FreeserfNet`, tests, data loaders,
  savegame serialization, config, input, render abstractions, and known
  missing features from `README.md`/`Issues.md`.
- **Out:** Porting code, choosing the final web stack, or implementing browser
  adapters.

## Acceptance criteria

- [ ] Add `pm/roadmap/serfbound/adoption/reference-architecture-inventory.md`.
- [ ] The inventory has a table with columns: subsystem, source files,
  current responsibility, browser fate, first parity evidence.
- [ ] The inventory explicitly covers `Game.cs`, `Map.cs`, `MapGenerator.cs`,
  `Savegame.cs`, `GameState.cs`, `DataSourceDos.cs`, `DataSourceAmiga.cs`,
  `Render/*`, `Freeserf.Renderer/*`, `Freeserf.Audio/*`, and `FreeserfNet/*`.
- [ ] The inventory identifies at least five desktop assumptions that need
  browser replacements.
- [ ] The inventory marks at least three deterministic outputs suitable for
  parity capture in SB-0-04.

## Test plan

- **Unit:** n/a - documentation/inventory story.
- **Integration / Cypress:** n/a.
- **Manual / device:** Use `rg`/file inspection to verify every named subsystem
  exists and is represented in the inventory.

## Notes / open questions

Do not infer behavior from class names alone. If a subsystem is unclear, cite
the exact unknown and make it a Phase 0 question.
