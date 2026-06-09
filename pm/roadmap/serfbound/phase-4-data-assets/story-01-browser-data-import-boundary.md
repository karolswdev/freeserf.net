# SB-4-01 — Implement Browser Data Import Boundary

- **Project:** serfbound
- **Phase:** 4
- **Status:** ready
- **Depends on:** SB-2-04, SB-0-05
- **Unblocks:** SB-4-02, SB-4-03, SB-7-01
- **Owner:** unassigned

## Problem

Players must be able to provide their own original data in the browser. The
import boundary must support local files without turning local assets into
tracked project data or requiring a desktop helper.

## Scope

- **In:** Browser file-selection path for `.PA`, validation for accepted file
  names, missing/invalid-data state, local/manual test path, and docs.
- **Out:** Directory-picker polish, full parser, IndexedDB persistence, cloud
  upload, native import tools, or committing original data.

## Acceptance criteria

- [ ] Browser UI accepts a local `.PA` file selection.
- [ ] `SPAU.PA` is accepted as a supported DOS source name.
- [ ] Invalid or missing files produce recoverable UI state.
- [ ] Local asset tests are opt-in and excluded from CI.
- [ ] No original data is copied into tracked paths.

## Test plan

- **Unit:** Test filename/type validation and missing-data states.
- **Integration / Cypress:** Browser import smoke test with a generated fake file
  or local/manual asset flag.
- **Manual / device:** Import ignored local `SPAU.PA` from
  `serfbound-local-data/sources/`.
- **Design handoff:** n/a - import shell only.

## Notes / open questions

Start with direct file import. Directory picker can follow if it clearly improves
player ergonomics.
