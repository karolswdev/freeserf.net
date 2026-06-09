# Phase 4 — Data And Assets

**Last updated:** 2026-06-09.

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

## Exit criteria (evidence required)

- [ ] Browser import accepts local `SPAU.PA` and detects it as a supported DOS
  source.
- [ ] Imported data persists locally or has a documented no-persistence
  rationale.
- [ ] Asset catalog lists at least map ground, objects, serf sprites, UI/font
  assets, sound effects, and music availability.
- [ ] CI remains data-free; local asset checks are opt-in/manual.
- [ ] Missing/invalid data produces a recoverable browser UI state.

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-4-01 | Implement browser data import boundary | backlog | story-01-browser-data-import-boundary.md | — |
| SB-4-02 | Parse DOS PA resource catalog | backlog | story-02-parse-dos-pa-catalog.md | — |
| SB-4-03 | Persist imported data locally | backlog | story-03-persist-imported-data.md | — |
| SB-4-04 | Expose typed asset catalog | backlog | story-04-typed-asset-catalog.md | — |

## Where we are

Phase 4 is not started. The ignored local `SPAU.PA` source exists and is
inventoried in `pm/roadmap/serfbound/adoption/local-asset-inventory.md`.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Asset tests accidentally require copyrighted files in CI | high | Keep local-data paths ignored and checks opt-in | CI needs original game data to pass |
| Browser file APIs do not fit desired UX | medium | Prototype direct file and directory import paths | Required browser support excludes target browsers |
| Parser exposes raw asset payloads in tracked fixtures | medium | Store metadata/checksums only unless generated test data is clean | Original asset bytes appear in Git |

## Decisions made (this phase)

- none yet.

## Decisions deferred

- Direct `.PA` upload vs directory picker — resolve in SB-4-01 — default to
  direct `.PA` import first because `SPAU.PA` is the known loader-relevant file.
