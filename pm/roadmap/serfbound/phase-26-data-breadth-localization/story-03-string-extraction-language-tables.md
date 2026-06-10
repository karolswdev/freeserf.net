# SB-26-03 — String Extraction and Language Tables

- **Project:** serfbound
- **Phase:** 26
- **Status:** backlog
- **Depends on:** SB-26-02
- **Unblocks:** SB-26-04
- **Owner:** unassigned

## Problem

UI strings live inline in the chrome modules. Localization starts by
extracting them into one English reference table keyed by stable IDs,
then proving the path with a second language (German fits the umlaut
glyphs) — all still rendered through the decoded original font.

## Scope

- **In:** String inventory and extraction across panel, popups, init
  screen, notifications, and shell texts that render in-game; language
  table format + lookup; a complete German table; glyph-coverage
  validation at table load (every character maps via
  `MapCharacterToSpriteIndex`).
- **Out:** Language switch UI (SB-26-04); docs translation.

## Acceptance criteria

- [ ] No user-facing in-game string remains inline; English renders
  identically from the table (e2e unchanged).
- [ ] The German table is complete and passes glyph coverage.
- [ ] A table entry failing glyph coverage is a build/test error, not a
  runtime blank.

## Test plan

- **Unit:** Extraction completeness and glyph-coverage checks in CI.
- **Integration / e2e:** Founding e2e reruns identically in English.
- **Manual / device:** n/a until SB-26-04 captures.
- **Design handoff:** Table format doc in the phase folder.

## Notes / open questions

- Preserves: the decoded-font render path as the only text path.
- Browser boundary: none new.
- .NET reference use: none.
- Phase gate advanced: exit criterion 3.
