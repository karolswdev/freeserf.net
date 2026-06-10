# SB-10-04 — Prove Authentic Visuals with Real Local Data

- **Project:** serfbound
- **Phase:** 10
- **Status:** done
- **Depends on:** SB-10-03
- **Unblocks:** —
- **Owner:** unassigned

## Problem

The previous release candidate claimed completion on infrastructure evidence
while the screen showed synthetic triangles. This phase cannot close the same
way. The final story exists solely to prove, with a screenshot generated from
the user's real local `SPAU.PA`, that the browser renders recognizable
Settlers terrain and sprites — and to wire that proof into the opt-in local
check path so it stays reproducible.

## Scope

- **In:** An opt-in screenshot capture script (preview build + real local
  `SPAU.PA` import + canvas screenshot), real-data decode/scene assertions in
  `npm run test:local:assets`, phase artifacts, and the phase close-out docs.
- **Out:** CI screenshot comparison (CI has no real data), pixel-diff oracles,
  marketing imagery.

## Acceptance criteria

- [x] An opt-in script captures browser screenshots of the decoded scene from
  real local `SPAU.PA` into the phase `artifacts/` folder.
- [x] The screenshot visibly shows authentic Settlers terrain (real ground
  textures, not flat colors) and at least one authentic map object or flag
  sprite, verified by a human-readable review note in the evidence file.
- [x] `npm run test:local:assets` asserts real-data decoding invariants
  (palettes, sprite dimensions, decoded scene source, sprite counts).
- [x] `npm run ci:release` passes data-free; the capture path is opt-in only.

## Test plan

- **Unit:** n/a — this story is the visual gate.
- **Integration / Cypress:** Opt-in Playwright capture run against the preview
  server with real local data.
- **Manual / device:** Review the captured screenshots against reference
  expectations of Settlers terrain before flipping the story to done.
- **Design handoff:** Screenshots under
  `pm/roadmap/serfbound/phase-10-authentic-asset-rendering/artifacts/`.

## Notes / open questions

- The screenshots derive from user-owned local data. Per the asset boundary,
  committed artifacts are limited to small evidence screenshots of the running
  app, consistent with existing phase artifact practice.
- Browser boundary: none new — uses the SB-10-03 path.
- .NET reference use: none.
- Phase gate advanced: closes Phase 10 with visual authenticity evidence.
