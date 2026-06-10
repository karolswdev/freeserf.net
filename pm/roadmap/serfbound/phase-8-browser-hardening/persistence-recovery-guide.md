# Persistence Recovery Guide

**Story:** SB-8-03 - Harden Persistence Recovery
**Status:** baseline v1
**Audience:** player-facing behavior notes for the current browser slice

## What Is Stored

Serfbound currently stores two independent browser-local records:

- Imported game data metadata and bytes for the current user-provided
  `SPAU.PA`.
- The current local-game save snapshot.

Both records are versioned. They live in browser storage and are not uploaded,
hosted, bundled, or shared by Serfbound.

## Normal Recovery

On reload, the browser shell attempts to restore imported data first, then the
current local-game save.

Expected normal states:

- Imported data restores as `SPAU.PA restored with 2 resources.` for the
  current generated/first-slice test data, or the matching resource count for a
  local file.
- A valid saved game appears as `Saved game`.
- Loading the save restores the local game only when the current imported data
  source matches the save's source metadata.

## Troubleshooting Steps

If imported data cannot be read:

1. Use `Clear data`.
2. Import `SPAU.PA` again.
3. Start a new local game after the Data panel returns to `Data imported`.

If the saved game cannot be read:

1. Use `Clear save`.
2. Keep the imported data in place.
3. Start or continue a local game, then save again.

If saving fails because browser storage is full, blocked, unavailable, or
quota-limited:

1. Keep playing in the current session if the imported data loaded.
2. Clear unrelated browser storage if needed.
3. Retry `Save game`.
4. If the Data panel says the imported data could not be saved for next time,
   reimport `SPAU.PA` after reload.

If loading a save says the imported data source does not match:

1. Import the same `SPAU.PA` source used when the save was created.
2. If that source is unavailable, use `Clear save` and start a new local game.

## Version Mismatch Behavior

Unsupported storage versions are treated as recoverable corruption:

- Unsupported imported-data records show `Saved data unavailable`, enable
  `Clear data`, and keep game start disabled until data is imported again.
- Unsupported save records show `Save unavailable`, enable `Clear save`, and do
  not remove imported data.

No migration ceremony is added for the current first browser slice. If a future
story introduces a v2 storage format, that story must add explicit migration
tests and update this guide.

## Reset Boundaries

`Clear save` deletes only the local-game save. It does not delete imported
`SPAU.PA` data.

`Clear data` deletes imported `SPAU.PA` data and returns the browser shell to
the no-data setup state. A player must import data again before starting a
local game.
