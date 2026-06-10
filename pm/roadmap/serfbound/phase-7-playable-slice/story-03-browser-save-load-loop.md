# SB-7-03 — Add Browser Save/Load Loop

- **Project:** serfbound
- **Phase:** 7
- **Status:** done
- **Depends on:** SB-7-01, SB-3-03, SB-4-03
- **Unblocks:** SB-7-04, SB-8-03
- **Owner:** unassigned

## Problem

Playable state must survive reloads. A browser save/load loop proves that
Serfbound can persist engine state separately from imported original data.

## Scope

- **In:** Save snapshot, load snapshot, local persistence integration, version
  field, reset/recover path, and round-trip tests.
- **Out:** Full compatibility with original savegames, cloud sync, migrations
  beyond first version, or autosave polish.

## Acceptance criteria

- [x] Player can save current local game state.
- [x] Player can reload the browser and load the saved state.
- [x] Save data includes a version and source metadata.
- [x] Round-trip tests prove deterministic resume for the first slice.
- [x] Corrupt/missing save data is recoverable.

## Test plan

- **Unit:** Save serialization and round-trip tests.
- **Integration / Cypress:** Browser save, reload, load smoke test.
- **Manual / device:** Save/load local `SPAU.PA` game slice.
- **Design handoff:** n/a - functional state.

## Notes / open questions

Original savegame compatibility is a separate future decision. This story
protects Serfbound's own browser state.

Implemented save format:

- Serfbound writes its own browser-local save record with `schemaVersion: 1`.
- The save record stores `dataSource` metadata from the imported `SPAU.PA`
  catalog and a `serfbound.local-game` snapshot.
- The save is stored separately from imported original data in the
  `serfbound-local-game-saves` IndexedDB database.
- Original savegame import/export compatibility remains out of scope.
