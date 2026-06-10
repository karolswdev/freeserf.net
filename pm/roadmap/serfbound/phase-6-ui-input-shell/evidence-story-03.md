# Evidence — SB-6-03 — Build Basic Panels And States

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `serfbound/packages/app/src/main.ts` - adds player-facing Data, Game, Map,
  Hover, Selected Tile, and Action panels; wires start-game, recoverable data
  errors, imported-data readiness, reset, selected tile, and action states.
- `serfbound/packages/app/src/styles.css` - adjusts the status panel for the
  larger first-playable state surface on desktop and mobile.
- `serfbound/tests/browser/static-shell.spec.ts` - verifies missing data,
  recoverable unsupported-file error, imported data, restored data, start game,
  selected tile, action state, player-facing visible copy, and desktop/mobile
  framing.
- `pm/roadmap/serfbound/phase-6-ui-input-shell/artifacts/story-03-basic-panels-desktop.png`
  - desktop design-handoff screenshot.
- `pm/roadmap/serfbound/phase-6-ui-input-shell/artifacts/story-03-basic-panels-mobile.png`
  - mobile design-handoff screenshot.
- `pm/roadmap/serfbound/phase-6-ui-input-shell/story-03-basic-panels-states.md`
  - marks SB-6-03 done.
- `pm/roadmap/serfbound/phase-6-ui-input-shell/story-04-interaction-ergonomics.md`
  - opens SB-6-04 as ready.
- `pm/roadmap/serfbound/phase-6-ui-input-shell/current-phase-status.md` and
  `pm/roadmap/serfbound/README.md` - record the first playable UI shell
  baseline.

## Behavior protected

- Missing data is explicit and still allows a practice start path.
- Unsupported import selection is recoverable and keeps practice available.
- Imported and restored data move the Game panel into a ready state.
- `Start game` is visible, testable, and moves the Game panel to running state.
- Selected map positions persist in a Selected Tile panel with tile and map
  coordinates.
- The Action panel reflects selected land without exposing command/router
  implementation names in visible player copy.
- Panels fit desktop and mobile Chromium viewports without incoherent overlap.

## Visual Evidence

- Desktop: `artifacts/story-03-basic-panels-desktop.png`
- Mobile: `artifacts/story-03-basic-panels-mobile.png`

Both screenshots were inspected after the browser run. The panel text is
readable, controls fit their containers, and the mobile layout stacks without
overlap.

## Commands and output

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm test && npm run check:boundaries && npm run test:local:assets'
```

Output summary:

```text
35 unit tests passed.
2 chromium browser tests passed.
serfbound-boundaries-ok
serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
```

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && npm run test:browser'
```

Output summary:

```text
2 chromium browser tests passed.
```
