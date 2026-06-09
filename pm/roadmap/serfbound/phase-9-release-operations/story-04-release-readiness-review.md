# SB-9-04 — Run Release Readiness Review

- **Project:** serfbound
- **Phase:** 9
- **Status:** backlog
- **Depends on:** SB-7-04, SB-8-04, SB-9-01, SB-9-02, SB-9-03
- **Unblocks:** release candidate
- **Owner:** unassigned

## Problem

The final release decision must be evidence-based. Serfbound needs a readiness
review that checks phase gates, tests, browser behavior, asset boundaries, docs,
and known limitations before calling the browser product shippable.

## Scope

- **In:** Release checklist, phase evidence audit, CI result, browser matrix,
  performance snapshot, asset-boundary audit, docs review, and go/no-go
  decision.
- **Out:** New feature implementation, major architecture changes, desktop
  packaging, or post-release roadmap expansion.

## Acceptance criteria

- [ ] Release readiness report exists.
- [ ] Report links evidence for every phase gate from Phase 1 through Phase 9.
- [ ] Report confirms no .NET or desktop runtime artifacts are in product build.
- [ ] Report confirms no original assets are committed or bundled.
- [ ] Known limitations have explicit release notes or blocking follow-ups.

## Test plan

- **Unit:** Run release CI command set.
- **Integration / Cypress:** Run browser smoke/compatibility checks.
- **Manual / device:** Execute release checklist from a clean checkout/profile.
- **Design handoff:** Include screenshots/video from playable and compatibility
  evidence where relevant.

## Notes / open questions

This story is the completion audit for the product, not a place to waive missing
evidence.
