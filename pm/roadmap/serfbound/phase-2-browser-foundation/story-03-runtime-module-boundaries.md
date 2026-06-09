# SB-2-03 — Define Runtime Module Boundaries

- **Project:** serfbound
- **Phase:** 2
- **Status:** backlog
- **Depends on:** SB-2-01, SB-0-02, SB-0-03
- **Unblocks:** SB-3-01, SB-4-01, SB-5-01, SB-6-02
- **Owner:** unassigned

## Problem

The rewrite will fail if browser APIs, simulation, asset decoding, rendering,
audio, and UI are tangled from the start. Serfbound needs module boundaries
that are strict enough to protect determinism but light enough to build.

## Scope

- **In:** Document boundaries for engine, assets, renderer, UI/input, audio,
  persistence, worker/threading, oracle fixtures, and app shell.
- **Out:** Implementing all modules, adding abstraction layers without usage,
  desktop compatibility, or multiplayer architecture.

## Acceptance criteria

- [ ] `pm/roadmap/serfbound/adoption/runtime-module-boundaries.md` exists.
- [ ] Every boundary names allowed dependencies and forbidden dependencies.
- [ ] The engine boundary has no direct DOM, canvas, WebAudio, or storage
  dependency unless explicitly justified.
- [ ] Asset import distinguishes browser file APIs from decoded asset catalogs.
- [ ] Worker/threading boundary is either defined or explicitly deferred to
  Phase 8 with a stop signal.

## Test plan

- **Unit:** n/a - architecture artifact.
- **Integration / Cypress:** n/a.
- **Manual / device:** Review planned Phase 3-6 stories against the boundary
  document.
- **Design handoff:** n/a - non-visual.

## Notes / open questions

The boundary document should be revised when implementation evidence contradicts
it. Treat it as a guardrail, not a law of physics.
