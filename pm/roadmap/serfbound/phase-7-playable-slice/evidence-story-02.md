# Evidence — SB-7-02 — Implement First Visible Build Action

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `serfbound/packages/engine/src/simulation.ts` - adds `builtStructures` state,
  snapshot persistence, and deterministic `buildFlag()` mutation.
- `serfbound/packages/engine/src/commands.ts` - routes `game.build` flag
  commands, rejects occupied tiles, and keeps road/hut commands explicitly
  deferred.
- `serfbound/packages/app/src/render-layer-scene.ts` - draws built flag
  primitives above terrain in the WebGL2 render layer.
- `serfbound/packages/app/src/main.ts` - exposes the `Build flag` action in a
  running local game, enables it for selected unoccupied tiles, renders state
  changes, and shows recoverable command feedback.
- `serfbound/tests/ci/engine-command-routing.test.mjs` - verifies accepted flag
  build, occupied-tile rejection, and deferred hut/road build behavior.
- `serfbound/tests/ci/app-render-layer-scene.test.mjs` - verifies built flag
  render primitives are emitted on object and marker layers.
- `serfbound/tests/browser/static-shell.spec.ts` - verifies the browser
  imported-data start flow, tile selection, flag build, visible state mutation,
  duplicate rejection feedback, and screenshot capture.
- `pm/roadmap/serfbound/phase-7-playable-slice/artifacts/story-02-first-build-flag-desktop.png`
  - design-handoff screenshot of the first visible build action.

## Behavior protected

- A player must import data and start a local browser game before building.
- Selecting a valid map tile enables `Build flag`.
- `game.build` with `building: "flag"` mutates engine `builtStructures` through
  the command router and increments command history deterministically.
- The renderer receives built structures from browser app state and draws a
  visible flag on the selected tile.
- Duplicate flag placement rejects as `tile-occupied` with recoverable browser
  feedback.
- Road and hut build targets remain structured but reject as
  `build-command-deferred`.
- No .NET runtime, desktop shell, native launcher, or bundled original data is
  introduced.

## Visual Evidence

- Desktop first flag build:
  `artifacts/story-02-first-build-flag-desktop.png`

The screenshot was inspected after the browser run. It shows imported data,
running local game state, selected tile state, `Flag built` action feedback, a
disabled occupied-tile build button, and the newly rendered flag on the map.

## Commands and output

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm test && npm run check:boundaries && npm run test:local:assets && SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 SERFBOUND_SPAU_PA="../serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA" npm run test:local:assets && cd .. && git diff --check'
```

Output summary:

```text
39 unit tests passed.
2 chromium browser tests passed.
serfbound-boundaries-ok
serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
serfbound-local-asset-tests-ok: parsed SPAU.PA catalog and matched Phase 1 oracle metadata plus typed catalog and render-layer scene facts.
git diff --check passed with no output.
```

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && npm run test:unit'
```

Output summary:

```text
39 unit tests passed.
```

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && npm run test:browser'
```

Output summary:

```text
2 chromium browser tests passed.
```
