# Serfbound Developer Guide

Serfbound is the pure-browser workspace for the PMO roadmap in
`pm/roadmap/serfbound/`. Product code is TypeScript-first browser code. Do not
add .NET runtime code, desktop launchers, Electron/Tauri shells, native
companions, server-side asset hosting, or bundled original DOS/Amiga data.

## Setup

From the repository root:

```bash
cd serfbound
source ~/.nvm/nvm.sh
nvm use
npm ci
npx playwright install chromium
```

The workspace uses the Node version in `.nvmrc` and the npm version declared in
`packageManager`.

## Package Boundaries

- `@serfbound/engine` contains deterministic simulation primitives. It must not
  use DOM, rendering, storage, audio, or local file APIs.
- `@serfbound/assets` owns browser asset import and catalog parsing boundaries.
  It must not include original asset payloads.
- `@serfbound/app` owns browser UI, input, IndexedDB persistence, rendering
  integration, and local game wiring.
- `@serfbound/test-support` reads committed CI-safe fixture data for tests.
  Product packages must not depend on it.

Run:

```bash
npm run check:boundaries
```

## CI-Safe Tests

Normal CI must pass without `serfbound-local-data/` and without any original
game data.

Use:

```bash
npm test
npm run ci:release
```

`npm test` builds the workspace, runs Node CI tests against committed data-free
fixtures, builds the static browser shell, and runs Chromium browser smoke
tests.

`npm run ci:release` runs the release gate: CI-safe tests, module boundary
checks, static release build and artifact inspection, subpath static-hosting
verification, and the local asset skip path.

## Oracle Fixtures

CI-safe oracle fixtures live in:

```text
pm/roadmap/serfbound/reference-fixtures/ci/
```

Current CI-safe fixtures:

- `rng-fixed-seed-sequence.json`
- `map-geometry-facts.json`

Tests consume these files as data. Product runtime code must not import or run
`pm/roadmap/serfbound/reference-tools/`.

Local/manual oracle outputs live under ignored `serfbound-local-data/` paths and
must remain metadata-only. Do not commit raw `.PA` bytes, extracted sprites,
music, sounds, palettes, original executables, disk images, or converted
original assets.

## Local Asset Checks

Local asset checks are opt-in. They are not part of normal CI.

Use the local file only when the user has provided it under ignored
`serfbound-local-data/`:

```bash
npm run build
SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 \
SERFBOUND_SPAU_PA="../serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA" \
npm run test:local:assets
```

If the environment variable is not set, the command exits successfully with a
skip message. If local data is present, the command compares parser, typed asset
catalog, and render-layer facts against metadata-only local oracle output, then
decodes real palettes and sprites, composes terrain triangles, and builds a
decoded render scene.

To capture decoded-scene screenshots from real local data (used for phase
evidence; same opt-in environment variables; `SERFBOUND_CAPTURE_DIR` and
`SERFBOUND_CAPTURE_PREFIX` select the output folder and file prefix,
defaulting to uncommitted `.tmp/browser-screenshots/`):

```bash
SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 \
SERFBOUND_SPAU_PA="../serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA" \
npm run capture:local:screenshots
```

## Static Release Commands

Build and inspect the static artifact:

```bash
npm run release:static
```

Serve and verify the static artifact under a path mount:

```bash
npm run test:release:static
```

The release artifact is `serfbound/dist/`. It is static browser output and must
not contain original data, .NET assemblies, native runtime files, desktop
launchers, installers, or app bundles.

See `docs/static-hosting-release.md` for hosting and cache policy.

## PMO Flow

Before shipping a roadmap story:

1. Read the story file under `pm/roadmap/serfbound/phase-*/`.
2. Make the code/docs change.
3. Run the relevant documented commands and read the output.
4. Add or update `evidence-story-{n}.md` with command output summaries and
   artifact paths.
5. Flip the story status to `done`.
6. Update `current-phase-status.md`, `pm/roadmap/serfbound/README.md`, and any
   affected adoption or release docs in the same commit.
7. Let the PMO pre-commit hook run normally. Do not use `--no-verify`.

The pre-commit hook requires `.tmp/CONTRACT.md` with all seven PMO checkboxes
set to `[x]`. If a story flips to `done`, its matching evidence file must ship
in the same commit.

## Current Release Limits

The current release path proves the first browser slice only: import, start,
select, build one flag, save, reload, resume, reset, and release packaging. Full
original gameplay, audio, AI, multiplayer, original save compatibility, and
physical-device certification remain outside this slice until future stories
add evidence.

## The complete-game module map (v0.1.0)

`@serfbound/engine` (deterministic, DOM-free):
- `map-generator` — the classic generator (fixture parity) and map data
  tables; `game-world` — flags/roads/buildings/territory/conquest;
  `pathfinder` — A* road routing; `serfs` — the serf state machine,
  transport, professions, construction, combat; `inventory` — castle
  stock and the supplies presets; `missions` — the 31-mission campaign;
  `ai` — the classic AI (replayable world actions, decision logs);
  `dos-savegame` — the original .SAV reader; `local-game`/`simulation` —
  game state, snapshots, world-action replay; `commands` — the pointer
  command router.

`@serfbound/assets` (decode-only, no bundled data):
- `dos-sprites` — the .PA archive and sprite payload decoders;
  `terrain-tiles` — triangle composition; `serf-sprites` — animation
  table and player-color torsos; `sprite-atlas` — runtime packing;
  `ui-art` — fonts/icons/frames/cursor/logo; `audio-sfx` — DOS clips;
  `audio-xmi` — XMI music parsing.

`@serfbound/app` (browser shell):
- `render-layer-scene` — decoded assets and the WebGL2 renderer;
  `landscape-scene` — the live world scene with the authentic chrome;
  `panel-bar`/`popup`/`init-screen` — the original interface logic;
  `audio` — the gesture-gated WebAudio service; the IndexedDB stores;
  `main` — the shell, input, AI drivers, autosave, error intake, and
  the service-worker registration.

## Running everything

- `npm run test:unit` — the CI engine/app suites (170+ tests, data-free).
- `npm run test:browser` — Playwright: founding e2e through the
  authentic UI, mobile touch play, PWA offline, shell recovery.
- `npm run measure:performance` / `npm run measure:scale` — the recorded
  performance baselines.
- `SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 SERFBOUND_SPAU_PA=... npm run
  test:local:assets` — opt-in real-data decode checks.
- `npm run ci:release` — the full data-free release gate set.

Releases: tag `serfbound-v*` (see `docs/static-hosting-release.md`).
