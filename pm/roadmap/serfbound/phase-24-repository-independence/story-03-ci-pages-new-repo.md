# SB-24-03 — CI and Pages in the New Repository

- **Project:** serfbound
- **Phase:** 24
- **Status:** backlog
- **Depends on:** SB-24-02
- **Unblocks:** SB-24-04
- **Owner:** unassigned

## Problem

The standalone repository must police and publish itself: the CI
workflow runs the data-free gates on every push, and the Pages release
path deploys version tags — verified by actual runs, not by copied
YAML.

## Scope

- **In:** The CI workflow adapted to root-level paths, the Pages
  workflow adapted (tag trigger, version stamp), a verification run of
  each (a push run and a tag or workflow-dispatch run), badges/links in
  the README.
- **Out:** The zero-.NET guard and the old-repo handoff (SB-24-04).

## Acceptance criteria

- [ ] The CI workflow completes green on a real push to the new
  repository.
- [ ] The Pages workflow completes green on a real trigger and the
  site serves the build.
- [ ] No workflow references the old repository's layout.

## Test plan

- **Unit:** n/a (workflow story).
- **Integration / e2e:** The workflow runs themselves (`gh run watch`).
- **Manual / device:** The deployed Pages URL loads.
- **Design handoff:** Run URLs in the evidence.

## Notes / open questions

- Preserves: the data-free CI principle (no original assets anywhere
  near hosted runners).
- Browser boundary: none new.
- .NET reference use: none.
- Phase gate advanced: exit criterion 3.
