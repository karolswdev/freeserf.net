# SB-21-01 — Authentic Frame Chrome

- **Project:** serfbound
- **Phase:** 21
- **Status:** done
- **Depends on:** SB-20-04
- **Unblocks:** SB-21-02
- **Owner:** Claude

## Problem

The launch review found popup "gump" borders misaligned: the renderer draws
only two frame_popup pieces and places the bottom bar (sprite 1) at the
top-right corner. The reference (`Freeserf.Core/UI/Box.cs`) assembles four
pieces — top 144x9 (sprite 0), left 8x144 (sprite 2), right 8x144
(sprite 3), bottom 144x7 (sprite 1) — with the interior inset by the
border thickness.

## Scope

- **In:** Four-piece border assembly for popups and notification boxes,
  interior background inset per `Border.GetBackgroundOffset()`, init-box
  FrameTop chrome (320x8 horizontals inside 16x200 verticals) audit/fix,
  panel-bar frame_bottom piece alignment audit, popup hit-test offsets
  updated for the inset interior.
- **Out:** Text rendering (SB-21-02), resolution work (SB-21-03).

## Acceptance criteria

- [x] Popup borders surround the box on all four sides with the exact
  reference piece sizes and positions.
- [x] Popup interiors and content layouts inset by the border thickness;
  click targets still resolve. (Content layouts were already box-space
  per the reference draw helpers; the interior pattern now insets.)
- [x] Init box and panel bar chrome match their reference definitions.
  (The panel layout audit found the SB-16-02 port already exact; now
  pinned by test.)

## Test plan

- **Unit:** Frame layout assertions against the Box.cs definitions in CI.
- **Integration / e2e:** The founding e2e still drives every popup
  through the corrected geometry.
- **Manual / device:** Real-data captures of each popup via the visual
  gate.
- **Design handoff:** Screenshots under phase artifacts.

## Notes / open questions

- Preserves: `UI/Box.cs` Border definitions (type 1 popup row).
- Browser boundary: none new.
- .NET reference use: read-only porting reference.
- Phase gate advanced: exit criterion 1.
