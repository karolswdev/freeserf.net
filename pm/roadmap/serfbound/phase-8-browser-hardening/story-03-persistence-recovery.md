# SB-8-03 — Harden Persistence Recovery

- **Project:** serfbound
- **Phase:** 8
- **Status:** done
- **Depends on:** SB-7-03
- **Unblocks:** SB-9-03, SB-9-04
- **Owner:** unassigned

## Problem

Browser storage can fail, fill up, or contain stale data. Serfbound needs
recovery flows before players trust imported assets and saves.

## Scope

- **In:** Storage versioning, migration/reset path, corrupt data handling,
  quota/error handling, reimport flow, and recovery documentation.
- **Out:** Cloud backup, account sync, original savegame compatibility, or
  unrelated UI polish.

## Acceptance criteria

- [x] Corrupt imported-data metadata can be reset.
- [x] Corrupt save data can be reset without losing imported data unless needed.
- [x] Storage version mismatch behavior is documented and tested.
- [x] Quota or write errors produce recoverable UI feedback.
- [x] Player docs have troubleshooting steps.

## Test plan

- **Unit:** Storage migration/error tests.
- **Integration / Cypress:** Browser corrupt/reset flow smoke test.
- **Manual / device:** Simulate reset/reimport flow in a local browser.
- **Design handoff:** Screenshots if recovery UI changes.

## Notes / open questions

Recovery UX is explicit in the Data and Save panels. `Clear save` only deletes
the local-game save; `Clear data` resets imported data and requires reimport.
