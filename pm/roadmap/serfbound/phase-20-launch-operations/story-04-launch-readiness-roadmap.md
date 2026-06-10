# SB-20-04 — Launch Readiness and Post-Launch Roadmap

- **Project:** serfbound
- **Phase:** 20
- **Status:** done
- **Depends on:** SB-20-03
- **Unblocks:** —
- **Owner:** unassigned

## Problem

The final gate - rerun every standing proof at the release commit, audit the asset/legal boundary, declare launch with evidence, and record where the project goes next (multiplayer first among equals).

## Scope

- **In:** Readiness review rerunning CI, parity fixtures, visual gate, device tests at the release commit; asset/legal boundary audit; launch go/no-go record; post-launch roadmap decision record (multiplayer transport evaluation, Amiga data, localization candidates).
- **Out:** Implementing any post-launch item.

## Acceptance criteria

- [x] All standing gates rerun green at the release commit (evidence linked).
- [x] Boundary audit passes
- [x]  go decision recorded with signatures of evidence.
- [x] Post-launch roadmap records the multiplayer transport decision rationale.

## Test plan

- **Unit:** n/a unless story logic demands it.
- **Integration / Cypress:** Release-path checks where applicable.
- **Manual / device:** Production verification recorded as evidence.
- **Design handoff:** n/a — operational evidence.

## Notes / open questions

- Preserves: the asset/legal boundary and GPL obligations at launch.
- Browser boundary: production hosting, caching, error surfaces.
- .NET reference use: none.
- Phase gate advanced: see phase exit criteria.
