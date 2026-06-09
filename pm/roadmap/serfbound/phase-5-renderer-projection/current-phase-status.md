# Phase 5 — Renderer And Projection

**Last updated:** 2026-06-09.

**Status:** in progress.

## Goal

Render the first real map scene in the browser with a projection and layer model
that can support gameplay interactions.

## Scope

- **In:** Canvas/WebGL/WebGPU decision, map projection, render layers, texture
  atlas path, viewport transform, map scrolling/zoom assumptions, and visual
  parity checks where feasible.
- **Out:** Full UI shell, full animation system, audio, accessibility
  completion, desktop rendering, or native wrappers.

## Non-negotiable constraints

- Final product code is pure browser.
- No .NET product runtime, desktop wrapper, native launcher, local companion
  process, or browser shell around a desktop runtime.
- Original DOS/Amiga data is user-provided only; Serfbound does not commit,
  host, bundle, or redistribute it.

## Exit criteria (evidence required)

- [x] A browser scene renders a map-like view from typed assets or generated
  fixtures.
- [x] Projection/coordinate conversion is documented and tested.
- [x] Render layers map back to `Freeserf.Core/Rendering.txt` concepts or
  intentionally replace them.
- [x] The renderer can run without original data using generated fixtures and
  can run locally with imported `SPAU.PA`.
- [ ] Screenshots or pixel checks prove the scene is nonblank and correctly
  framed on desktop and mobile viewport sizes.

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-5-01 | Choose browser renderer API | done | story-01-browser-renderer-api.md | evidence-story-01.md |
| SB-5-02 | Implement map projection transform | done | story-02-map-projection-transform.md | evidence-story-02.md |
| SB-5-03 | Build first render-layer scene | done | story-03-first-render-layer-scene.md | evidence-story-03.md |
| SB-5-04 | Verify viewport framing | ready | story-04-viewport-framing-verification.md | — |

## Where we are

Phase 5 is in progress. SB-5-01 chose a small first-party WebGL2 renderer as
the baseline in `pm/roadmap/serfbound/adoption/renderer-api-decision.md`.
SB-5-02 added a browser-neutral `MapProjectionTransform` in `@serfbound/engine`
for shared map/tile/view/screen conversion. SB-5-03 added the first WebGL2
render-layer scene, backed by generated CI-safe map primitives and typed
renderer asset request metadata after `SPAU.PA` catalog import or restore.
Canvas2D remains available for debug/test paths, WebGPU is deferred as a later
accelerator, and desktop/native renderer reuse is rejected. The next responsible
move is SB-5-04: verify viewport framing across desktop and mobile sizes.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Renderer becomes detached from gameplay | high | Tie first scene to engine/map data | Scene cannot display a Phase 3 map state |
| Projection mismatch breaks input later | medium | Test screen-to-map conversion now | Click mapping cannot be made deterministic |
| Asset atlas decisions lock in too early | medium | Keep atlas format internal until first scene evidence | Changing one asset requires renderer rewrite |

## Decisions made (this phase)

- 2026-06-09 — Use a small first-party WebGL2 renderer as the Phase 5 baseline;
  keep Canvas2D for debug/test paths, defer WebGPU as a later accelerator, and
  reject desktop/native renderer reuse — SB-5-01.
- 2026-06-09 — Keep renderer/input coordinate conversion in browser-neutral
  engine code via `MapProjectionTransform`; preserve virtual-screen
  letterboxing and resize behavior, and reuse fixture-backed `MapGeometry`
  projection math — SB-5-02.
- 2026-06-09 — Model the first browser render scene as ordered triangle
  primitives assigned to `terrain`, `paths`, `shadows`, `objects`, and
  `markers` layers; render them with WebGL2 and rebuild scene metadata from
  typed DOS catalog renderer asset requests when local data is imported —
  SB-5-03.

## Decisions deferred

- WebGPU accelerator path — revisit only if browser support and measured scene
  costs justify it.
- Third-party renderer library — defer until first scene evidence shows a
  focused dependency removes more code than it adds.
