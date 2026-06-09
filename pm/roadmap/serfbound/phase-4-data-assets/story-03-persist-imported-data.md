# SB-4-03 — Persist Imported Data Locally

- **Project:** serfbound
- **Phase:** 4
- **Status:** done
- **Depends on:** SB-4-01, SB-4-02
- **Unblocks:** SB-7-01, SB-8-03
- **Owner:** Codex

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

- [x] Imported file metadata and bytes are stored locally or the no-persistence
  decision is documented.
- [x] Reload restores enough data to continue asset parsing.
- [x] User can clear/reset imported data.
- [x] Storage errors produce recoverable UI states.
- [x] Tests avoid storing original assets in tracked fixtures.

## Test plan

- **Unit:** Storage adapter tests with generated buffers.
- **Integration / Cypress:** Browser reload persistence smoke test with
  generated data.
- **Manual / device:** Import local `SPAU.PA`, reload, verify metadata remains.
- **Design handoff:** n/a - functional flow.

## Notes / open questions

Shipped an IndexedDB-backed current archive store for the browser app shell.
Generated CI tests prove record creation, byte cloning, save/load/clear, and
recoverable storage errors. The browser smoke imports a generated `SPAU.PA`,
persists it, reload-restores enough bytes to parse the catalog, clears it, and
reloads back to the missing-data state.

Manual/local proof imported the ignored local `SPAU.PA` in Chromium, parsed
`4000 entries, 2749 defined, 255 fixups`, restored it after reload from
IndexedDB, and cleared it. Phase 8 still owns quota/migration hardening.
