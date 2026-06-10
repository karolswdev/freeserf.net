# Evidence - SB-9-03 - Write Player And Developer Docs

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `serfbound/docs/README.md` - adds a short documentation index.
- `serfbound/docs/player-guide.md` - documents player import, start, save,
  load, reset, troubleshooting, local-data requirement, and browser-origin
  storage behavior.
- `serfbound/docs/developer-guide.md` - documents setup, package boundaries,
  CI-safe tests, local/manual asset checks, oracle fixtures, PMO story/evidence
  flow, release commands, and current release limits.
- `serfbound/scripts/check-docs.mjs` - verifies required docs topics and blocks
  explicit phrases that would imply bundled/hosted original data, .NET runtime,
  desktop launcher, or original executable requirements.
- `serfbound/package.json` and `serfbound/README.md` - add `npm run test:docs`
  and include it in `npm run ci:release`.
- PMO status/story files and `pm/roadmap/serfbound/README.md` - mark SB-9-03
  done and open SB-9-04.

## Behavior protected

- Player docs state that Serfbound does not include, host, sell, download, or
  redistribute original DOS/Amiga game data.
- Player docs explain that players provide their own local `SPAU.PA` through
  `Import data` and that the browser stores imported data in origin-scoped
  IndexedDB.
- Player docs explain `Start game`, `Build flag`, `Save game`, `Load game`,
  `Clear save`, `Clear data`, and storage troubleshooting states.
- Developer docs separate CI-safe tests from opt-in local/manual asset checks.
- Developer docs point to CI-safe oracle fixtures as data and keep reference
  tools out of product runtime architecture.
- Developer docs describe the PMO evidence/story flow and the pre-commit
  contract instead of relying on informal process memory.

## Baseline command

Command:

```bash
cd serfbound
source ~/.nvm/nvm.sh
nvm use
env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm run ci:release
cd ..
git diff --check
```

Output summary:

```text
Node v22.21.0 / npm v11.6.2 selected from serfbound/.nvmrc.
46 CI-safe unit/parity tests passed.
5 Chromium browser smoke/recovery tests passed.
serfbound-boundaries-ok
serfbound-release-artifact-ok: inspected 3 static files in dist/.
serfbound-static-hosting-ok: served dist at /serfbound/, imported generated SPAU.PA, and restored IndexedDB state after reload.
serfbound-docs-ok: player, developer, and static hosting docs cover required release topics.
serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
git diff --check produced no output.
```

## Manual walkthrough equivalent

The player guide was checked against current browser test and source evidence:

- `serfbound/tests/browser/static-shell.spec.ts` proves the documented clean
  import/start/build/save/load/clear path, corrupt imported-data reset, corrupt
  save reset, and quota/write failure feedback.
- `serfbound/packages/app/src/main.ts` defines the documented UI labels and
  IndexedDB-backed `Clear save` versus `Clear data` behavior.
- `serfbound/docs/static-hosting-release.md` already documents the hosted-origin
  and cache/update behavior that the player guide references.

## Release gate

`npm run ci:release` now includes `npm run test:docs`, so GitHub Actions checks
the docs coverage in the branch release gate.
