# Phase 2 — Browser Foundation

**Last updated:** 2026-06-09.

## Goal

Create the pure-browser development foundation: build system, test runner,
package layout, CI shape, runtime boundaries, and deployment skeleton.

## Scope

- **In:** Web stack decision implementation, package/workspace scaffold, unit
  test runner, browser test runner, static app shell, CI without original data,
  lint/type checks, and repo layout.
- **Out:** Game logic port, asset parser, renderer implementation, desktop
  wrappers, .NET product code, or native companions.

## Non-negotiable constraints

- Final product code is pure browser.
- No .NET product runtime, desktop wrapper, native launcher, local companion
  process, or browser shell around a desktop runtime.
- Original DOS/Amiga data is user-provided only; Serfbound does not commit,
  host, bundle, or redistribute it.

## Exit criteria (evidence required)

- [ ] `npm`/web-tooling commands build and test the browser workspace.
- [ ] CI can run without local assets.
- [ ] The app shell opens in a browser and proves the deployment model is static
  or otherwise pure browser.
- [ ] Runtime boundaries are documented: engine, assets, rendering, UI, audio,
  persistence, worker boundary.
- [ ] No desktop wrapper or .NET runtime appears in product dependencies.

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-2-01 | Scaffold pure-browser workspace | ready | story-01-scaffold-browser-workspace.md | — |
| SB-2-02 | Add CI-safe test spine | backlog | story-02-ci-safe-test-spine.md | — |
| SB-2-03 | Define runtime module boundaries | backlog | story-03-runtime-module-boundaries.md | — |
| SB-2-04 | Prove static browser app shell | backlog | story-04-static-browser-shell.md | — |

## Where we are

Phase 2 is ready. Phase 0 selected the TypeScript-first browser runtime, and
Phase 1 completed the oracle target list, CI-safe fixtures, local/manual
metadata output, and fixture contract. The next responsible move is SB-2-01:
scaffold the pure-browser workspace and repair or replace the broken local
Node/npm toolchain.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Toolchain work becomes unbounded | medium | Keep build/test/app shell minimal | No oracle fixture can be consumed by the end of the phase |
| Product sneaks in native runtime dependencies | high | Audit dependencies in acceptance criteria | Normal play needs more than a browser |
| CI depends on local assets | high | Separate data-free tests from local/manual checks | CI fails without `serfbound-local-data/` |

## Decisions made (this phase)

- 2026-06-09 — Start Phase 2 after Phase 1 final audit — use Phase 1 fixtures
  and `oracle-fixture-contract.md` as test-spine inputs; SB-2-01 is the first
  ready story.

## Decisions deferred

- Monorepo package names — resolve during SB-2-01 — default to names under
  `serfbound/*` until publishability matters.
- Local browser toolchain repair — resolve during SB-2-01 — Homebrew `node` and
  `npm` currently fail to load `libllhttp.9.3.dylib`.
