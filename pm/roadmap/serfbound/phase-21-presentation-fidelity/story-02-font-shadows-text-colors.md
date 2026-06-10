# SB-21-02 — Font Shadows and Text Colors

- **Project:** serfbound
- **Phase:** 21
- **Status:** done
- **Depends on:** SB-21-01
- **Unblocks:** SB-21-03
- **Owner:** Claude

## Problem

Game text draws naked palette-green glyphs over green terrain —
readability hell. The original solves exactly this with a font-shadow
sprite set (resource base 810, one dark outline glyph per character)
drawn under every glyph. We declare `fontShadow: 810` in the asset layer
but never decode or draw it.

## Scope

- **In:** Decode the font-shadow set alongside the font, draw shadow
  glyphs under every text placement (HUD, notices, popups, init screen),
  audit text color usage against the reference and recolor where the
  reference does, real-data readability captures over terrain.
- **Out:** New fonts or extended alphabets (Phase 25 localization).

## Acceptance criteria

- [x] Every `layoutUiText` consumer draws shadow glyphs beneath font
  glyphs.
- [x] Shadow sprites decode from the player's archive at base 810 with
  per-glyph pairing to the font set.
- [x] Real-data captures show readable text over bright terrain.

## Test plan

- **Unit:** Shadow decode and glyph pairing assertions in CI.
- **Integration / e2e:** Scene assertions that text placements emit
  shadow+glyph sprite pairs.
- **Manual / device:** Readability captures via the visual gate.
- **Design handoff:** Before/after screenshots under phase artifacts.

## Notes / open questions

- Preserves: the original font/font-shadow pairing.
- Browser boundary: none new.
- .NET reference use: read-only porting reference.
- Phase gate advanced: exit criterion 2.
