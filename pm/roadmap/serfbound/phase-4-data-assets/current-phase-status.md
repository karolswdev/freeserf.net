# Phase 4 — Data And Assets

**Last updated:** 2026-06-09.

**Status:** in progress.

## Goal

Import local user-owned DOS data in the browser and expose typed assets to the
engine without committing, hosting, or redistributing original files.

## Scope

- **In:** `.PA` file import, directory/file-picker UX decision, IndexedDB or
  equivalent persistence, DOS resource archive parsing, asset catalog, generated
  texture/audio-ready payloads, and missing-data states.
- **Out:** Shipping original assets, cloud storage, desktop import helpers,
  native tools required for normal play, renderer polish, or final audio
  quality.

## Non-negotiable constraints

- Final product code is pure browser.
- No .NET product runtime, desktop wrapper, native launcher, local companion
  process, or browser shell around a desktop runtime.
- Original DOS/Amiga data is user-provided only; Serfbound does not commit,
  host, bundle, or redistribute it.

## Exit criteria (evidence required)

- [x] Browser import accepts local `SPAU.PA` and detects it as a supported DOS
  source.
- [ ] Imported data persists locally or has a documented no-persistence
  rationale.
- [ ] Asset catalog lists at least map ground, objects, serf sprites, UI/font
  assets, sound effects, and music availability.
- [x] CI remains data-free; local asset checks are opt-in/manual.
- [x] Missing/invalid data produces a recoverable browser UI state.

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-4-01 | Implement browser data import boundary | done | story-01-browser-data-import-boundary.md | evidence-story-01.md |
| SB-4-02 | Parse DOS PA resource catalog | ready | story-02-parse-dos-pa-catalog.md | — |
| SB-4-03 | Persist imported data locally | backlog | story-03-persist-imported-data.md | — |
| SB-4-04 | Expose typed asset catalog | backlog | story-04-typed-asset-catalog.md | — |

## Where we are

Phase 4 is in progress. SB-4-01 shipped the direct browser file-selection
boundary, first `SPAU.PA` filename validation, recoverable missing/invalid UI
states, generated-file browser smoke coverage, and opt-in local/manual check
path. The ignored local `SPAU.PA` source exists and is inventoried in
`pm/roadmap/serfbound/adoption/local-asset-inventory.md`. The next responsible
move is SB-4-02: parse DOS `.PA` catalog metadata without committing or
bundling original data.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Asset tests accidentally require copyrighted files in CI | high | Keep local-data paths ignored and checks opt-in | CI needs original game data to pass |
| Browser file APIs do not fit desired UX | medium | Prototype direct file and directory import paths | Required browser support excludes target browsers |
| Parser exposes raw asset payloads in tracked fixtures | medium | Store metadata/checksums only unless generated test data is clean | Original asset bytes appear in Git |

## Decisions made (this phase)

- 2026-06-09 — Start with direct `.PA` file selection and accept only `SPAU.PA`
  at the import boundary; generated fake files prove browser behavior in CI,
  while real local data remains opt-in/manual — SB-4-01.

## Decisions deferred

- Directory picker enhancement — defer until direct `.PA` import and catalog
  parsing prove the core path — default remains direct `SPAU.PA` selection.
