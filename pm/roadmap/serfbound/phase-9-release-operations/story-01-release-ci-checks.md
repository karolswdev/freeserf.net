# SB-9-01 — Add Release CI Checks

- **Project:** serfbound
- **Phase:** 9
- **Status:** done
- **Depends on:** SB-2-02, SB-8-04
- **Unblocks:** SB-9-04
- **Owner:** unassigned

## Problem

Release work needs repeatable checks that do not depend on local original data.
CI must prove build, tests, parity, and packaging without weakening the asset
boundary.

## Scope

- **In:** CI workflow, build, lint/type checks, unit tests, data-free parity
  tests, browser smoke tests, and artifact check.
- **Out:** Local `SPAU.PA` checks in CI, deployment automation, broad benchmark
  matrix, or upstream PR process.

## Acceptance criteria

- [x] CI runs on the Serfbound branch/fork.
- [x] CI passes without `serfbound-local-data/`.
- [x] CI includes data-free oracle/parity checks.
- [x] CI includes browser smoke or equivalent app-shell check.
- [x] Failure output links to the relevant command or log.

## Test plan

- **Unit:** Run CI-equivalent command locally.
- **Integration / Cypress:** Run browser smoke test locally and in CI.
- **Manual / device:** Inspect GitHub Actions result.
- **Design handoff:** n/a - CI evidence.

## Notes / open questions

Release CI is scoped to data-free browser checks. Local `SPAU.PA` validation
remains opt-in and is intentionally skipped in CI.
