# Serfbound Runtime Architecture Decision

**Status:** accepted baseline for Phase 1 and Phase 2.
**Date:** 2026-06-09.
**Story:** SB-0-03.

## Decision

Serfbound starts as a TypeScript-first, pure-browser codebase with an explicit
WASM escape hatch.

The initial product runtime will be browser-native TypeScript modules for the
app shell, deterministic engine primitives, binary asset import, rendering
coordination, audio coordination, save/load, tests, and packaging. Rust/WASM is
reserved for a later, narrow module only if Phase 1 or Phase 2 evidence proves
that TypeScript cannot meet deterministic, parsing, performance, or maintenance
criteria cleanly.

Final product code must not contain .NET, Blazor/WebAssembly-.NET,
Electron/Tauri, native launchers, desktop companion processes, or a browser
shell around a desktop/runtime service unless a future roadmap decision
explicitly reverses the user constraint.

## Why This Fits Serfbound

Serfbound is not a generic port. It needs to preserve gameplay behavior from
`freeserf.net` while replacing desktop assumptions with browser APIs. The
runtime choice therefore has to optimize for:

- deterministic parity tests against captured reference outputs;
- direct access to browser APIs for files, storage, rendering, audio, input,
  workers, and packaging;
- readable debugging while the engine behavior is still being discovered;
- low ceremony for future PMO stories and future agents;
- the option to isolate hot or brittle code later without committing the whole
  project to WASM-first complexity.

TypeScript gives the browser-native surface first. WASM remains available where
it is actually proven to pay for itself.

## Criteria

| Criterion | TypeScript-first baseline | Rust/WASM-first baseline | Up-front hybrid baseline |
|---|---|---|---|
| Deterministic tests | Acceptable if integer behavior is wrapped and tested with explicit `uint16`/`uint32` helpers, fixture snapshots, and no wall-clock or floating randomness in engine rules. | Strong for fixed-width integer semantics, but parity still crosses JS/browser boundaries for fixtures, files, rendering, and tests. | Can be strong, but split ownership makes the first parity harness harder to reason about. |
| Browser API access | Direct DOM, File/Blob/ArrayBuffer, IndexedDB, WebAudio, Canvas/WebGL/WebGPU, Worker, and test-runner access. | Requires bindings/glue for every browser boundary. | Browser integration stays in TS, but the engine boundary must be designed before evidence tells us where it belongs. |
| Savegame/parity harnesses | Fixtures can be JSON/binary contracts consumed by Node/browser tests and Playwright. Binary parsing uses `ArrayBuffer`/`DataView`. | Strong binary control, but fixture loading and browser comparison still need JS glue. | More moving parts before the first oracle is trustworthy. |
| Debugging | Browser DevTools and TS source maps are the shortest path while the model is changing. | Browser WASM debugging exists, but source maps, bindings, panic handling, and memory inspection add setup cost. | Debugging crosses TS and WASM even before a performance need is proven. |
| Performance | Sufficient until measured otherwise; Settlers-scale deterministic simulation should be proven before optimizing. Rendering can use browser GPU APIs independently of engine language. | Potentially faster for CPU-heavy code, but not automatically faster across JS/WASM call boundaries or browser IO. | Can preserve performance options, but premature split risks architecture churn. |
| Maintenance | Matches browser product constraints and broad web-tooling familiarity. | Adds Rust and WASM toolchain ownership for every implementation agent. | Highest coordination cost because every module needs a placement rule. |

## Rejected Alternatives

### Rust/WASM-First Product

Rejected as the starting strategy. WebAssembly is a valid web platform tool and
can run near-native code in a browser, but it does not remove the need for
JavaScript/TypeScript integration. Serfbound's first hard work is reference
capture, browser API boundaries, test fixtures, asset import, and debugging. A
Rust/WASM-first project would make those boundaries heavier before evidence says
the engine needs it.

Rust/WASM can be reconsidered as a small, documented module if a stop signal
trips by the end of Phase 2 or later performance evidence justifies it.

### Up-Front Hybrid Engine

Rejected as the starting strategy. A planned hybrid would make every early
story decide whether behavior lives in TypeScript or WASM before the parity
harness proves which parts are brittle. The better version is TypeScript-first
with a deliberately small WASM quarantine if a measured problem appears.

### .NET, Blazor, Desktop Shells, Native Wrappers, Or Companion Processes

Rejected outright for final product code. This includes Blazor/WebAssembly-.NET,
Electron, Tauri, native launchers, local server requirements for normal play,
and any desktop process hidden behind a browser UI. Temporary .NET reference
work may exist only as isolated oracle capture against `freeserf.net`; it is not
product code and must never be required for normal browser play.

## Phase Mapping

| Phase | Story types | Runtime home |
|---|---|---|
| 1 - Reference Oracle | Select reference targets, capture C# outputs, define fixture contracts | Reference-only `.NET` execution may be used outside product code; fixture contracts are JSON/binary artifacts consumable by TypeScript tests. |
| 2 - Browser Foundation | Workspace, CI-safe tests, runtime boundaries, static shell | TypeScript browser workspace. Use web tooling once local Node is repaired. No desktop wrapper or .NET dependency. |
| 3 - Core Simulation | Numeric rules, RNG, map geometry, tick skeleton, first parity | TypeScript engine package with explicit fixed-width integer helpers, deterministic fixtures, and no browser globals in core simulation. |
| 4 - Data And Assets | User file import, DOS `.PA` catalog parsing, persistence, typed assets | TypeScript asset package using browser `File`/`Blob`/`ArrayBuffer`/`DataView`; persistence via IndexedDB unless Phase 4 evidence rejects it. |
| 5 - Renderer And Projection | Renderer API, projection transform, first map layer, viewport checks | TypeScript render package over browser canvas APIs. Default to WebGL2/WebGL-compatible planning; treat WebGPU as an optional later accelerator because it is not yet universal enough for the baseline. |
| 6 - UI And Input Shell | Pointer, keyboard, command routing, panels, recoverable states | TypeScript app/UI package using DOM, pointer, keyboard, accessibility, and browser event APIs. |
| 7 - Playable Slice | Start local game, first build action, save/load loop, playable proof | TypeScript app integration, local user-provided assets, browser save/import/export path, Playwright/manual verification. |
| 8 - Browser Hardening | Performance budgets, workers, persistence recovery, compatibility | TypeScript measurement first; add Workers or a narrow WASM module only if measured budgets require it. |
| 9 - Release Operations | CI checks, static hosting, docs, release audit | Static browser artifact with dependency audit proving no .NET, desktop wrapper, or bundled original assets. |

## Stop Signals

The runtime strategy must be revisited no later than the end of Phase 2 if any
of these are true:

- Deterministic numeric helpers cannot express required `freeserf.net` integer
  behavior with readable tests and fixture comparisons.
- CI-safe TypeScript tests cannot consume Phase 1 oracle fixtures without
  unstable timing, ordering, or platform differences.
- Browser binary parsing of the local `SPAU.PA` catalog becomes unsafe,
  unreadable, or materially less maintainable than a small WASM parser.
- The TypeScript test/build toolchain cannot be made reliable in local and CI
  environments without unacceptable dependency churn.
- Early profiling proves the main-thread simulation budget is already missed
  before rendering or UI complexity is added.

If one stop signal trips, the response is not a full rewrite. The response is a
new PMO decision that identifies the smallest Rust/WASM boundary that solves the
measured problem while preserving a TypeScript browser shell.

## Phase Coverage Review

No additional top-level phase is needed right now. The current 0-9 model is
strong enough if the gates stay strict:

- Phase 0 keeps architecture, runtime, parity design, source boundary, and asset
  boundary out of implementation churn.
- Phase 1 prevents a speculative rewrite by making the reference behavior
  executable as fixtures.
- Phase 2 proves the browser workspace and CI before engine porting starts.
- Phases 3 through 7 move from deterministic core to real playable loop.
- Phase 8 gives browser constraints their own hardening gate instead of hiding
  them in release work.
- Phase 9 prevents "works locally" from being confused with a releasable
  browser product.

The missing success condition is not another phase; it is phase discipline.
Every phase should carry explicit proof artifacts, and Phase 0 should leave a
stop signal for any major assumption that could still break the plan.

## Primary Sources Consulted

- MDN WebAssembly documentation:
  https://developer.mozilla.org/en-US/docs/WebAssembly
- WebAssembly project overview:
  https://webassembly.org/
- MDN WebGPU API documentation:
  https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API
- MDN FileReader/File API documentation:
  https://developer.mozilla.org/en-US/docs/Web/API/FileReader
- MDN IndexedDB API documentation:
  https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- MDN Web Audio API documentation:
  https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- MDN WebGL API documentation:
  https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API
- Vite 7 announcement and browser target notes:
  https://vite.dev/blog/announcing-vite7
- Playwright documentation:
  https://playwright.dev/
- TypeScript Handbook:
  https://www.typescriptlang.org/docs/handbook/intro.html
- wasm-bindgen guide:
  https://rustwasm.github.io/docs/wasm-bindgen/

## Local Environment Observation

This decision chooses TypeScript-first, but local Phase 2 setup must first repair
Node. On 2026-06-09, `/opt/homebrew/bin/node` exists but fails to launch because
it references missing Homebrew library `libllhttp.9.3.dylib`. Rust and Cargo are
available locally, and `dotnet` is not on `PATH`. Phase 2 should treat Node
repair as setup work, not as a reason to choose Rust/WASM-first product code.
