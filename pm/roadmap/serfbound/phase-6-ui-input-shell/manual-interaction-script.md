# Phase 6 Manual Interaction Script

**Project:** Serfbound
**Phase:** 6
**Purpose:** Verify that the first playable browser shell can be operated
without fighting browser defaults before Phase 7 adds build actions.

## Environment Setup

1. Start from a clean browser profile or clear existing Serfbound IndexedDB
   data.
2. Open the browser build at the normal local dev or preview URL.
3. Use the default generated practice scene unless a local `SPAU.PA` import is
   explicitly part of the check.
4. Keep DevTools closed unless inspecting `data-serfbound-*` state.

## Desktop Mouse Or Trackpad Path

1. Confirm the first screen shows Data, Game, Source, Map, Hover, Selected Tile,
   and Action panels.
2. Confirm `Start game`, `Import data`, and disabled `Clear data` controls are
   visible without scrolling on a 1280x720 viewport.
3. Move the pointer across the terrain canvas.
4. Expected: Hover panel updates to a tile coordinate and no page scrolling or
   text selection occurs.
5. Select the center of the terrain canvas.
6. Expected: Hover, Selected Tile, and Action panels update; the visible Action
   copy remains player-facing.
7. Select three more widely separated terrain points.
8. Expected: each selection updates promptly and does not move layout.
9. Press `Start game`.
10. Expected: Game panel changes to Running, the button disables, and the map
    remains interactive for inspection.

## Import And Recovery Path

1. Choose `Import data`.
2. Select an unsupported file such as `README.txt`.
3. Expected: Data panel shows a recoverable file error and `Start game` remains
   enabled for practice.
4. Choose `Import data` again.
5. Select `SPAU.PA`.
6. Expected: Data panel shows imported data, Game panel changes to Ready, Source
   becomes Imported data, and Map becomes Imported terrain.
7. Reload the page.
8. Expected: imported data is restored and `Clear data` is enabled.
9. Press `Clear data`.
10. Expected: shell returns to no-data practice setup with Start game available.

## Touch-Capable Browser Path

1. Open the same build on a touch-capable browser.
2. Tap the terrain canvas near the center.
3. Expected: Selected Tile and Action panels update, and the page does not pan
   while tapping the canvas.
4. Drag lightly across the terrain canvas.
5. Expected: Hover feedback may update when the browser emits pointer movement;
   the interaction must not trigger accidental browser navigation or text
   selection.
6. Tap `Start game`.
7. Expected: the Game panel changes to Running and the button disables.

## Stop Signals

- Any required Phase 7 action target cannot be selected reliably.
- Canvas interaction scrolls, zooms, selects text, or activates browser chrome.
- Action feedback is absent after selecting a map tile.
- Data import failure leaves the player trapped without a visible recovery path.
- Desktop or mobile viewport panels overlap in a way that hides required state.
