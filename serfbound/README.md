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
| `@serfbound/app` | Browser app shell integration point | May depend on engine/assets and browser APIs; must not depend on test-support. |

## Commands

Use the nvm Node version from `.nvmrc` until the broken Homebrew Node install is
repaired:

```bash
source ~/.nvm/nvm.sh
nvm use
npm install
npm run build
npm run build:web
npm run release:static
npm run test:release:static
npm test
npm run check:boundaries
```

`npm run build` compiles all packages with TypeScript project references.
`npm run build:web` compiles the package graph and writes a static browser
artifact to `serfbound/dist/` with Vite.
`npm run release:static` builds the browser artifact and inspects it for
forbidden original-data, .NET, native runtime, and desktop packaging output.
`npm run test:release:static` serves `dist/` from a local static host under
`/serfbound/`, checks cache headers, imports generated `SPAU.PA` data through
the browser, and verifies IndexedDB restore after reload. See
`docs/static-hosting-release.md` for the release path.
`npm test` runs the default CI-safe test spine. It builds the workspace, uses
Node's built-in test runner against committed fixtures under
`pm/roadmap/serfbound/reference-fixtures/ci/`, builds the static browser shell,
and runs the Playwright smoke test. It must pass with local asset environment
variables unset and must not read `serfbound-local-data/`.
`npm run check:boundaries` verifies that package manifests do not introduce
desktop wrappers, .NET runtimes, native launchers, or forbidden local asset
payload dependencies.

To inspect the static shell locally:

```bash
npm run build:web
npm run preview -- --port 4173
```

Open `http://127.0.0.1:4173/`. If Playwright reports a missing browser binary,
run `npx playwright install chromium` once in this workspace.

Local/manual asset checks are opt-in only. Keep them out of `npm test` and
`npm run test:ci`; use clearly named commands such as
`npm run test:local:assets` for checks that require user-provided original data.

## Fixture Policy

Phase 2 tests must consume Phase 1 oracle fixtures as data, following
`pm/roadmap/serfbound/adoption/oracle-fixture-contract.md`. Product code must
not import or execute `pm/roadmap/serfbound/reference-tools/`.
