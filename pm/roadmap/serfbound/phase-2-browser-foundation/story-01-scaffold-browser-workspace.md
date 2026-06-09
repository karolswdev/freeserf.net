# SB-2-01 — Scaffold Pure-Browser Workspace

- **Project:** serfbound
- **Phase:** 2
- **Status:** backlog
- **Depends on:** SB-0-03, SB-1-04
- **Unblocks:** SB-2-02, SB-2-03, SB-2-04, SB-3-01
- **Owner:** unassigned

## Problem

Serfbound needs a real browser-native workspace before implementation can
advance. The scaffold must make the pure-browser constraint visible in package
layout and dependencies.

## Scope

- **In:** Package manager choice, browser app package, engine package,
  TypeScript/Rust-WASM layout as decided in SB-0-03, build scripts, and baseline
  project docs.
- **Out:** Gameplay implementation, renderer implementation, desktop wrappers,
  Electron/Tauri, .NET product dependencies, or local asset parser work.

## Acceptance criteria

- [ ] A browser workspace exists under the chosen repo path.
- [ ] `package.json` scripts or equivalent commands build the workspace.
- [ ] Product dependencies contain no .NET, desktop wrapper, or native launcher
  runtime.
- [ ] Workspace docs point back to the Serfbound PMO roadmap.
- [ ] The scaffold has explicit package boundaries for app, engine, assets, and
  tests or documents a simpler starting layout.

## Test plan

- **Unit:** Run the workspace build command.
- **Integration / Cypress:** n/a for scaffold unless the chosen stack creates a
  smoke browser test.
- **Manual / device:** Inspect dependency manifest for pure-browser compliance.
- **Design handoff:** n/a - non-visual.

## Notes / open questions

The scaffold should be minimal. Tooling complexity must justify itself by
making oracle consumption and browser tests easier.
