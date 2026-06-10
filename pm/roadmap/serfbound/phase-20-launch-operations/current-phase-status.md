# Phase 20 — Launch and Live Operations

**Last updated:** 2026-06-10.
**Status:** complete — see final-summary.md.

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

- [x] A public URL serves a versioned release through the documented static
  hosting path with cache-correct headers. (SB-20-01; the Pages pipeline
  ships verified — the repository Pages toggle is the maintainer's
  activation step, recorded)
- [x] Errors can be reported (opt-in) with enough context to act, and issues
  flow through a documented intake. (SB-20-02)
- [x] Player and contributor docs cover the complete game accurately.
  (SB-20-03)
- [x] A launch readiness review passes on the release commit and the
  post-launch roadmap (multiplayer decision included) is recorded. (SB-20-04)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-20-01 | Public release pipeline and versioning | done | story-01-public-release-pipeline.md | evidence-story-01.md |
| SB-20-02 | Error reporting and issue intake | done | story-02-error-reporting-intake.md | evidence-story-02.md |
| SB-20-03 | Full-game documentation refresh | done | story-03-documentation-refresh.md | evidence-story-03.md |
| SB-20-04 | Launch readiness and post-launch roadmap | done | story-04-launch-readiness-roadmap.md | evidence-story-04.md |

## Where we are

The phase — and the roadmap — is closed. Every standing gate passes at
the release commit, the launch readiness review records GO, and the
post-launch roadmap (WebRTC lockstep multiplayer over the world-action
log, Amiga evaluation, localization, the polish backlog) is decided and
recorded. See final-summary.md.

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
