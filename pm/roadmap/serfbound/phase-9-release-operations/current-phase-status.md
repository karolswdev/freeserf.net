# Phase 9 — Release Operations

**Last updated:** 2026-06-09.
**Status:** complete.

## Goal

Package, document, and operate Serfbound as a maintainable browser product.

## Scope

- **In:** CI/release checks, static hosting path, docs, troubleshooting, license
  and user-owned-data messaging, contribution workflow, issue templates, and
  release evidence.
- **Out:** Desktop release packages, .NET runtime artifacts, major new gameplay
  features, multiplayer, or post-release feature roadmap.

## Non-negotiable constraints

- Final product code is pure browser.
- No .NET product runtime, desktop wrapper, native launcher, local companion
  process, or browser shell around a desktop runtime.
- Original DOS/Amiga data is user-provided only; Serfbound does not commit,
  host, bundle, or redistribute it.

## Exit criteria (evidence required)

- [x] CI runs build/type checks, unit tests, browser tests, and data-free parity tests.
- [x] Release packaging is browser/static-web oriented and contains no .NET or
  desktop runtime artifacts.
- [x] Player docs explain import, save, reset, troubleshooting, and local asset
  requirements.
- [x] Developer docs explain oracle fixtures, local asset checks, and PMO flow.
- [x] Release checklist records browser matrix, performance snapshot, and known
  limitations.

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-9-01 | Add release CI checks | done | story-01-release-ci-checks.md | evidence-story-01.md |
| SB-9-02 | Define static hosting release path | done | story-02-static-hosting-release-path.md | evidence-story-02.md |
| SB-9-03 | Write player and developer docs | done | story-03-player-developer-docs.md | evidence-story-03.md |
| SB-9-04 | Run release readiness review | done | story-04-release-readiness-review.md | evidence-story-04.md |

## Where we are

Phase 9 is complete. SB-9-04 adds the release readiness report, closes the
release checklist, records known limitations, verifies issue intake boundaries,
and marks the first Serfbound browser-slice release candidate ready.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Release process depends on local copyrighted assets | high | Keep CI data-free and local checks opt-in | Release cannot build without `serfbound-local-data/` |
| Docs understate data ownership requirements | medium | Make import/local-data flow explicit | User expects bundled original game data |
| PMO process becomes stale | medium | Keep stories/evidence tied to release checklist | Release notes cannot trace shipped behavior to evidence |

## Decisions made (this phase)

- 2026-06-09 — Release CI runs the Serfbound browser workspace only: npm
  data-free unit/parity tests, Chromium browser smoke tests, boundary checks,
  static artifact inspection, and the local asset skip path. It does not build
  .NET/desktop deliverables or require `serfbound-local-data/` — SB-9-01.
- 2026-06-09 — First release packaging is static hosting: publish
  `serfbound/dist/` to an HTTPS static host, keep original data user-provided via
  browser file import, cache `index.html` with revalidation, and cache hashed
  `assets/*` immutably — SB-9-02.
- 2026-06-09 — Player and developer docs are operational docs, not marketing:
  player docs cover local `SPAU.PA` import, save/load/reset, storage
  troubleshooting, and origin behavior; developer docs cover CI-safe fixtures,
  local/manual asset checks, release commands, and PMO evidence flow — SB-9-03.
- 2026-06-09 — Release readiness passed for the first Serfbound browser-slice
  release candidate after checking CI, compatibility, performance,
  local/manual assets, docs, issue intake, product artifact boundaries, and
  known limitations — SB-9-04.

## Decisions deferred

- none.
