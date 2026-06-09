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
npm run check:boundaries
```

`npm run build` compiles all packages with TypeScript project references.
`npm run check:boundaries` verifies that package manifests do not introduce
desktop wrappers, .NET runtimes, native launchers, or forbidden local asset
payload dependencies.

## Fixture Policy

Phase 2 tests must consume Phase 1 oracle fixtures as data, following
`pm/roadmap/serfbound/adoption/oracle-fixture-contract.md`. Product code must
not import or execute `pm/roadmap/serfbound/reference-tools/`.
