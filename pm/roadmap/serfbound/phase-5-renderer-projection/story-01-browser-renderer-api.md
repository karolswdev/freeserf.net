# SB-5-01 — Choose Browser Renderer API

- **Project:** serfbound
- **Phase:** 5
- **Status:** done
- **Depends on:** SB-2-04, SB-4-04
- **Unblocks:** SB-5-02, SB-5-03
- **Owner:** Codex

## Problem

Serfbound must pick a browser rendering path that can display an isometric map
without overbuilding a graphics engine. The choice should be based on evidence,
not novelty.

## Scope

- **In:** Compare Canvas2D, WebGL2, WebGPU, and library-backed options against
  asset pipeline, layering, batching, browser support, tests, and performance
  risk.
- **Out:** Full renderer implementation, UI shell, desktop graphics, or final
  performance tuning.

## Acceptance criteria

- [x] Renderer decision artifact exists under `pm/roadmap/serfbound/adoption/`.
- [x] Decision names chosen API and rejected alternatives.
- [x] Decision includes browser support and testing implications.
- [x] Decision keeps normal play pure browser with no desktop/native renderer.
- [x] Stop signal for changing renderer approach is explicit.

## Test plan

- **Unit:** n/a - decision artifact.
- **Integration / Cypress:** n/a.
- **Manual / device:** Review decision against Phase 4 catalog output and Phase
  6 input needs.
- **Design handoff:** n/a - technical decision.

## Notes / open questions

Decision shipped in
`pm/roadmap/serfbound/adoption/renderer-api-decision.md`: use a small
first-party WebGL2 renderer as the Phase 5 baseline. Canvas2D remains available
for generated debug/test paths, WebGPU is deferred as a later accelerator, and
third-party render libraries stay deferred until the first scene proves they
remove more code than they add.
