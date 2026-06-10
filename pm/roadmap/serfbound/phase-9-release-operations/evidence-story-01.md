# Evidence - SB-9-01 - Add Release CI Checks

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `.github/workflows/serfbound-ci.yml` - adds a browser-native GitHub Actions
  workflow for `main`, `master`, and `serfbound/**` branches plus pull requests
  targeting those branches.
- `serfbound/package.json` - adds `npm run ci:release` and
  `npm run check:release-artifact`.
- `serfbound/scripts/check-release-artifact.mjs` - inspects the generated static
  build for forbidden desktop/runtime/original-data artifact paths and runtime
  references.
- PMO status/story files and `pm/roadmap/serfbound/README.md` - mark SB-9-01
  done and open SB-9-02.

## Behavior protected

- Release CI runs without `serfbound-local-data/`.
- CI uses Node/npm and browser tooling only; it does not install .NET, build a
  desktop app, or require local original assets.
- `npm run ci:release` runs the data-free unit/parity suite, browser smoke
  tests, module boundary checks, static artifact inspection, and the local asset
  skip path.
- GitHub Actions failure output points to the workflow run URL and local
  reproduction command in the job summary.

## CI workflow

Workflow path:

```text
.github/workflows/serfbound-ci.yml
```

Trigger summary:

```text
workflow_dispatch
push branches: main, master, serfbound/**
pull_request base branches: main, master, serfbound/**
path filters: .github/workflows/serfbound-ci.yml, serfbound/**, pm/roadmap/serfbound/**
```

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
serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
git diff --check produced no output.
```

## GitHub Actions check

The workflow is expected to run after this commit is pushed to
`origin/serfbound/pmo-bootstrap`. Inspect with:

```bash
gh run list --repo karolswdev/freeserf.net --workflow "Serfbound CI" --branch serfbound/pmo-bootstrap
```
