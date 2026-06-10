# Phase 20 — Launch and Live Operations

**Last updated:** 2026-06-10.
**Status:** not started.

## Goal

Ship Serfbound as a public, maintained browser game: a real URL, versioned
releases, honest telemetry-free error intake, contributor docs, and a recorded
post-launch roadmap — with multiplayer as the headline post-launch track.

## Scope

- **In:** Public static hosting deployment with versioned releases and a
  changelog, privacy-respecting error reporting (opt-in, no game data), issue
  intake and triage flow, player/developer documentation refresh for the full
  game, launch readiness review, and the post-launch roadmap decision record
  (multiplayer transport options: WebRTC vs relay server; Amiga data support;
  localization).
- **Out:** Multiplayer implementation; monetization (none — GPL project);
  marketing beyond the README/site.

## Non-negotiable constraints

- The asset/legal boundary holds at launch: no original data hosted, ever;
  GPL obligations of the freeserf lineage respected and documented.
- Launch claims trace to evidence: the readiness review reruns the standing
  gates (CI, parity fixtures, visual gate, device tests) at the release
  commit.

## Exit criteria (evidence required)

- [ ] A public URL serves a versioned release through the documented static
  hosting path with cache-correct headers. (SB-20-01)
- [ ] Errors can be reported (opt-in) with enough context to act, and issues
  flow through a documented intake. (SB-20-02)
- [ ] Player and contributor docs cover the complete game accurately.
  (SB-20-03)
- [ ] A launch readiness review passes on the release commit and the
  post-launch roadmap (multiplayer decision included) is recorded. (SB-20-04)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-20-01 | Public release pipeline and versioning | backlog | story-01-public-release-pipeline.md | — |
| SB-20-02 | Error reporting and issue intake | backlog | story-02-error-reporting-intake.md | — |
| SB-20-03 | Full-game documentation refresh | backlog | story-03-documentation-refresh.md | — |
| SB-20-04 | Launch readiness and post-launch roadmap | backlog | story-04-launch-readiness-roadmap.md | — |

## Where we are

Scaffolded; starts after Phase 19 closes.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Legal/asset boundary scrutiny at launch | medium | Boundary audit in readiness review; GPL/licensing docs | Any original data reachable from the host |
| Launch rot (docs/CI drift from reality) | medium | Readiness review reruns gates at the release commit | Claims without rerun evidence |
| Post-launch direction vacuum | low | Roadmap decision record ships in SB-20-04 | — |

## Decisions made (this phase)

- none yet.

## Decisions deferred

- Multiplayer transport choice (decided as part of SB-20-04's roadmap record).
