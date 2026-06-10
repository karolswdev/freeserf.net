# Phase 7 Manual Playable Loop Script

**Story:** SB-7-04 — Verify Playable Loop Manually
**Date:** 2026-06-09

## Preconditions

- Build the browser app with `npm run build:web` from `serfbound/`.
- Serve the built app with `npm run preview -- --port 4183` from `serfbound/`.
- Use locally owned original data at:
  `serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA`
- Do not commit, copy, host, or redistribute original data bytes.

## Script

1. Open `http://127.0.0.1:4183/` in Chromium.
2. Import local `SPAU.PA`.
3. Confirm Data shows `Data imported`.
4. Click `Start game`.
5. Confirm Game shows `Running` and Map shows `Imported terrain`.
6. Capture `artifacts/story-04-manual-started-desktop.png`.
7. Select a map tile.
8. Confirm Action shows `Build flag available`.
9. Click `Build flag`.
10. Confirm Action shows `Flag built` and a flag appears on the map.
11. Click `Save game`.
12. Confirm Save shows `Game saved`.
13. Capture `artifacts/story-04-manual-flag-saved-desktop.png`.
14. Reload the browser page.
15. Confirm imported data restores and Save shows `Saved game`.
16. Click `Load game`.
17. Confirm Save shows `Game loaded`, Game shows `Running`, and the flag is
    still rendered.
18. Capture `artifacts/story-04-manual-loaded-save-desktop.png`.

## Pass Criteria

- Import, start, build, save, reload, and load complete in browser.
- Restored state reports one built structure.
- The restored screenshot visibly includes the built flag.
- The run uses only browser app code plus a static local preview server; no
  .NET runtime, desktop shell, native launcher, or original data bundling.
