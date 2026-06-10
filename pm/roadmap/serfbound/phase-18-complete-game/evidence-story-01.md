# Evidence — SB-18-01 — Missions and Game Setup Variants

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/engine/src/missions.ts` — the campaign ported
  exactly from `Mission.cs`: all 31 missions (the 30 classic + the
  reference's PYRDACOR bonus) with names, 16-digit map seeds, and player
  presets (character, intelligence, supplies, reproduction, pinned castle
  positions from ACORN on). `startSerfboundMission` configures the seeded
  map, the player slots, and per-player supplies; AI presets with pinned
  castles found them at start as **recorded world actions**, so saves
  replay missions identically; presets without castles leave the slot for
  SB-18-02's AI founding.
- `serfbound/packages/engine/src/local-game.ts` / `game-world.ts` — game
  settings carry `playerCount` and `playerSupplies`; the world spawns the
  mission's slots and `buildCastle` stocks each castle from its player's
  preset.
- `serfbound/packages/app/src/main.ts` / `init-screen.ts` /
  `render-layer-scene.ts` — the start screen gains the MISSION row:
  cycling moves CUSTOM → START → … → CUSTOM; a selected mission locks the
  seed and supplies rows to the campaign values
  (`data-serfbound-init-mission`); START launches the mission.
- `serfbound/tests/ci/engine-missions.test.mjs` — table parity (31
  entries, exact START/ACORN/PYRDACOR spot checks, human slot always
  face 12/intelligence 40), mission start fixtures (seed, slots,
  supplies-35 castle stock), pinned AI castles founding near their preset
  and replaying via world actions, and recoverable rejection for unknown
  missions and PYRDACOR.
- `serfbound/tests/browser/decoded-scene.spec.ts` — the e2e cycles into
  the campaign (START locks the mission seed), cycles back to CUSTOM, and
  proceeds through the custom flow.

## Verification artifacts

```text
node --test tests/ci/engine-missions.test.mjs -> # tests 4 / pass 4
npm run test:unit -> # tests 160 / pass 160 / fail 0
npm run test:browser -> 6 passed (1.8m)
mission capture (real SPAU.PA) -> mission-capture-ok; saved
  artifacts/sb-18-01-mission-select-desktop.png,
  artifacts/sb-18-01-mission-started-desktop.png
```

## Deviations from plan

- PYRDACOR (the reference's bonus mission) is listed for table parity but
  rejects at start: its seed uses digits outside the classic 1–8 alphabet
  and our `FreeserfRandom.fromStringSeed` keeps strict reference parity.
  Recorded; porting the reference's permissive seed ctor is a follow-up.
- The mission row cycles one-by-one; a list popup joins the Phase 19
  ergonomics pass.
- AI slots start with castles (when pinned) but no behavior until
  SB-18-02/03.

## Follow-ups

- SB-18-02: the classic AI foundation (castle founding for unpinned
  slots, the AI update loop).
