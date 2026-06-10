# SB-7-04 — Verify Playable Loop Manually

- **Project:** serfbound
- **Phase:** 7
- **Status:** done
- **Depends on:** SB-7-01, SB-7-02, SB-7-03, SB-6-04
- **Unblocks:** SB-8-01, SB-8-03, SB-9-04
- **Owner:** unassigned

## Problem

The first playable slice needs evidence that a human can complete the loop, not
just that isolated tests pass. This story turns the slice into auditable manual
evidence.

## Scope

- **In:** Manual script, browser/version notes, local data path, screenshots or
  video, known limitations, and pass/fail summary.
- **Out:** Full release readiness, performance hardening, accessibility audit,
  or broad gameplay parity.

## Acceptance criteria

- [x] Manual script covers import, start game, visible action, save, reload, and
  load.
- [x] Evidence includes browser, OS, viewport, and local asset source metadata.
- [x] Screenshots/video prove the visible loop.
- [x] Known limitations are recorded with phase/story follow-ups.
- [x] Phase 7 can close only if this evidence is complete.

## Test plan

- **Unit:** Run default unit/parity tests before manual verification.
- **Integration / Cypress:** Run browser smoke tests before manual verification.
- **Manual / device:** Execute the full script and store evidence references.
- **Design handoff:** Screenshot/video evidence required.

## Notes / open questions

This is the first end-to-end proof gate. Do not downgrade it to a checklist
without artifacts.

Manual verification artifacts:

- `manual-playable-loop-script.md`
- `manual-playable-loop-report.md`
- `artifacts/story-04-manual-started-desktop.png`
- `artifacts/story-04-manual-flag-saved-desktop.png`
- `artifacts/story-04-manual-loaded-save-desktop.png`
