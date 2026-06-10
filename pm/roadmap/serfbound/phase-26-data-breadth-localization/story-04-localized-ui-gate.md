# SB-26-04 — Localized UI Gate

- **Project:** serfbound
- **Phase:** 26
- **Status:** backlog
- **Depends on:** SB-26-03
- **Unblocks:** SB-27-01
- **Owner:** unassigned

## Problem

The phase gates on a player switching language and seeing the whole
interface follow, rendered from their own data's font — plus the honest
record of what the original glyph set cannot carry.

## Scope

- **In:** Language selection in the shell (persisted), full-UI sweep in
  the second language with real-data captures, popup/panel layout audit
  for longer strings, the extended-script font decision record, full
  gate rerun, phase final summary.
- **Out:** Additional languages beyond the proving pair (recorded as
  community follow-ups).

## Acceptance criteria

- [ ] Language switch persists and the in-game UI follows everywhere the
  e2e touches.
- [ ] Longer translated strings fit or wrap per the audited layouts.
- [ ] The extended-script decision record ships; all standing gates
  rerun green.

## Test plan

- **Unit:** Full CI suite rerun.
- **Integration / e2e:** Founding e2e in the second language.
- **Manual / device:** Real-data captures in both languages via the
  visual gate.
- **Design handoff:** Artifact set under the phase folder.

## Notes / open questions

- Preserves: original-font rendering limits, honestly recorded.
- Browser boundary: persistence (language setting).
- .NET reference use: none.
- Phase gate advanced: exit criterion 4 (phase close).
