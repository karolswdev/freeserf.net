# SB-20-03 — Full-Game Documentation Refresh

- **Project:** serfbound
- **Phase:** 20
- **Status:** done
- **Depends on:** SB-20-02
- **Unblocks:** SB-20-04
- **Owner:** unassigned

## Problem

The Phase 9 docs describe a one-flag slice. Launch docs must cover the real game - import, campaign, economy, military, saves, audio, mobile, offline - plus contributor docs reflecting ten more phases of architecture.

## Scope

- **In:** Player guide rewrite for full gameplay, developer guide update (architecture map, fixture/oracle catalog, phase history pointers), licensing/asset-boundary page, doc checks (test
- **Out:** docs) extended to new topics.

## Acceptance criteria

- [x] Wiki/community infrastructure.:Player guide covers the complete loop accurately (doc checks extended).
- [x] Developer guide maps the final architecture and test strategy.
- [x] Licensing and asset-boundary documentation reviewed.

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
