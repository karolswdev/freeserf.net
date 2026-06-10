# SB-18-04 — Load Original DOS Savegames

- **Project:** serfbound
- **Phase:** 18
- **Status:** done
- **Depends on:** SB-18-03
- **Unblocks:** SB-18-05
- **Owner:** unassigned

## Problem

Savegame.cs reads the original .SAV format into full game state. Loading the user's own classic saves in the browser is both a parity oracle and a beloved feature.

## Scope

- **In:** .SAV parsing port, mapping into Serfbound engine state, import UI alongside SPAU.PA import, save-state fact fixtures vs reference loads, graceful rejection of unsupported saves.
- **Out:** Writing original-format saves (Serfbound keeps its native save format).

## Acceptance criteria

- [x] A reference .SAV corpus loads to matching state facts (fixtures).
- [x] Loaded games continue playably (ticks advance without desync).
- [x] Corrupt/unsupported saves reject recoverably in the UI.

## Test plan

- **Unit:** Fixture parity (decisions, saves, missions) in CI.
- **Integration / Cypress:** Browser scenario tests on fixture data.
- **Manual / device:** Real-data/realsave runs recorded as evidence.
- **Design handoff:** Screenshots/captures under phase artifacts.

## Notes / open questions

- Preserves: reference behavior; divergences recorded at ship time.
- Browser boundary: storage quotas for autosave; long-session memory.
- .NET reference use: read-only porting reference.
- Phase gate advanced: see phase exit criteria.
