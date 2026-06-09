# Serfbound Runtime Module Boundaries

**Status:** accepted Phase 2 boundary baseline.
**Date:** 2026-06-09.
**Story:** SB-2-03.

## Purpose

Define where browser APIs, deterministic simulation, asset import, rendering,
UI/input, audio, persistence, worker/threading, oracle fixtures, and app-shell
integration are allowed to meet.

This document is a guardrail for Phases 3 through 8. It should be revised when
implementation evidence contradicts it, but changes must be explicit PMO work,
not accidental coupling.

## Global Rules

- Final product code remains pure browser: no .NET runtime, desktop wrapper,
  native launcher, local companion process, emulator dependency, or hidden
  server requirement for normal play.
- Product code reads Phase 1 oracle fixtures only as data in tests. Product code
  must not import or execute `pm/roadmap/serfbound/reference-tools/`.
- CI-safe tests must pass without `serfbound-local-data/` and without original
  DOS/Amiga files.
- Browser platform APIs live at edges: app shell, import, rendering, audio,
  persistence, UI/input, and future worker adapters.
- Deterministic engine code stays platform-free. It can be tested in Node and
  later in browsers with the same fixtures.
- Raw archive offsets and original asset bytes do not cross into renderer, UI,
  or audio consumers. Those consumers receive typed catalog records or decoded
  browser-ready payloads.
- Add packages only when there is implementation pressure. The current package
  set is `@serfbound/app`, `@serfbound/engine`, `@serfbound/assets`, and
  `@serfbound/test-support`; future packages may split renderer, UI, audio,
  persistence, or worker adapters when stories need them.

## Dependency Direction

Allowed high-level direction:

```text
app shell
  -> UI/input
  -> renderer
  -> audio
  -> persistence
  -> assets
  -> engine

tests
  -> test-support
  -> fixtures as data
  -> product packages under test
```

Forbidden direction:

```text
engine -> DOM / Canvas / WebAudio / storage / app shell / renderer / UI
assets catalog -> UI / renderer implementation / audio implementation
renderer -> app shell / UI command handlers / persistence
UI/input -> raw archive parser internals
product packages -> test-support
product packages -> reference-tools
product packages -> serfbound-local-data
```

Shared types should move only when duplication becomes real. Do not create a
generic "common" package just to avoid one import decision.

## Current Package Mapping

| Package | Current role | Product boundary |
|---|---|---|
| `@serfbound/engine` | Deterministic primitives and future simulation state | Platform-free product code. No browser globals. |
| `@serfbound/assets` | Asset import names, archive/catalog contracts, future parser | Browser file/import adapters may live here until split; renderer/audio consume typed catalog outputs, not raw archive internals. |
| `@serfbound/app` | Browser app-shell integration point | Owns browser composition and may depend on product packages, but not on `@serfbound/test-support`. |
| `@serfbound/test-support` | Fixture validation and test-only helpers | Test-only. Product packages must not depend on it. |

Future package candidates:

| Candidate | First likely phase | Create when |
|---|---:|---|
| `@serfbound/renderer` | 5 | A browser renderer API decision exists and render data preparation has tests. |
| `@serfbound/ui` | 6 | UI/input state and command routing need package-level ownership. |
| `@serfbound/audio` | 6 or 7 | WebAudio playback or decode scheduling has a real consumer. |
| `@serfbound/persistence` | 4 or 7 | IndexedDB/import/save storage needs isolated adapters and tests. |
| `@serfbound/worker` | 8 | Measured performance or responsiveness evidence requires a worker host. |

## Engine Boundary

Owns:

- fixed-width numeric helpers;
- RNG and deterministic map geometry;
- simulation state and tick/update entry points;
- command types, validation, and deterministic dispatch;
- stable snapshots or save-state models;
- pure projection helpers only when they have no DOM/canvas dependency.

Allowed dependencies:

- TypeScript standard language/runtime primitives;
- small local pure modules inside the engine package;
- fixture data in tests only;
- future shared type package only after a PMO story justifies it.

Forbidden dependencies:

- DOM, Canvas, WebGL, WebGPU, WebAudio, IndexedDB, `localStorage`, `File`,
  `Blob`, `URL`, `Worker`, timers for game rules, wall-clock time, random
  platform APIs, network APIs, app shell, UI packages, renderer packages, audio
  packages, persistence packages, `@serfbound/test-support` as product code,
  `.NET` or native modules.

Rules:

- Engine tests may use `@serfbound/test-support`; engine product code may not.
- Integer behavior must be explicit and fixture-backed when it protects
  `Freeserf.Core` parity.
- Engine output should be state, events, commands, or snapshots. It should not
  construct sprites, audio players, DOM elements, storage records, or browser
  handles.

Phase pressure:

- SB-3-01, SB-3-02, SB-3-03, and SB-3-04 must stay inside this boundary unless
  they record a deliberate divergence.

## Asset Import Boundary

Owns:

- browser file selection contracts and accepted source names;
- `File`/`Blob`/`ArrayBuffer` ingestion after explicit user selection;
- validation of supported source files such as `SPAU.PA`;
- local/manual test skip behavior for original data;
- generated CI-safe fake archive buffers.

Allowed dependencies:

- browser File API at the import edge;
- `ArrayBuffer`, `DataView`, typed arrays, checksum helpers, and pure parser
  utilities;
- persistence adapter only through a narrow storage interface when Phase 4 owns
  it;
- local/manual test commands gated by explicit opt-in.

Forbidden dependencies:

- committed original DOS/Amiga bytes, project-hosted original downloads,
  original executables, DOSBox/emulators, desktop helpers, Node filesystem APIs
  in product browser code, renderer internals, UI state machines, WebAudio
  playback, app shell mutation, reference tools during normal tests.

Rules:

- Browser import deals with user-selected bytes and recovery states.
- CI tests use generated fake buffers or committed data-free fixtures.
- Local/manual checks may inspect ignored `serfbound-local-data/` only when an
  explicitly named opt-in command or manual step says so.

## Decoded Asset Catalog Boundary

Owns:

- semantic resource groups aligned with `Freeserf.Core/Data/Data.cs`;
- catalog metadata for map ground, objects, shadows, serfs, UI/font assets,
  sound, and music availability;
- resource lookup by semantic id;
- decoded or browser-ready records once a decoder story proves them.

Allowed dependencies:

- asset parser output;
- typed arrays and immutable metadata objects;
- generated CI-safe catalog fixtures;
- local/manual metadata comparison output when explicitly enabled.

Forbidden dependencies:

- raw archive offsets as public renderer/UI/audio API;
- committed original payload bytes or extracted original sprites/sounds/music;
- renderer texture atlas ownership;
- WebAudio node ownership;
- UI panel state ownership.

Rules:

- Renderer, UI, and audio consume catalog semantics, not archive layout.
- Missing groups are represented explicitly, not by throwing late from a
  renderer or audio consumer.

## Renderer And Projection Boundary

Owns:

- browser renderer API choice and adapter;
- render layers, viewport/camera state, nonblank scene proof;
- projection transforms and screen/view/map conversions needed by renderer and
  input;
- texture upload/cache and atlas internals after Phase 5 chooses the approach.

Allowed dependencies:

- browser rendering APIs selected by Phase 5, such as Canvas2D, WebGL2, WebGPU,
  or a documented browser rendering library;
- engine read models and map/projection primitives;
- decoded asset catalog records;
- app-shell lifecycle hooks for mount/resize only.

Forbidden dependencies:

- mutating engine state directly;
- raw DOM input events as command semantics;
- raw `.PA` parser internals;
- WebAudio playback;
- IndexedDB storage;
- desktop OpenGL/Silk.NET, native renderer packages, Electron/Tauri, `.NET`.

Rules:

- Projection helpers that are pure can live with engine-adjacent math; renderer
  owns browser API details and viewport measurements.
- Phase 5 screenshot/pixel evidence must prove generated-fixture CI mode before
  relying on local original assets.

## UI And Input Boundary

Owns:

- pointer, keyboard, wheel, touch, and trackpad event handling;
- browser shortcut conflict policy;
- view/UI state such as missing data, imported data, running game, selected
  map position, and recoverable errors;
- semantic command creation and command-routing shell.

Allowed dependencies:

- DOM event APIs, Pointer Events, KeyboardEvent, ResizeObserver where needed;
- projection conversion APIs from Phase 5;
- engine command types and dispatch entry point;
- asset catalog metadata for labels/availability only;
- app-shell state composition.

Forbidden dependencies:

- raw engine mutation outside command dispatch;
- duplicate projection math when Phase 5 already owns it;
- raw archive parser internals or original asset bytes;
- renderer draw internals beyond documented selection/overlay hooks;
- browser storage internals beyond documented persistence commands.

Rules:

- UI routes semantic commands into the engine. It must not pass raw DOM events
  into simulation code.
- UI text should be player-facing and operational; do not expose PMO or
  implementation details in the app experience.

## Audio Boundary

Owns:

- WebAudio context lifecycle and playback scheduling;
- browser-safe decode path for sound/music payloads;
- user gesture unlock behavior;
- volume/mute state and recoverable audio errors.

Allowed dependencies:

- WebAudio and browser media APIs;
- decoded asset catalog audio records;
- app-shell lifecycle and user gesture hooks;
- persistence only for user settings such as volume/mute.

Forbidden dependencies:

- BASS, ManagedBass, native audio libraries, desktop MIDI devices, original
  executable playback, renderer internals, engine mutation, raw archive offsets
  as public API.

Rules:

- Engine may emit audio-intent events later; audio decides browser playback.
- Missing audio assets must not stop deterministic simulation.

## Persistence Boundary

Owns:

- IndexedDB or documented browser storage adapter;
- imported asset metadata and optional imported bytes after explicit user
  selection;
- browser-native save snapshots;
- reset/reimport and recovery flows;
- storage versioning and later migration policy.

Allowed dependencies:

- IndexedDB, structured clone, Blob/ArrayBuffer storage, localStorage only for
  small noncritical preferences if justified;
- asset import records and engine snapshot records;
- app-shell recovery UI commands.

Forbidden dependencies:

- filesystem paths in product code, Node filesystem APIs in browser runtime,
  cloud upload by default, project-hosted original asset downloads, raw PMO
  local-data paths, renderer internals, direct UI widget ownership.

Rules:

- Imported original data can exist only in browser-local storage after explicit
  user action.
- Product build output and release artifacts must not contain imported data.

## Worker And Threading Boundary

Baseline decision:

- No worker is required before Phase 8.
- Engine, renderer, asset parsing, and app-shell APIs should keep data crossing
  points serializable so a worker can be introduced without redesigning every
  module.
- The engine must not directly create or depend on `Worker`. A future worker
  host owns message passing and lifecycle.

Allowed dependencies:

- documenting serializable command/state shapes;
- extracting pure data-transfer types;
- small local experiments that do not become product dependencies.

Forbidden dependencies:

- hiding simulation behind a worker without measured need;
- sharing mutable state across worker boundaries;
- requiring worker support for normal play before fallback/recovery exists;
- adding WASM or native worker tooling without a recorded stop signal.

Phase 8 stop signals that can justify a worker:

- main-thread simulation or parsing blocks input/rendering beyond measured
  budgets;
- asset decoding or catalog processing creates visible browser jank;
- save/load serialization blocks user interaction;
- browser profiling shows a worker split is simpler than main-thread batching.

If a stop signal trips, the response is a small worker adapter package with
message contracts and fallback policy, not a rewrite of the engine boundary.

## Oracle Fixture And Test Boundary

Owns:

- fixture validation helpers;
- CI-safe test loading of `pm/roadmap/serfbound/reference-fixtures/ci/`;
- local/manual skip helpers;
- failure messages that point at fixture labels and field mismatches.

Allowed dependencies:

- Node built-in test runner for Phase 2 CI-safe tests;
- product packages under test;
- committed data-free fixtures;
- ignored local/manual paths only under explicitly named opt-in commands.

Forbidden dependencies:

- product package dependencies on `@serfbound/test-support`;
- normal CI executing `.NET`, Python reference capture helpers, DOS
  executables, or local original assets;
- reference helper imports in product packages;
- bundled fixture tools in release artifacts.

Rules:

- Tests consume fixtures as data. Capture tooling stays in Phase 1 reference
  tooling.
- Local/manual tests must skip cleanly when original data is absent.

## App Shell Boundary

Owns:

- browser bootstrapping, root mount, routing between import/game states, and
  top-level lifecycle;
- composition of engine, assets, renderer, UI/input, audio, persistence, and
  worker adapters;
- recoverable user states for missing/invalid data;
- static deployment proof in Phase 2/SB-2-04.

Allowed dependencies:

- product packages and browser APIs needed to compose the app;
- test-only helpers from app tests, not from app product source;
- generated CI-safe fixtures only in tests or demo modes explicitly marked as
  generated/non-original.

Forbidden dependencies:

- `@serfbound/test-support` in app product dependencies;
- direct .NET/native/desktop runtime dependencies;
- original data bundled in source, build output, release artifacts, or static
  hosting payloads;
- hidden local servers or companion processes for normal play.

Rules:

- App shell can coordinate modules; it should not own simulation, parsing,
  rendering internals, audio decoding, or storage implementation details.
- SB-2-04 must prove the shell is static/pure-browser, not just a Node script.

## Review Against Planned Phases

| Phase/story pressure | Boundary response |
|---|---|
| SB-3-01 numeric/random | Engine owns fixed-width semantics and parity tests; no DOM or app coupling. |
| SB-3-02 map geometry | Engine owns deterministic map primitives; projection consumers can reuse pure math without importing browser APIs. |
| SB-3-03 state/tick | Engine owns deterministic state/snapshots; persistence stores snapshots later through an adapter. |
| SB-3-04 first parity | Tests read Phase 1 fixtures as data through `@serfbound/test-support`; product code does not import fixtures. |
| SB-4-01 import boundary | Asset import owns File/Blob selection and recoverable missing/invalid states. |
| SB-4-02 PA catalog parser | Asset parser owns archive structure; CI uses generated fake archives, local `SPAU.PA` remains opt-in/manual. |
| SB-4-03 persistence | Persistence owns IndexedDB/reimport/reset; assets and engine do not call storage directly. |
| SB-4-04 typed catalog | Catalog separates raw archive details from renderer/UI/audio consumers. |
| SB-5-01 renderer decision | Renderer API choice remains browser-only and cannot introduce desktop/native wrappers. |
| SB-5-02 projection transform | Pure transform helpers are reusable; browser measurement stays in renderer/app shell. |
| SB-5-03 first scene | Renderer consumes engine/map state plus typed/generated assets; no direct parser or storage coupling. |
| SB-5-04 viewport verification | Renderer/app shell own viewport checks; evidence must include desktop/mobile proof. |
| SB-6-01 pointer mapping | UI/input consumes projection helpers; engine receives semantic positions or commands. |
| SB-6-02 command routing | UI creates typed commands; engine validates and dispatches deterministically. |
| SB-6-03 panels/states | UI owns player-facing states; persistence/assets expose status through APIs. |
| SB-6-04 ergonomics | UI/app shell own manual browser checks and shortcut substitutions. |

## Mechanical Checks

Current Phase 2 checks enforce part of this document:

- `npm run check:boundaries` rejects .NET/desktop/native-launcher dependency
  names in manifests.
- `npm run check:boundaries` rejects local/original asset path references in
  manifests.
- `npm run check:boundaries` rejects product package source references to
  `serfbound-local-data/` or Phase 1 reference tools.
- `npm run check:boundaries` rejects product package dependencies on
  `@serfbound/test-support`.

Future stories should add mechanical checks when a boundary becomes executable.
Documentation alone is enough for SB-2-03, but not enough for later product
behavior claims.

## Sources Consulted

- `pm/roadmap/serfbound/adoption/reference-architecture-inventory.md`
- `pm/roadmap/serfbound/adoption/runtime-architecture-decision.md`
- `pm/roadmap/serfbound/adoption/parity-harness-design.md`
- `pm/roadmap/serfbound/adoption/asset-and-legal-boundary.md`
- `pm/roadmap/serfbound/adoption/oracle-fixture-contract.md`
- Phase 3 through Phase 6 story files and current phase status files.
