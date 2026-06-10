# SB-20-01 — Public Release Pipeline and Versioning

- **Project:** serfbound
- **Phase:** 20
- **Status:** done
- **Depends on:** SB-19-05
- **Unblocks:** SB-20-02
- **Owner:** unassigned

## Problem

Phase 9 defined the static hosting path; launch makes it real - an actual public host, semantic versions, changelogs, and a repeatable deploy that CI gates.

## Scope

- **In:** Host selection/config per the static hosting doc, versioned release tagging and changelog flow, deploy automation gated on ci
- **Out:** release, cache-header verification against the documented policy, rollback plan.

## Acceptance criteria

- [x] Custom domains/CDN tuning beyond correctness.:A tagged release deploys to a public URL through the documented path.
- [x] Cache headers verified in production config.
- [x] Rollback to the previous version is demonstrated.

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
