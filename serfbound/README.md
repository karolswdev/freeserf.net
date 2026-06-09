# Serfbound Browser Workspace

Serfbound is the pure-browser implementation workspace for the PMO roadmap at
`pm/roadmap/serfbound/`.

This workspace starts TypeScript-first, matching
`pm/roadmap/serfbound/adoption/runtime-architecture-decision.md`. It must not
add .NET product code, desktop wrappers, native launchers, Electron/Tauri,
local companion processes, or bundled original DOS/Amiga assets.

## Packages

| Package | Role | Boundary |
|---|---|---|
| `@serfbound/engine` | Deterministic simulation primitives | No direct DOM, storage, audio, rendering, or local file APIs. |
| `@serfbound/assets` | Browser asset import boundaries | May define file/import contracts; must not include original asset payloads. |
| `@serfbound/test-support` | Fixture loading and validation helpers | Reads committed CI-safe oracle fixture metadata as data. |
| `@serfbound/app` | Browser app shell integration point | May depend on engine/assets/test-support and browser APIs. |

## Commands

Use the nvm Node version from `.nvmrc` until the broken Homebrew Node install is
repaired:

```bash
source ~/.nvm/nvm.sh
nvm use
npm install
npm run build
npm test
npm run check:boundaries
```

`npm run build` compiles all packages with TypeScript project references.
`npm test` runs the default CI-safe test spine. It builds the workspace and
uses Node's built-in test runner against committed fixtures under
`pm/roadmap/serfbound/reference-fixtures/ci/`; it must pass with local asset
environment variables unset and must not read `serfbound-local-data/`.
`npm run check:boundaries` verifies that package manifests do not introduce
desktop wrappers, .NET runtimes, native launchers, or forbidden local asset
payload dependencies.

Local/manual asset checks are opt-in only. Keep them out of `npm test` and
`npm run test:ci`; use clearly named commands such as
`npm run test:local:assets` for checks that require user-provided original data.

## Fixture Policy

Phase 2 tests must consume Phase 1 oracle fixtures as data, following
`pm/roadmap/serfbound/adoption/oracle-fixture-contract.md`. Product code must
not import or execute `pm/roadmap/serfbound/reference-tools/`.
