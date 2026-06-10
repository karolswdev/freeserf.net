# Phase 10 — Authentic Asset Rendering

**Last updated:** 2026-06-10.
**Status:** in progress.

## Goal

Decode real DOS sprite pixels from user-imported `SPAU.PA` and render authentic
Settlers terrain, map objects, and flags in the browser, replacing the
synthetic triangle scene with decoded game art.

## Scope

- **In:** TypeScript ports of the DOS palette and sprite decoders
  (solid/transparent/overlay/mask), terrain triangle composition from
  `map_ground` + `map_mask_up`/`map_mask_down`, a runtime texture atlas,
  decoded-sprite WebGL2 rendering in the app shell, opt-in real-data decode
  checks, and screenshot evidence that visibly resembles Settlers terrain.
- **Out:** Original map generator parity, serf animation, buildings, roads,
  economy simulation, audio decoding, fonts/UI art beyond what the scene needs,
  and any bundling of original data.

## Non-negotiable constraints

- Final product code is pure browser; the C# decoder is ported, not embedded.
- Original DOS data stays user-provided and gitignored; CI must stay data-free
  and pass without `serfbound-local-data/`.
- Catalog metadata, generated fixtures, or "release readiness" language do not
  count as visual progress. The phase gate is decoded game art on screen,
  proven by screenshot from real local `SPAU.PA`.

## Exit criteria (evidence required)

- [ ] Palettes 3, 3997, and 3998 and all four DOS sprite payload types decode
  from real local `SPAU.PA` through opt-in local checks. (SB-10-01)
- [ ] Terrain triangles compose from decoded `map_ground` sprites and
  `map_mask_up`/`map_mask_down` masks using the reference mask tables, packed
  into a runtime texture atlas. (SB-10-02)
- [ ] The browser scene renders decoded terrain, at least one authentic map
  object, and the real flag sprite for built structures when real data is
  imported, with graceful fallback for non-decodable archives. (SB-10-03)
- [ ] A captured browser screenshot using real local `SPAU.PA` visibly shows
  authentic Settlers terrain and sprites, recorded as phase evidence. (SB-10-04)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-10-01 | Port DOS palette and sprite decoders | in-progress | story-01-dos-sprite-decoders.md | — |
| SB-10-02 | Compose terrain triangles into a texture atlas | ready | story-02-terrain-composition-atlas.md | — |
| SB-10-03 | Render decoded sprites in the browser scene | ready | story-03-decoded-webgl-scene.md | — |
| SB-10-04 | Prove authentic visuals with real local data | ready | story-04-real-data-visual-proof.md | — |

## Where we are

Phase 10 is open. The session handoff recorded that phases 0–9 shipped a
working browser shell around a synthetic scene with no decoded game art; this
phase closes that gap. SB-10-01 (DOS sprite decoders) is in progress.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Decoded output drifts from reference decoder | medium | Port `DataSourceDos.cs` 1:1 and assert real-data invariants (palette sizes, sprite dimensions) in opt-in checks | Decoded sprites are wrong size or visibly corrupt |
| CI breaks because it has no real data | medium | Keep decode paths exercised by synthetic fixtures in CI; real-data checks stay opt-in | `npm run ci:release` requires `serfbound-local-data/` |
| Screenshot evidence overstated again | high | SB-10-04 requires a human-checkable screenshot from real data; phase cannot close on metadata | Phase claims completion without decoded art on screen |

## Decisions made (this phase)

- 2026-06-10 — Phase 10 exists because phases 0–9 validated infrastructure but
  shipped no decoded game art (recorded in the session handoff). The phase gate
  is visual authenticity from real local `SPAU.PA`, not more plumbing.

## Decisions deferred

- Serf torso/head player-color decoding (reference `SeparateSprites` path) is
  deferred to the phase that animates serfs.
- Wave rendering (`map_waves`) and path/road masks in the scene are deferred to
  the road-building phase.
