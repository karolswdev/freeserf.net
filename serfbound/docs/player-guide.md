# Serfbound Player Guide

Serfbound runs in the browser. The app does not include, host, sell, download,
or redistribute original DOS/Amiga game data. You provide your own local data
file through the browser file picker.

## Requirements

- A modern desktop or mobile browser with JavaScript, the File API, IndexedDB,
  and WebGL2 enabled.
- Your own local DOS data file. The current verified file is `SPAU.PA`.
- A stable Serfbound URL. Browser storage is tied to the origin, so changing
  scheme, host, or port can require reimporting data.

## Import Local Data

1. Open Serfbound in the browser.
2. Use `Import data`.
3. Choose your local `SPAU.PA` file.
4. Wait for the Data panel to show `Data imported`.

The file is read by your browser. It is not uploaded to a Serfbound server.
After a successful import, Serfbound stores the current imported archive in
IndexedDB for that browser origin.

If the Data panel says `File not usable`, choose `SPAU.PA`. Other files are not
accepted by the current browser slice.

If the Data panel says `Data loaded` and explains that it could not be saved for
next time, the current session can continue, but you may need to reimport after
reload.

## Start And Play The Current Slice

After import succeeds:

1. Use `Start game`.
2. Select land on the map.
3. If the Action panel says `Build flag available`, use `Build flag`.

The current browser slice proves local import, deterministic game start,
selection, one build action path, save, reload, and resume. It is not the full
original game yet.

## Save, Load, And Resume

Use `Save game` after a local game is running. A valid save appears as
`Saved game` after reload.

To resume:

1. Open the same Serfbound origin.
2. Confirm the Data panel shows `Data imported`.
3. Use `Load game`.

The save is tied to the imported data source. If Serfbound says the saved game
uses another imported data source, import the same `SPAU.PA` source used when
the save was created, or clear the save and start again.

## Reset Controls

`Clear save` deletes only the local-game save. It keeps imported `SPAU.PA` data
available.

`Clear data` deletes imported data and returns Serfbound to the no-data setup
state. After `Clear data`, import `SPAU.PA` again before starting a local game.

Use browser site-data controls only as a last resort. Clearing site data removes
both imported data and saves for that origin.

## Troubleshooting

If imported data cannot be restored and Serfbound shows `Saved data
unavailable`, use `Clear data`, then import `SPAU.PA` again.

If a saved game is corrupt or from an unsupported version, use `Clear save`.
This does not remove imported data.

If saving fails because storage is full or blocked, clear unrelated browser
storage, allow site storage for the Serfbound origin, and retry `Save game`.

If the app looks stale after a release, refresh the page. Release hosts should
revalidate `index.html` and cache hashed assets immutably. If a stale state
persists, clear site data for the Serfbound origin, reload, and reimport local
data.

If you move between `http` and `https`, change subdomains, or change ports,
your browser treats that as a different origin. Reimport `SPAU.PA` on the new
origin.


## Playing with the original interface

Once your data is imported, the title screen on the canvas is the front
door: tap or click SEED to reroll the world, SUPPLIES to cycle your
starting stock, MISSION to pick a campaign mission, and START (or press
Enter) to play. In the game, the original panel bar drives everything:
the build button opens the construction menus, the road button lays
roads, and the map/stats/sett buttons open the minimap, the resource
stats, and the knight/audio settings.

Keyboard play: arrow keys scroll the map, Enter starts the configured
game from the title screen, and 0/1/2/4 pause or set the game speed.
Game sessions autosave automatically while running.

High-resolution displays render at native sharpness automatically. The
world view scale (1x/2x/3x zoom — the modern SVGA) cycles with the V
key or the shell's "View scale" button; it follows your screen's pixel
density by default.

Touch play: tap to act, drag to scroll, pinch to zoom the world view,
pan with two fingers, and press-and-hold a tile to inspect it without
building anything.

Two-player (experimental): with data imported, "Host 2P (this
browser)" in one tab and "Join 2P (this browser)" in another tab of the
same browser starts a lockstep match — both tabs simulate the same
world and your commands execute on both. It runs entirely in your
browser (no servers; your game data never leaves the machine). Internet
play arrives with the online-play phase.

Hot-seat 2P (pass and play): two players share one machine in
correspondence style — you play a session window, hand the seat over
(Enter picks the turn up before the countdown runs out), your opponent
watches a high-speed recap of your window, then plays theirs. Tip:
`?seed=` in the address bar (16 digits, 1–8) pins the world so you can
share or replay it.

## Sound and music

Sound effects and music decode from your own data and start after your
first click or tap (browsers require a gesture). Mute switches live in
the sett popup and persist on this device.

## Installing and playing offline

Serfbound installs as an app from your browser's install option. The app
shell works offline; your imported data and saves live in this device's
browser storage, so the game keeps playing without a network. Original
game data is never uploaded or cached outside your device.

## Reporting problems

If something breaks, press "Copy error report" in the side panel and
paste the result into a new GitHub issue (the "Serfbound bug report"
template). The report carries your browser, the game version, and the
last few errors with game facts like the tick and map seed — it never
includes your imported game data. Reporting is always your explicit
action; the game sends nothing on its own.
