# SB-5-01 — Choose Browser Renderer API

- **Project:** serfbound
- **Phase:** 5
- **Status:** ready
- **Depends on:** SB-2-04, SB-4-04
- **Unblocks:** SB-5-02, SB-5-03
- **Owner:** unassigned

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

- [ ] Renderer decision artifact exists under `pm/roadmap/serfbound/adoption/`.
- [ ] Decision names chosen API and rejected alternatives.
- [ ] Decision includes browser support and testing implications.
- [ ] Decision keeps normal play pure browser with no desktop/native renderer.
- [ ] Stop signal for changing renderer approach is explicit.

## Test plan

- **Unit:** n/a - decision artifact.
- **Integration / Cypress:** n/a.
- **Manual / device:** Review decision against Phase 4 catalog output and Phase
  6 input needs.
- **Design handoff:** n/a - technical decision.

## Notes / open questions

Default bias remains WebGL2 unless evidence shows Canvas2D is enough or WebGPU
substantially lowers complexity.
