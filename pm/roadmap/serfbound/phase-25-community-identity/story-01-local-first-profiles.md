# SB-25-01 — Local-First Profiles

- **Project:** serfbound
- **Phase:** 25
- **Status:** backlog
- **Depends on:** SB-24-04
- **Unblocks:** SB-25-02
- **Owner:** unassigned

## Problem

Players need a name and a face before any server exists: a local profile
(display name, preferred color, match history) stored next to saves in
IndexedDB, carried into multiplayer handshakes, with no hosted
dependency.

## Scope

- **In:** Profile storage/edit UI, handshake fields for name/color,
  local match history (opponent, result, duration, checksum-verified
  flag), export/import of the profile with the existing data-reset
  flows.
- **Out:** Hosted identity (SB-25-02), discovery (SB-25-03).

## Acceptance criteria

- [ ] A profile persists across reloads and resets only via the
  documented flows.
- [ ] Both peers see each other's profile in a session.
- [ ] Match history records finished online games locally.

## Test plan

- **Unit:** Profile store and handshake field coverage in CI.
- **Integration / e2e:** Two-context session shows exchanged profiles;
  history asserts after game end.
- **Manual / device:** n/a.
- **Design handoff:** Profile UI screenshots under phase artifacts.

## Notes / open questions

- Preserves: local-first, zero-server play.
- Browser boundary: persistence (IndexedDB).
- .NET reference use: none.
- Phase gate advanced: exit criterion 1.
