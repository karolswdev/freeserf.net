# SB-24-04 — Independence Gate and Handoff

- **Project:** serfbound
- **Phase:** 24
- **Status:** done
- **Depends on:** SB-24-03
- **Unblocks:** SB-25-01
- **Owner:** Claude

## Problem

Independence is enforced, not promised: a mechanical zero-.NET guard
joins the new repository's standing gates, the old repository gets its
handoff note (Serfbound moved; this stays as the reference archive),
and the phase closes with the full gate set green in the new home.

## Scope

- **In:** The zero-.NET guard script (no C#/.NET file extensions,
  project files, or toolchain references anywhere in the tree) wired
  into the new repo's boundary checks, the old repository's README
  handoff section and serfbound-workflow retirement, the full standing
  gate rerun in the new repository, the phase final summary (recorded
  in both repositories' PMO copies as the cutover point).
- **Out:** Archiving the old repository (maintainer's later call).

## Acceptance criteria

- [x] The guard fails the build if any .NET artifact appears; it passes
  on the real tree.
- [x] The old repository points to the new one and its serfbound
  workflows are retired.
- [x] All standing gates green in the new repository at the closing
  commit.

## Test plan

- **Unit:** The guard script's own checks in CI.
- **Integration / e2e:** Full suite rerun in the new repository.
- **Manual / device:** n/a.
- **Design handoff:** The cutover record in both repositories.

## Notes / open questions

- Preserves: honest attribution in perpetuity (the guard checks
  tooling, not the acknowledgment).
- Browser boundary: none new.
- .NET reference use: none — that is the point.
- Phase gate advanced: exit criterion 4 (phase close).
