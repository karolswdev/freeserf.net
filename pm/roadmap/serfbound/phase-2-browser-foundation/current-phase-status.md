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
| SB-2-01 | Scaffold pure-browser workspace | backlog | story-01-scaffold-browser-workspace.md | — |
| SB-2-02 | Add CI-safe test spine | backlog | story-02-ci-safe-test-spine.md | — |
| SB-2-03 | Define runtime module boundaries | backlog | story-03-runtime-module-boundaries.md | — |
| SB-2-04 | Prove static browser app shell | backlog | story-04-static-browser-shell.md | — |

## Where we are

Phase 2 is not started. It depends on Phase 0 runtime decision and Phase 1
oracle fixture contract.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Toolchain work becomes unbounded | medium | Keep build/test/app shell minimal | No oracle fixture can be consumed by the end of the phase |
| Product sneaks in native runtime dependencies | high | Audit dependencies in acceptance criteria | Normal play needs more than a browser |
| CI depends on local assets | high | Separate data-free tests from local/manual checks | CI fails without `serfbound-local-data/` |

## Decisions made (this phase)

- none yet.

## Decisions deferred

- Monorepo package names — resolve during SB-2-01 — default to names under
  `serfbound/*` until publishability matters.
