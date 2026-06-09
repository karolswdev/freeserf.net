# Phase 9 — Release Operations

**Last updated:** 2026-06-09.

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

- [ ] CI runs build, lint, unit tests, browser tests, and data-free parity tests.
- [ ] Release packaging is browser/static-web oriented and contains no .NET or
  desktop runtime artifacts.
- [ ] Player docs explain import, save, reset, troubleshooting, and local asset
  requirements.
- [ ] Developer docs explain oracle fixtures, local asset checks, and PMO flow.
- [ ] Release checklist records browser matrix, performance snapshot, and known
  limitations.

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-9-01 | Add release CI checks | backlog | story-01-release-ci-checks.md | — |
| SB-9-02 | Define static hosting release path | backlog | story-02-static-hosting-release-path.md | — |
| SB-9-03 | Write player and developer docs | backlog | story-03-player-developer-docs.md | — |
| SB-9-04 | Run release readiness review | backlog | story-04-release-readiness-review.md | — |

## Where we are

Phase 9 is not started. It should only begin once Phase 8 has hardening
evidence.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Release process depends on local copyrighted assets | high | Keep CI data-free and local checks opt-in | Release cannot build without `serfbound-local-data/` |
| Docs understate data ownership requirements | medium | Make import/local-data flow explicit | User expects bundled original game data |
| PMO process becomes stale | medium | Keep stories/evidence tied to release checklist | Release notes cannot trace shipped behavior to evidence |

## Decisions made (this phase)

- none yet.

## Decisions deferred

- Hosting target — resolve in SB-9-02 — default to static hosting if browser
  import/persistence works client-side.
