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

- [x] `npm`/web-tooling commands build and test the browser workspace.
- [x] CI can run without local assets.
- [x] The app shell opens in a browser and proves the deployment model is static
  or otherwise pure browser.
- [x] Runtime boundaries are documented: engine, assets, rendering, UI, audio,
  persistence, worker boundary.
- [x] No desktop wrapper or .NET runtime appears in product dependencies.

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-2-01 | Scaffold pure-browser workspace | done | story-01-scaffold-browser-workspace.md | evidence-story-01.md |
| SB-2-02 | Add CI-safe test spine | done | story-02-ci-safe-test-spine.md | evidence-story-02.md |
| SB-2-03 | Define runtime module boundaries | done | story-03-runtime-module-boundaries.md | evidence-story-03.md |
| SB-2-04 | Prove static browser app shell | done | story-04-static-browser-shell.md | evidence-story-04.md |

## Where we are

Phase 2 is complete. The final audit is recorded in `final-summary.md` and
links every shipped story, evidence file, command, known limitation, and
deferred item. Phase 3 is ready to start with SB-3-01: port deterministic
numeric/random rules against the RNG oracle fixture.

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
- 2026-06-09 — Use npm workspaces under `serfbound/` with packages
  `@serfbound/app`, `@serfbound/engine`, `@serfbound/assets`, and
  `@serfbound/test-support` — this keeps the browser runtime separate from the
  existing C# reference tree — SB-2-01.
- 2026-06-09 — Use nvm Node `22.21.0` for Phase 2 commands because Homebrew
  Node `25.9.0` fails to load `libllhttp.9.3.dylib`; `.nvmrc` records the
  working local toolchain — SB-2-01.
- 2026-06-09 — Use Node's built-in test runner for the first CI-safe test spine
  and keep local/manual asset checks under separately named opt-in commands —
  SB-2-02.
- 2026-06-09 — Keep `@serfbound/test-support` test-only and document runtime
  module boundaries before Phase 3-6 implementation starts — SB-2-03.
- 2026-06-09 — Use Vite for the static browser shell and Playwright Chromium
  for the browser smoke/screenshot proof — SB-2-04.

## Decisions deferred

- Package publish/release strategy — defer until Phase 9 unless an earlier
  dependency boundary requires public package metadata.
- Whether to repair Homebrew Node or keep using nvm Node — resolve before Phase
  2 final audit. SB-2-01 proves the workspace with nvm, but Homebrew `node` and
  `npm` still fail to load `libllhttp.9.3.dylib`.
