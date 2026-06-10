# Phase 18 — Final Summary

**Closed:** 2026-06-10.

## Goal — was it met?

Yes. It is a finished game rather than a sandbox: the original campaign
(31 missions, exact seeds and player presets) selects from the start
screen and starts right; classic AI opponents found castles
deterministically, establish the reference build order, grow the deeper
economy, garrison with computed threat levels, and attack when
knight-rich — all through the same recorded world actions the human uses,
so AI games save and replay; the original DOS `.SAV` layout parses with
the reference offsets and continues as a playable world; and game speeds,
autosave, and long sessions hold up (2M ticks, flat heap), with a played
mission captured live.

## Exit criteria — final state

- [x] Campaign missions select and start with correct maps, players, and
  supplies (SB-18-01).
- [x] AI opponents found settlements, build economies, and act
  militarily, matching decision fixtures on seeded runs (SB-18-02/03).
- [x] Original DOS savegames load and continue (SB-18-04; byte-exact
  synthetic fixture — the real-save corpus gap is recorded).
- [x] Game speeds, autosave, and long sessions hold up with a played
  mission captured (SB-18-05).

## Stories shipped

| ID | Story | Evidence |
|---|---|---|
| SB-18-01 | Missions and game setup variants | evidence-story-01.md |
| SB-18-02 | Classic AI foundation | evidence-story-02.md |
| SB-18-03 | Classic AI economy and military behaviors | evidence-story-03.md |
| SB-18-04 | Load original DOS savegames | evidence-story-04.md |
| SB-18-05 | Speed, autosave, and the played-mission gate | evidence-story-05.md |

## What the phase intentionally did not do (recorded)

- PYRDACOR's nonstandard seed alphabet (listed, unstartable until the
  permissive seed ctor is ported).
- Real original `.SAV` parity evidence (no save exists in the local
  corpus; the parser is the reference layout, fixture-proven).
- In-flight serf/inventory restoration from DOS saves (the staged
  condensation that matches the engine's own restore model).
- AI tick-exact traces against C# reference runs (the fixture boundary:
  decision order + determinism are pinned).
- Multiplayer (post-launch track).

## Carry-forward recommendations

1. Phase 19 owns the ergonomics round-up: mission list popup, speed
   buttons, volume steppers, autosave slots.
2. When a real DOS save corpus is available, run it through
   `parseDosSavegame` and record the parity facts.
3. The AI's `KnightsAvailableForAttack` distance rings should land with
   the war UI.
