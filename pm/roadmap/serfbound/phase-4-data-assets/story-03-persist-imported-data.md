# SB-4-03 — Persist Imported Data Locally

- **Project:** serfbound
- **Phase:** 4
- **Status:** ready
- **Depends on:** SB-4-01, SB-4-02
- **Unblocks:** SB-7-01, SB-8-03
- **Owner:** unassigned

## Problem

Players should not have to re-import data on every reload unless browser limits
force that tradeoff. Persistence must be local, recoverable, and clearly
separate from tracked project files.

## Scope

- **In:** IndexedDB or selected browser storage path, storage key/version,
  reimport/reset flow, metadata display, and persistence tests.
- **Out:** Cloud sync, account systems, desktop filesystem access, savegame
  migration hardening, or full asset catalog.

## Acceptance criteria

- [ ] Imported file metadata and bytes are stored locally or the no-persistence
  decision is documented.
- [ ] Reload restores enough data to continue asset parsing.
- [ ] User can clear/reset imported data.
- [ ] Storage errors produce recoverable UI states.
- [ ] Tests avoid storing original assets in tracked fixtures.

## Test plan

- **Unit:** Storage adapter tests with generated buffers.
- **Integration / Cypress:** Browser reload persistence smoke test with
  generated data.
- **Manual / device:** Import local `SPAU.PA`, reload, verify metadata remains.
- **Design handoff:** n/a - functional flow.

## Notes / open questions

Phase 8 will harden quotas and migrations. This story only proves the viable
happy path and reset path.
