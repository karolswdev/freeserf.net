# Evidence — SB-7-04 — Verify Playable Loop Manually

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `pm/roadmap/serfbound/phase-7-playable-slice/manual-playable-loop-script.md`
  - auditable manual script for import, start, build, save, reload, and load.
- `pm/roadmap/serfbound/phase-7-playable-slice/manual-playable-loop-report.md`
  - environment metadata, local asset metadata, observed final state, and known
  limitations.
- `pm/roadmap/serfbound/phase-7-playable-slice/artifacts/story-04-manual-started-desktop.png`
  - screenshot after importing local `SPAU.PA` and starting a game.
- `pm/roadmap/serfbound/phase-7-playable-slice/artifacts/story-04-manual-flag-saved-desktop.png`
  - screenshot after building a flag and saving the game.
- `pm/roadmap/serfbound/phase-7-playable-slice/artifacts/story-04-manual-loaded-save-desktop.png`
  - screenshot after browser reload and saved-game load.
- `pm/roadmap/serfbound/phase-7-playable-slice/final-summary.md`
  - closes Phase 7 with shipped stories, exit-criteria audit, commands,
  decisions, limitations, and Phase 8 handoff.
- `pm/roadmap/serfbound/phase-7-playable-slice/story-04-playable-loop-verification.md`
  - marks SB-7-04 done.
- `pm/roadmap/serfbound/phase-7-playable-slice/current-phase-status.md`,
  `pm/roadmap/serfbound/README.md`, and
  `pm/roadmap/serfbound/adoption/phase-gate-verification-matrix.md`
  - record Phase 7 completion and Phase 8 readiness.

## Behavior protected

- A browser user can import local user-owned `SPAU.PA`.
- A local game starts from imported data and renders an imported terrain scene.
- A selected map tile can receive the visible first action: `Build flag`.
- Saving persists the running local game snapshot in browser persistence.
- Reloading the browser restores imported data and exposes the saved game.
- Loading restores the built flag state and redraws it.
- The path remains pure browser product code: no .NET runtime, desktop shell,
  native launcher, local companion process, or bundled original data.

## Manual output

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm test && npm run check:boundaries && npm run test:local:assets && SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 SERFBOUND_SPAU_PA="../serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA" npm run test:local:assets && cd .. && git diff --check'
```

Output summary:

```text
44 unit tests passed.
2 chromium browser tests passed.
serfbound-boundaries-ok
serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
serfbound-local-asset-tests-ok: parsed SPAU.PA catalog and matched Phase 1 oracle metadata plus typed catalog and render-layer scene facts.
git diff --check passed with no output.
```

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && npm run build:web'
```

Output summary:

```text
TypeScript build passed.
Vite production build passed.
```

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && npm run preview -- --port 4183'
```

Output summary:

```text
Vite preview served the built app at http://127.0.0.1:4183/.
```

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && node --input-type=module <manual Playwright script>'
```

Output summary:

```text
browserVersion=148.0.7778.96
viewport=1280x900
assetPath=/Users/karol/dev/code/settlers-clone/freeserf.net/serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA
visible data=Data imported
visible game=Running
visible source=Imported data
visible map=Imported terrain
visible save=Game loaded
visible save detail=1 built structures restored.
data-serfbound-runtime=browser
data-serfbound-game-state=running
data-serfbound-local-game-state=running
data-serfbound-local-save-state=loaded
data-serfbound-built-structure-count=1
data-serfbound-renderer=webgl2
data-serfbound-scene-source=dos-pa-catalog
nonblank WebGL pixels=144941
```

## Local asset metadata

Command:

```bash
zsh -lc 'ls -lh serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA && shasum -a 256 serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA'
```

Output summary:

```text
SPAU.PA size: 1.2M
SHA-256: 4a652471c4185d324b16fadd736f2464210df5d8938136aaa0ccc4a43c790ca2
```

## Environment metadata

Command:

```bash
zsh -lc 'sw_vers && uname -a'
```

Output summary:

```text
macOS 26.2, build 25C56
Darwin 25.2.0 arm64
```

## Screenshot evidence

The screenshots were inspected after capture:

- `artifacts/story-04-manual-started-desktop.png` shows imported data, running
  game state, imported terrain, and enabled save controls.
- `artifacts/story-04-manual-flag-saved-desktop.png` shows the built flag on
  the map, selected tile details, `Flag built`, and `Game saved`.
- `artifacts/story-04-manual-loaded-save-desktop.png` shows the page after
  reload/load with the flag still rendered and `Game loaded`.
