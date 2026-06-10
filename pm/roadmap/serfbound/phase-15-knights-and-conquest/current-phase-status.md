# Phase 15 — Knights and Conquest

**Last updated:** 2026-06-10.
**Status:** complete — see final-summary.md.

## Goal

The military game: recruit knights, occupy huts/towers/fortresses, expand
territory, attack enemy buildings, and win or lose a game — with combat
outcomes parity-checked against the reference simulation.

## Scope

- **In:** Weaponsmith and gold smelting (closing the Phase 14 economy into
  military supply), knight recruitment and morale (gold reserves), military
  building occupation and territory growth, knight serf states including the
  fight states in `Serf.cs`, attack flows from `Player.cs`/`Game.cs`, building
  capture, and castle defeat/game-over conditions.
- **Out:** AI opponents (Phase 18 — this phase proves combat against a
  passive/scripted second player), war-related UI popups (Phase 16), audio
  (Phase 17).

## Non-negotiable constraints

- Combat resolution is fixture-checked against the reference (deterministic
  given seeds) — never re-balanced by feel.
- Territory recomputation must match reference fixtures around contested
  borders.

## Exit criteria (evidence required)

- [x] Weapons/shields and gold morale supply knights per reference rules.
  (SB-15-01)
- [x] Military buildings occupy, set territory, and grow borders matching
  fixtures. (SB-15-02)
- [x] Combat sequences match reference outcome fixtures; fights animate with
  authentic sprites. (SB-15-03)
- [x] An attack can capture an enemy building and a castle can fall, ending
  the game, with real-data capture evidence. (SB-15-04)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-15-01 | Arm and recruit knights | done | story-01-arm-and-recruit-knights.md | evidence-story-01.md |
| SB-15-02 | Military occupation and border growth | done | story-02-occupation-border-growth.md | evidence-story-02.md |
| SB-15-03 | Port combat resolution with parity fixtures | done | story-03-combat-resolution-parity.md | evidence-story-03.md |
| SB-15-04 | Capture, defeat, and game over | done | story-04-capture-defeat-game-over.md | evidence-story-04.md |

## Where we are

The phase is closed. The military game works end to end: weapons forge,
knights recruit on gold morale, garrisons occupy and grow borders, seeded
fights resolve with reference parity, and conquest transfers buildings and
territory until a castle falls and the game ends. See final-summary.md.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Combat RNG order diverges from reference | high | Tick-exact combat fixtures with seeded games | Any fixture mismatch |
| Territory math errors create map corruption | medium | Border fixtures incl. contested/island cases | Orphaned or flickering territory |
| Two-player flows strain the single-player shell | medium | Scripted opponent harness, not full multiplayer | Shell rewrites creeping in |

## Decisions made (this phase)

- none yet.

## Decisions deferred

- Catapults/sailors if present in reference scope review.
