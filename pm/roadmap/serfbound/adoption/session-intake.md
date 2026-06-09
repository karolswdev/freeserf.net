# Serfbound - Session Intake

**Created:** 2026-06-09
**Project slug:** `serfbound`
**Story prefix:** `SB`
**Target repo:** `/Users/karol/dev/code/settlers-clone/freeserf.net`

## Session Posture

Rewrite discovery and roadmap scaffolding

## Priority Checklist

- [x] Ground planning in the existing freeserf.net repository
- [x] Define a web-native engine migration path
- [x] Name the project enough to give the roadmap a durable home

## Risk Posture

High technical uncertainty: preserve gameplay semantics while replacing the runtime, renderer, audio, file loading, and packaging model.

## Discovery Depth

Architecture-level discovery with enough implementation detail to create early stories; defer line-by-line port plans until Phase 0 evidence exists.

## Expected Deliverables

- [x] Provisional project name
- [x] Delivery Workbench roadmap scaffold
- [x] Phase plan with explicit browser-port concerns
- [x] Open questions for naming, licensing, assets, and target stack

## User Goal For This Session

Start a grounded plan for rewriting freeserf.net into a pure browser-native
playable engine.

## Desired Direction

Treat Freeserf.Core as the behavioral reference, extract deterministic gameplay
semantics, and rebuild platform edges for TypeScript/WebAssembly/WebGL/WebAudio
instead of carrying .NET forward as the product runtime. Final Serfbound product
code must not be .NET, must not be a desktop app, and must not require a native
companion process for normal play.

## Definition Of A Good Handoff

**Audience:** Future human or Codex sessions continuing the browser-native rewrite

A future session should be able to read pm/roadmap/serfbound and know the proposed name, phase sequence, first evidence targets, and the unresolved decisions blocking implementation.

## Success Criteria / Evidence

The repo contains a Delivery Workbench roadmap with concrete phases, stories,
and evidence gates for the pure browser rewrite.

## Constraints And Non-Goals

Do not ship copyrighted original game data. Locally procured DOS/Amiga assets
may be used for development and play, but they must stay out of Git and out of
Serfbound distribution artifacts. Do not assume the browser engine can reuse
.NET APIs directly. Do not retain .NET, desktop shells, native launchers, or
companion processes in the final product. Do not make architectural claims that
are not backed by repository inspection or follow-up evidence.

## Known Context From The User

User wants delivery-workbench cloned and wants planning grounded in reality.
User dislikes .NET as the target language/runtime and wants a web-native
platform. User explicitly clarified that final Serfbound must contain no .NET
code and no desktop deliverable: pure browser only. User has provided
previously purchased local DOS assets under `serfbound-local-data/sources/`;
these are ignored by Git and available for local verification. The existing repo
is freeserf.net, a C# port and extension of freeserf, requiring original
DOS/Amiga data files.

## Preferred Agent / Execution Style

Pragmatic, evidence-first, direct. Ask real questions but leave a usable scaffold immediately.

## Open Questions To Resolve Before Roadmapping

- Should the first playable browser target prioritize single-player local play only?

## Resolved Questions

- 2026-06-09 — Runtime implementation starts TypeScript-first with a narrow
  WASM escape hatch only if recorded stop signals trip by the end of Phase 2.
  See `runtime-architecture-decision.md`.
- 2026-06-09 — Original DOS/Amiga data is supplied in-browser through a staged
  import path: direct `.PA` file selection first, drag/drop as same-boundary
  convenience, IndexedDB persistence by default, and directory picker only as
  progressive enhancement. See `asset-and-legal-boundary.md`.

## Intake Notes

This file captures user intent before repository discovery. Adoption discovery
must read this before proposing phases or stories. If repository facts conflict
with this intake, the adoption report should name the conflict and ask the user
instead of silently overriding intent.
