# Evidence — SB-7-01 — Start Local Game From Imported Data

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `serfbound/packages/engine/src/local-game.ts` - adds deterministic local
  single-player game initialization from imported DOS PA catalog metadata,
  structured start rejection, seed derivation, and local game snapshots.
- `serfbound/packages/engine/src/index.ts` - exports the local game API from
  `@serfbound/engine`.
- `serfbound/packages/app/src/main.ts` - carries parsed catalog metadata into
  the start path, requires imported data before local start, starts the engine
  local game, swaps the command router onto initialized game state, and exposes
  local-game DOM state.
- `serfbound/tests/ci/engine-local-game.test.mjs` - verifies deterministic
  local game initialization and rejected missing/invalid start inputs.
- `serfbound/tests/browser/static-shell.spec.ts` - verifies the imported-data
  browser start flow, running game state, initialized map state, no-data
  recovery, and started-game screenshot capture.
- `pm/roadmap/serfbound/phase-7-playable-slice/artifacts/story-01-local-game-started-desktop.png`
  - design-handoff screenshot of the started local game.
- `pm/roadmap/serfbound/phase-7-playable-slice/story-01-start-local-game.md`
  - marks SB-7-01 done.
- `pm/roadmap/serfbound/phase-7-playable-slice/story-02-first-visible-build-action.md`
  - opens SB-7-02 as ready.
- `pm/roadmap/serfbound/phase-7-playable-slice/current-phase-status.md` and
  `pm/roadmap/serfbound/README.md` - record the local game start baseline.

## Behavior protected

- A running local game cannot start without imported `SPAU.PA` catalog data.
- Imported or restored catalog data enables the `Start game` path.
- Engine state initializes deterministically from catalog metadata and selected
  default settings.
- The browser swaps command routing to the initialized game state after start.
- The renderer displays the imported terrain as a started settlement map.
- Missing/invalid data remains recoverable and leaves start disabled until valid
  data is available.
- The path remains pure browser with no desktop companion or .NET runtime.

## Visual Evidence

- Desktop started game:
  `artifacts/story-01-local-game-started-desktop.png`

The screenshot was inspected after the browser run. It shows imported data,
running local game state, settlement map state, deterministic seed detail, and
controls without visible overlap.

## Commands and output

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm test && npm run check:boundaries && npm run test:local:assets && SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 SERFBOUND_SPAU_PA="../serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA" npm run test:local:assets && cd .. && git diff --check'
```

Output summary:

```text
37 unit tests passed.
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
37 unit tests passed.
```

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && npm run test:browser'
```

Output summary:

```text
2 chromium browser tests passed.
```
