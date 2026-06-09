# SB-0-01 — Name And Charter Serfbound

- **Project:** serfbound
- **Phase:** 0
- **Status:** done
- **Depends on:** none
- **Unblocks:** SB-0-02, SB-0-03, SB-0-04, SB-0-05
- **Owner:** Codex

## Problem

The rewrite needs a durable identity before planning artifacts can stabilize.
The name must be separate enough from the original commercial game to avoid
confusing the product direction, but close enough to signal the worker-road
settlement engine being built.

## Scope

- **In:** Project name, slug, story prefix, roadmap README, phase index, and
  user-stated charter.
- **Out:** Logo, visual identity, domain search, package publishing names, or
  legal trademark clearance.

## Acceptance criteria

- [x] `pm/roadmap/serfbound/README.md` uses `Serfbound` as the project title.
- [x] The roadmap records `serfbound` as the slug and `SB` as the story prefix.
- [x] The Phase 0 status file records the 2026-06-09 naming decision.
- [x] The roadmap states that Serfbound is a browser-native rewrite track, not
  a .NET product-runtime continuation.
- [x] The roadmap records pure-browser/no-.NET/no-desktop as a hard constraint.

## Test plan

- **Unit:** n/a - planning artifact only.
- **Integration / Cypress:** n/a.
- **Manual / device:** Read `pm/roadmap/serfbound/README.md` and
  `pm/roadmap/serfbound/phase-0-setup/current-phase-status.md` for consistency.

## Notes / open questions

`Serfbound` is accepted as the working project name. Future branding work can
still validate package names, domain availability, and visual identity. This
story also records that the final product is not a desktop app and not .NET.
