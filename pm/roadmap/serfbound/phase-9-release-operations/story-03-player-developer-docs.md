# SB-9-03 — Write Player And Developer Docs

- **Project:** serfbound
- **Phase:** 9
- **Status:** done
- **Depends on:** SB-8-03, SB-9-02
- **Unblocks:** SB-9-04
- **Owner:** unassigned

## Problem

Players need clear instructions for importing local data and recovering from
storage issues. Developers need clear instructions for oracle fixtures, PMO
workflow, local asset checks, and release commands.

## Scope

- **In:** Player import/start/save/reset docs, local data requirements, developer
  setup, oracle/parity docs, local asset policy, PMO commit flow, and release
  commands.
- **Out:** Marketing site copy, full historical manual, modding guide, or
  multiplayer operations docs.

## Acceptance criteria

- [x] Player docs explain how to provide local data.
- [x] Player docs explain save/load/reset/troubleshooting.
- [x] Developer docs explain CI-safe vs local/manual tests.
- [x] Developer docs explain PMO story/evidence flow.
- [x] Docs do not imply original assets are bundled or hosted.

## Test plan

- **Unit:** n/a unless docs have lint.
- **Integration / Cypress:** n/a.
- **Manual / device:** Follow docs on a clean browser profile or documented
  equivalent.
- **Design handoff:** n/a - documentation.

## Notes / open questions

Docs are split into player, developer, and static hosting pages under
`serfbound/docs/`. `npm run test:docs` checks required topics and forbidden
asset-hosting implications.
