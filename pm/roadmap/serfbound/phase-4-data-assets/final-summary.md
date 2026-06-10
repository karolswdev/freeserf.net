# Phase 4 Final Summary — Data And Assets

**Completed:** 2026-06-09.
**Status:** complete; Phase 5 ready.

## Result

Phase 4 made local user-owned DOS data usable inside the pure browser runtime.
The app shell accepts `SPAU.PA`, parses the DOS `.PA` catalog in browser-native
TypeScript, persists imported archive bytes in IndexedDB, restores them after
reload, and exposes a typed catalog boundary for renderer, UI, and audio
consumers.

This does not decode sprites, audio, or music yet. It proves the browser import,
metadata, persistence, and semantic catalog gates without committing, hosting,
or redistributing original data.

## Shipped Stories

| Story | Commit | Evidence | Result |
|---|---|---|---|
| SB-4-01 Implement browser data import boundary | `675a05e` | [evidence-story-01](./evidence-story-01.md) | Added direct local `.PA` file selection, `SPAU.PA` validation, recoverable missing/invalid states, and generated-file browser coverage. |
| SB-4-02 Parse DOS PA resource catalog | `2d6af60` | [evidence-story-02](./evidence-story-02.md) | Added browser-native `.PA` header/table parsing, DOS loader fixups, resource availability metadata, and local oracle comparison. |
| SB-4-03 Persist imported data locally | `0e394c3` | [evidence-story-03](./evidence-story-03.md) | Added IndexedDB persistence, reload restore, reset, generated CI tests, and local browser proof with ignored `SPAU.PA`. |
| SB-4-04 Expose typed asset catalog | `3b6576a` | [evidence-story-04](./evidence-story-04.md) | Added semantic terrain/object/serf/UI/audio catalog groups and renderer/UI/audio request handles without exposing raw archive offsets. |

## Protected Asset Surface

| Surface | Product artifact | Proof |
|---|---|---|
| Browser import boundary | `validateArchiveFileSelection`, app file input | Generated browser import smoke and local/manual file checks |
| DOS `.PA` catalog metadata | `parseDosPaCatalog` | Generated archive parser tests and ignored local oracle comparison |
| Local browser persistence | `BrowserIndexedDbImportedArchiveStore` | Generated unit tests and browser reload/reset smoke |
| Typed semantic catalog | `buildTypedAssetCatalog` | Generated typed-catalog tests and ignored local typed facts |
| Data-free CI boundary | default `npm test`, `test:local:assets` skip | Full validation with local asset env vars unset |

## Exit Criteria Audit

| Exit criterion | Evidence | Status |
|---|---|---|
| Browser import accepts local `SPAU.PA` and detects it as supported | SB-4-01 browser smoke and evidence | passed |
| Imported data persists locally or has a documented no-persistence rationale | SB-4-03 IndexedDB unit/browser tests and local browser proof | passed |
| Asset catalog lists at least map ground, objects, serf sprites, UI/font assets, sound effects, and music availability | SB-4-04 typed catalog tests and local typed facts | passed |
| CI remains data-free; local asset checks are opt-in/manual | Full validation with local env vars unset, plus opt-in local check | passed |
| Missing/invalid data produces a recoverable browser UI state | SB-4-01 and SB-4-03 browser states | passed |

## Verification Commands

These commands were used during the completion audit:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm test && npm run check:boundaries && npm run test:local:assets'
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 SERFBOUND_SPAU_PA="../serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA" npm run test:local:assets'
git diff --check
```

Representative output:

```text
1..26
# tests 26
# pass 26

✓  1 [chromium] › tests/browser/static-shell.spec.ts:19:1 › static app shell renders without original data or a desktop companion
1 passed

serfbound-boundaries-ok
serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
serfbound-local-asset-tests-ok: parsed SPAU.PA catalog and matched Phase 1 oracle metadata plus typed catalog facts.
```

## Decisions

- Use direct `SPAU.PA` file selection as the baseline import path; drag/drop and
  directory picker remain progressive enhancements.
- Store the current imported archive in IndexedDB after successful catalog
  parsing; quota and migration hardening remain Phase 8.
- Keep parser output and typed catalog metadata separate from renderer/UI/audio
  implementation details.
- Keep raw archive offsets behind asset internals. Consumers receive semantic
  handles and availability states.
- Keep original asset bytes out of Git and out of CI. Local/manual checks remain
  explicit opt-in commands against ignored data.

## Known Limitations

- Phase 4 does not decode sprite pixels, animation frames, sound effects, or
  music. Later renderer/audio phases own decoding and playback.
- Persistence has a single current archive record. Version migration, quota
  recovery, multi-source import, and broader browser matrix coverage remain
  Phase 8 work.
- The typed catalog exposes availability and semantic request paths, not texture
  atlas records or audio buffers.
- Browser UI remains functional shell state, not final import UX polish.

## Phase 5 Handoff

Phase 5 starts with SB-5-01: choose the browser renderer API. It now has the
required inputs from earlier phases: engine map/projection primitives from
Phase 3 and typed asset catalog/request handles from Phase 4. The default bias
remains WebGL2 unless evidence shows Canvas2D is enough or WebGPU materially
lowers complexity.
