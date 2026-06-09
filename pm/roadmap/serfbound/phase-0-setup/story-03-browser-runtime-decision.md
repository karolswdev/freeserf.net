# SB-0-03 — Decide Browser Runtime Strategy

- **Project:** serfbound
- **Phase:** 0
- **Status:** done
- **Depends on:** SB-0-02
- **Unblocks:** SB-1-01, SB-1-02, SB-2-01, SB-3-01
- **Owner:** Codex

## Problem

Serfbound needs a runtime strategy before implementation starts. The choice is
not only language taste: it affects determinism, test speed, binary size,
debuggability, asset parsing, rendering integration, worker/threading, and how
future agents can maintain the code. .NET is not a candidate for final product
code.

## Scope

- **In:** Compare TypeScript-first, Rust/WASM-first, and hybrid approaches for
  simulation, data parsing, rendering glue, audio, save/load, test harnesses,
  and packaging.
- **Out:** Full project scaffold, engine implementation, renderer
  implementation, package publishing, CI setup beyond decision evidence, .NET
  product code, desktop shells, or native launchers.

## Acceptance criteria

- [x] Add `pm/roadmap/serfbound/adoption/runtime-architecture-decision.md`.
- [x] The decision states the chosen initial strategy and at least two rejected
  alternatives.
- [x] The decision includes criteria for deterministic tests, browser API
  access, savegame/parity harnesses, debugging, performance, and maintenance.
- [x] The decision includes a stop signal that would force a strategy change by
  the end of Phase 2.
- [x] The decision maps Phase 1 through Phase 9 story types to the chosen stack.
- [x] The decision explicitly rejects final .NET code, Blazor/WebAssembly-.NET,
  Electron/Tauri/native wrappers, and desktop companion processes unless a
  future user decision reverses this roadmap constraint.

## Test plan

- **Unit:** n/a - architecture decision story.
- **Integration / Cypress:** n/a.
- **Manual / device:** Review the decision against SB-0-02 inventory and ensure
  every major subsystem has an implementation home.

## Notes / open questions

Default bias before evidence: TypeScript for shell/tests/browser integration,
with Rust/WASM considered only where deterministic simulation or binary parsing
evidence makes it clearly worthwhile. The acceptable target is a static/browser
app, not a desktop app and not a .NET app.
