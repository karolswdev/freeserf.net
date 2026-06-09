# SB-2-02 — Add CI-Safe Test Spine

- **Project:** serfbound
- **Phase:** 2
- **Status:** done
- **Depends on:** SB-2-01, SB-1-04
- **Unblocks:** SB-3-04, SB-4-02, SB-9-01
- **Owner:** Codex

## Problem

The project must be testable without original assets. A CI-safe test spine gives
every future phase a place to prove behavior without depending on local
`serfbound-local-data/`.

## Scope

- **In:** Unit test runner, fixture validation test, one data-free oracle
  consumption test, CI command shape, and local/manual test convention.
- **Out:** Full GitHub Actions hardening, browser visual tests, asset-required
  checks in CI, or release packaging.

## Acceptance criteria

- [x] A test command runs without `serfbound-local-data/`.
- [x] A fixture validation test reads at least one CI-safe oracle fixture.
- [x] Local/manual asset tests are clearly named and excluded from default CI.
- [x] The command is documented in the relevant phase status or workspace docs.
- [x] Failing tests produce actionable output.

## Test plan

- **Unit:** Run the default test command with local asset env vars unset.
- **Integration / Cypress:** n/a unless selected as the browser test spine.
- **Manual / device:** Confirm local/manual tests are opt-in.
- **Design handoff:** n/a - non-visual.

## Notes / open questions

Shipped `npm test` / `npm run test:ci` using Node's built-in test runner. The
default test command builds the TypeScript workspace, reads committed CI-safe
fixtures, validates fixture headers, proves unsupported schema versions fail
with explicit errors, and consumes concrete RNG/map facts. Local/manual asset
checks are named separately as `npm run test:local:assets` and are not part of
the default CI-safe path.
