# Phase 15 — Knights and Conquest

**Last updated:** 2026-06-10.
**Status:** in progress.

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
- [ ] Military buildings occupy, set territory, and grow borders matching
  fixtures. (SB-15-02)
- [ ] Combat sequences match reference outcome fixtures; fights animate with
  authentic sprites. (SB-15-03)
- [ ] An attack can capture an enemy building and a castle can fall, ending
  the game, with real-data capture evidence. (SB-15-04)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-15-01 | Arm and recruit knights | done | story-01-arm-and-recruit-knights.md | evidence-story-01.md |
| SB-15-02 | Military occupation and border growth | backlog | story-02-occupation-border-growth.md | — |
| SB-15-03 | Port combat resolution with parity fixtures | backlog | story-03-combat-resolution-parity.md | — |
| SB-15-04 | Capture, defeat, and game over | backlog | story-04-capture-defeat-game-over.md | — |

## Where we are

SB-15-01 is done: the weaponsmith forges swords and free shields from
coal + steel, knight morale follows the reference gold formula, and the
castle recruits its wanted knight stock (generic serf + sword + shield),
all live in the browser military summary. SB-15-02 (occupation and border
growth) is next.

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
