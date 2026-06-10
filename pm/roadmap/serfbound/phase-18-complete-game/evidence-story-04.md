# Evidence — SB-18-04 — Load Original DOS Savegames

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/engine/src/dos-savegame.ts` — the original `.SAV`
  binary reader, ported from the reference layout
  (`Game.ReadFrom`/`Map.ReadFrom`/`Building.ReadFrom`):
  - The fixed-offset header (game type @74, tick @78, the three-word
    random state @84, max flag/building/serf indexes @90–94, max
    inventory index @174, map size @190 with the 3..10 guard, gold morale
    factor @200, score leader @204).
  - Four 8628-byte player blocks each followed by the activity flags byte
    (bit 6 = active player).
  - Eight bytes per map tile in the reference's two row passes: paths,
    the packed height+owner byte, the packed terrain nibbles, the object
    byte; then object-index words for flag..castle objects vs the packed
    mineral/resource byte pair, plus the serf word.
  - The bitmap-prefixed object arrays (serfs 16 B, flags 70 B, buildings
    18 B — one record extracted per index like the reference), with
    building records decoding the reference packing
    (`PositionFromSavedValue`, type/player/constructing in one byte,
    threat level in the next).
  - `continueFromDosSavegame`: the saved landscape becomes a playable
    world — active players restored, castles re-found (inventories and
    territory), completed buildings standing, minerals and natural
    objects intact.
- `serfbound/tests/ci/engine-dos-savegame.test.mjs` — a synthetic `.SAV`
  built byte-for-byte to the reference layout loads to exact game-state
  facts (tick, random state, players, ownership, minerals, objects,
  building records), continues as a playable world, and malformed input
  parses to null.

## Verification artifacts

```text
node --test tests/ci/engine-dos-savegame.test.mjs -> # tests 3 / pass 3
npm run test:unit -> # tests 169 / pass 169 / fail 0
```

## Deviations from plan (recorded)

- **No original `.SAV` exists in the local corpus** — the user's demo
  install carries no save files, and the reference implementation can't
  be run headlessly here to produce one. The parity acceptance is
  therefore proven against a byte-exact synthetic fixture of the same
  layout; when a real original save is available, the same parser loads
  it (the format is the reference's own offsets). Recorded as the
  real-save evidence gap to close when a save corpus exists.
- In-flight serfs, flag economies, and saved inventories are skipped on
  continue (serfs respawn through logistics, roads rebuild from map
  paths, inventories seed the default preset) — the recorded staged
  condensation, matching how Phase 13/14 restores work.
- The browser save-import UI ships with SB-18-05's session work.

## Follow-ups

- SB-18-05: game speed, autosave, and the played-mission gate closing the
  phase.
