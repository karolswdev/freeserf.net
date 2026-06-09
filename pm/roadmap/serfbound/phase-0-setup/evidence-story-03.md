# Evidence — SB-0-03 — Decide Browser Runtime Strategy

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `pm/roadmap/serfbound/adoption/runtime-architecture-decision.md` - new
  TypeScript-first runtime decision with rejected alternatives, criteria, phase
  mapping, stop signals, phase-coverage review, and source links.
- `pm/roadmap/serfbound/README.md` - adds the runtime decision to source canon
  and records the runtime baseline.
- `pm/roadmap/serfbound/phase-0-setup/story-03-browser-runtime-decision.md` -
  marks SB-0-03 done and checks acceptance criteria.
- `pm/roadmap/serfbound/phase-0-setup/current-phase-status.md` - marks the
  runtime-decision exit criterion and story table row complete.
- `pm/roadmap/serfbound/adoption/session-intake.md` - moves the runtime choice
  from open question to resolved question.
- `pm/roadmap/serfbound/adoption/phase-gate-verification-matrix.md` - updates
  the current gap summary to point at SB-0-04 after this story.

## Verification artifacts

- Existing roadmap/source context:
  - `sed -n '1,260p' pm/roadmap/serfbound/README.md`
  - `sed -n '1,260p' pm/roadmap/serfbound/phase-0-setup/current-phase-status.md`
  - `sed -n '1,260p' pm/roadmap/serfbound/adoption/phase-gate-verification-matrix.md`
  - `sed -n '1,260p' pm/roadmap/serfbound/adoption/reference-architecture-inventory.md`
- Primary docs consulted for current browser/runtime facts:
  - MDN WebAssembly: `https://developer.mozilla.org/en-US/docs/WebAssembly`
  - WebAssembly project overview: `https://webassembly.org/`
  - MDN WebGPU API: `https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API`
  - MDN FileReader API: `https://developer.mozilla.org/en-US/docs/Web/API/FileReader`
  - MDN IndexedDB API: `https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API`
  - MDN Web Audio API: `https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API`
  - MDN WebGL API: `https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API`
  - Vite 7 release/runtime notes: `https://vite.dev/blog/announcing-vite7`
  - Playwright docs: `https://playwright.dev/`
  - TypeScript Handbook: `https://www.typescriptlang.org/docs/handbook/intro.html`
  - wasm-bindgen guide: `https://rustwasm.github.io/docs/wasm-bindgen/`
- Local toolchain observation:
  - `command -v node npm rustc cargo dotnet || true` -> found
    `/opt/homebrew/bin/node`, `/opt/homebrew/bin/npm`, `/opt/homebrew/bin/rustc`,
    and `/opt/homebrew/bin/cargo`; no `dotnet` path printed.
  - `node --version && npm --version && rustc --version && cargo --version`
    -> stopped at Node failure.
  - `node --version` -> failed before printing a version because Node references
    missing Homebrew library `libllhttp.9.3.dylib`.
  - `rustc --version` -> `rustc 1.96.0 (ac68faa20 2026-05-25) (Homebrew)`.
  - `cargo --version` -> `cargo 1.96.0 (30a34c682 2026-05-25) (Homebrew)`.

## Acceptance criteria — re-checked

- [x] `pm/roadmap/serfbound/adoption/runtime-architecture-decision.md` exists
  — created in this story.
- [x] The decision states the chosen initial strategy and at least two rejected
  alternatives — proven by Decision and Rejected Alternatives.
- [x] The decision includes criteria for deterministic tests, browser API
  access, savegame/parity harnesses, debugging, performance, and maintenance —
  proven by Criteria.
- [x] The decision includes a stop signal that would force a strategy change by
  the end of Phase 2 — proven by Stop Signals.
- [x] The decision maps Phase 1 through Phase 9 story types to the chosen stack
  — proven by Phase Mapping.
- [x] The decision explicitly rejects final .NET code, Blazor/WebAssembly-.NET,
  Electron/Tauri/native wrappers, and desktop companion processes unless a
  future user decision reverses this roadmap constraint — proven by Decision and
  Rejected Alternatives.

## Phase concern response

The story explicitly reviewed whether more phases are needed. The conclusion is
that the current 0-9 phase model is sufficient for now, but only if each phase
keeps strict evidence gates and Phase 0 records stop signals for assumptions
that could break the plan. The added decision document records this as a
Phase Coverage Review.

## Residual risk

This story does not scaffold the browser workspace or repair the local Node
installation. Phase 2 must treat Node repair as setup work before build/test
commands can prove the TypeScript-first workspace. This story also does not
prove deterministic parity; SB-0-04 and Phase 1 own that evidence.
