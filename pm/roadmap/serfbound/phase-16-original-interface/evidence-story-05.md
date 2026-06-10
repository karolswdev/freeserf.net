# Evidence — SB-16-05 — Authentic Game Start Screen

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/app/src/init-screen.ts` — the `GameInitBox.cs` port
  condensed to the options the engine supports: the start box layout with
  interactive rows (seed randomizes in the reference 1–8 alphabet,
  supplies cycle the custom-game stops, START begins the game), row
  hit-testing, and the seed generator.
- `serfbound/packages/assets/src/ui-art.ts` — `decodeUiLogo` (resource 41
  against palette 3998 — the original Blue Byte logo).
- `serfbound/packages/app/src/render-layer-scene.ts` — the import-preview
  atlas now carries the UI chrome (font, background pattern, frames,
  logo), and the decoded preview scene draws the init box over the
  terrain: logo, SERFBOUND title, SEED with the 16 digits, SUPPLIES, MAP
  SIZE, and START, all in decoded art at 2x.
- `serfbound/packages/app/src/main.ts` — init-screen state
  (`data-serfbound-init-seed` / `-init-supplies`): setup-state canvas
  clicks randomize the seed, cycle supplies, and start the seeded custom
  game; the shell start button drives the same settings in decoded mode
  while the catalog-only fallback keeps its deterministic derived seed.
- `serfbound/packages/engine/src/local-game.ts` /
  `game-world.ts` — `initialSupplies` joins the game settings (persisted
  in saves), and `buildCastle` stocks the castle from it instead of the
  hardcoded 20.
- `serfbound/tests/ci/app-init-screen.test.mjs` — row hit-testing, the
  supplies cycle and seed alphabet, the rendered init box (logo, pattern,
  seed digits in the font), and custom supplies flowing into the castle
  inventory preset (`suppliesPresetResources(35)` parity).
- `serfbound/tests/browser/decoded-scene.spec.ts` — the founding e2e now
  drives the WHOLE flow through the authentic UI: the init screen seeds
  and starts the game, the build popup places the flag and lumberjack,
  and the panel road slot routes the roads — no temporary build buttons.
- `serfbound/tests/ci/engine-local-game.test.mjs` — snapshot expectations
  carry the new setting.

## Verification artifacts

```text
node --test tests/ci/app-init-screen.test.mjs -> # tests 4 / pass 4
npm run test:unit -> # tests 146 / pass 146 / fail 0
npm run test:browser -> 6 passed (2.0m)
init-screen capture (real SPAU.PA) -> init-capture-ok; saved
  artifacts/sb-16-05-init-screen-desktop.png,
  artifacts/sb-16-05-started-game-desktop.png
```

Real-data review: the original Blue Byte '94 logo decodes from the
player's own archive and crowns the start box, with the seed digits and
options in the game font over the decoded import preview — the
import-then-play first run, captured.

## Deviations from plan (recorded decisions)

- Player slots: the single local player configures supplies and seed;
  player colors and multi-slot setup land with Phase 18's AI opponents
  (which create the second slot this UI would configure).
- Map size is displayed but fixed at 3 until larger-map performance is
  baselined (Phase 19).
- Temporary panel: decoded play now needs no temporary build/start
  controls (the e2e founds entirely through the authentic UI). The HTML
  controls remain solely for the catalog-only fallback mode — where no
  decoded chrome can exist — and for the browser-shell duties
  (save/load/import). Recorded here as the phase's panel decision.

## Follow-ups

- Phase 17 (sound and music) opens; Phase 18 wires missions into this
  start screen.
