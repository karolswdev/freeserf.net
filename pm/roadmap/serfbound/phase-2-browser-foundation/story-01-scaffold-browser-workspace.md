# SB-2-01 — Scaffold Pure-Browser Workspace

- **Project:** serfbound
- **Phase:** 2
- **Status:** done
- **Depends on:** SB-0-03, SB-1-04
- **Unblocks:** SB-2-02, SB-2-03, SB-2-04, SB-3-01
- **Owner:** Codex

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

- [x] A browser workspace exists under the chosen repo path.
- [x] `package.json` scripts or equivalent commands build the workspace.
- [x] Product dependencies contain no .NET, desktop wrapper, or native launcher
  runtime.
- [x] Workspace docs point back to the Serfbound PMO roadmap.
- [x] The scaffold has explicit package boundaries for app, engine, assets, and
  tests or documents a simpler starting layout.

## Test plan

- **Unit:** Run the workspace build command.
- **Integration / Cypress:** n/a for scaffold unless the chosen stack creates a
  smoke browser test.
- **Manual / device:** Inspect dependency manifest for pure-browser compliance.
- **Design handoff:** n/a - non-visual.

## Notes / open questions

Shipped `serfbound/` as an npm workspace using nvm Node `22.21.0`, TypeScript
project references, and packages for app, engine, assets, and test-support.
Homebrew Node remains broken, so `.nvmrc` and workspace docs define the working
toolchain path for now.
