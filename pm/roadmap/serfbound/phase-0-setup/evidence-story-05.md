# Evidence — SB-0-05 — Define Asset And Legal Boundary

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `pm/roadmap/serfbound/adoption/asset-and-legal-boundary.md` - new browser
  import, storage, test-data, and redistribution boundary.
- `pm/roadmap/serfbound/README.md` - adds the boundary to source canon and
  records the import baseline.
- `pm/roadmap/serfbound/adoption/session-intake.md` - resolves the browser data
  supply question.
- `pm/roadmap/serfbound/adoption/phase-gate-verification-matrix.md` - updates
  the current gap summary to point at a Phase 0 completion audit after this
  story.
- `pm/roadmap/serfbound/phase-0-setup/story-05-asset-and-legal-boundary.md` -
  marks SB-0-05 done and checks acceptance criteria.
- `pm/roadmap/serfbound/phase-0-setup/current-phase-status.md` - marks the
  asset/legal boundary exit criterion and story table row complete.

## Verification artifacts

- Story and phase context:
  - `sed -n '1,240p' pm/roadmap/serfbound/phase-0-setup/story-05-asset-and-legal-boundary.md`
  - `sed -n '1,260p' pm/roadmap/serfbound/phase-0-setup/current-phase-status.md`
  - `sed -n '1,240p' pm/roadmap/serfbound/adoption/local-asset-inventory.md`
  - `sed -n '1,220p' pm/roadmap/serfbound/adoption/parity-harness-design.md`
- Existing repository/data constraints:
  - `sed -n '1,220p' README.md`
  - `sed -n '260,320p' .gitignore`
  - `rg -n "original|data file|DOS|Amiga|copyright|provide|game data|SPAE|SPAF|SPAD|SPAU|Graphics|Music|sound" README.md Configuration.md Freeserf.Core/Data/DataSourceDos.cs .gitignore pm/roadmap/serfbound -g '!phase-0-setup/evidence-story-*.md'`
  - `git status --short --ignored serfbound-local-data .gitignore` -> `!! serfbound-local-data/`.
- Phase 4 alignment:
  - `sed -n '1,220p' pm/roadmap/serfbound/phase-4-data-assets/current-phase-status.md`
  - `sed -n '1,220p' pm/roadmap/serfbound/phase-4-data-assets/story-01-browser-data-import-boundary.md`
  - `sed -n '1,220p' pm/roadmap/serfbound/phase-4-data-assets/story-02-parse-dos-pa-catalog.md`
- Public/current browser and copyright sources consulted:
  - U.S. Copyright Office, "What is Copyright?": `https://www.copyright.gov/what-is-copyright/`
  - U.S. Copyright Office, "The Lifecycle of Copyright": `https://www.copyright.gov/history/copyright-exhibit/lifecycle/`
  - MDN FileReader: `https://developer.mozilla.org/en-US/docs/Web/API/FileReader`
  - MDN File API: `https://developer.mozilla.org/en-US/docs/Web/API/File`
  - MDN IndexedDB API: `https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API`
  - MDN File System API: `https://developer.mozilla.org/en-US/docs/Web/API/File_System_API`
- PMO and asset-boundary checks:
  - `git diff --check` -> passed with no output.
  - placeholder/template scan over `pm/roadmap/serfbound` and `AGENTS.md` ->
    passed with no output.
  - `for f in pm/roadmap/serfbound/phase-*/story-[0-9]*.md; do rg -q "^## Problem$" "$f" && rg -q "^## Scope$" "$f" && rg -q "^## Acceptance criteria$" "$f" && rg -q "^## Test plan$" "$f" || echo "missing required section: $f"; done` -> passed with no output.
  - `bash -n .githooks/pre-commit .githooks/post-commit .githooks/work-log-read .githooks/work-log-summarize` -> passed with no output.
  - `git ls-files | rg -n '(^|/)(SPA.*\.PA|SOUNDS\.PA|SERF\.EXE|.*\.adf$|sounds/|music/|serfbound-local-data/)' || true` -> passed with no output.
  - `git check-ignore -v serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA serfbound-local-data/reference-output/example.json pm/roadmap/serfbound/local-data/example.json` -> confirmed ignore rules from `.gitignore`.
  - `test -f pm/roadmap/serfbound/adoption/asset-and-legal-boundary.md && test -f pm/roadmap/serfbound/phase-0-setup/evidence-story-05.md && echo sb-0-05-artifacts-present` -> `sb-0-05-artifacts-present`.
  - stale-question scan for the resolved import-path question and stale SB-0-05
    next-work text -> passed with no output.

## Acceptance criteria — re-checked

- [x] `pm/roadmap/serfbound/adoption/asset-and-legal-boundary.md` exists —
  created in this story.
- [x] The document quotes or paraphrases the existing repo's data-file
  constraint and maps it to browser behavior — proven by Existing Repository
  Constraint.
- [x] The document states which files may be committed, which must be ignored,
  and how local developer/user data is stored — proven by Allowed And Forbidden
  Files, Local Data Paths, and Runtime Storage Policy.
- [x] The document references
  `pm/roadmap/serfbound/adoption/local-asset-inventory.md` and identifies
  `SPAU.PA` as the current local DOS source for verification — proven by Current
  Local Verification Source.
- [x] The document states that "abandonware" is not a redistribution permission
  for this repo — proven by Copyright Baseline.
- [x] The document chooses an initial import path: upload, drag/drop, directory
  picker, dev fixture, or a staged combination — proven by Initial Browser
  Import Path.
- [x] The document records how Phase 4 tests can run without committing
  copyrighted assets — proven by Test Data Policy.

## Residual risk

This story does not provide legal advice, implement browser import, or prove
IndexedDB persistence. Phase 4 must still implement and test import/parser
behavior using generated CI-safe fixtures and opt-in local `SPAU.PA` checks.
Phase 0 still needs a completion audit/final summary before the phase should be
marked complete.
