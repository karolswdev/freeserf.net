# Serfbound — Roadmap

**Last updated:** 2026-06-10.
**Current phase:** [24 — Repository Independence](./phase-24-repository-independence/)
**Status:** Phases 0–23 complete; Serfbound v0.1.0 shipped launch-ready
(see [phase-20-launch-operations/final-summary.md](./phase-20-launch-operations/final-summary.md)).
Post-launch so far: Phase 21 closed the launch-review punch list
(authentic chrome, font shadows, native-resolution view scales, touch
gestures); Phase 22 shipped realtime lockstep between two tabs with
zero servers; Phase 23 shipped correspondence play — offline-chess
Serfbound with trustless turn windows, recaps, digests, hot-seat
pass-and-play, and two-tab async matches (see
[phase-23-correspondence-foundations/final-summary.md](./phase-23-correspondence-foundations/final-summary.md)).
Remaining: repository independence — Serfbound's own GPL-3.0 repo with
zero .NET (24), identity/challenges/the turn mailbox (25), data breadth
and localization (26), realtime WebRTC online play (27).

## Vision

Serfbound is the browser-native rewrite track for `freeserf.net`: a plan to
turn the existing C# remake of The Settlers I into a web-playable engine while
preserving the hard-won gameplay behavior already encoded in the repository.

The current repo states that `freeserf.net` is "an authentic remake" and that
users must provide original DOS or Amiga data files. Serfbound keeps those
constraints. It does not bundle copyrighted game data, and it treats the
existing C# code as the reference implementation rather than as the desired
runtime.

The product target is a pure browser experience: deterministic local
single-player first, explicit asset import, WebGL/WebGPU-capable rendering when
the evidence supports it, WebAudio for sound, and a codebase that can be built,
tested, and inspected with web-native tooling. The final Serfbound product must
not contain .NET runtime code, desktop-shell code, or a desktop deliverable.

## Source canon

- `README.md` - project purpose, current state, release notes, platform notes,
  copyright/data-file constraints, and stated roadmap.
- `Configuration.md` - user config model, command-line behavior, data-source
  preferences, and desktop runtime assumptions that need browser equivalents.
- `Freeserf.Core/` - gameplay reference: map, game, player, building, serf,
  savegame, data, render-facing model, UI, and network serialization code.
- `Freeserf.Core/Rendering.txt` - current render abstraction and coordinate
  conversion model.
- `Freeserf.Renderer/` - Silk.NET/OpenGL renderer implementation to replace,
  not port.
- `Freeserf.Audio/` and `Freeserf.Core/Audio/` - BASS-backed audio behavior and
  audio interface boundaries.
- `FreeserfNet/` - desktop shell, config loading, data loading, window/input
  wiring, and shutdown behavior.
- `pm/roadmap/serfbound/adoption/session-intake.md` - user-stated direction for
  this rewrite track.
- `pm/roadmap/serfbound/adoption/local-asset-inventory.md` - tracked inventory
  of ignored local assets available for verification.
- `pm/roadmap/serfbound/adoption/phase-gate-verification-matrix.md` - proof
  matrix for what "tested and end-to-end proven" requires across phases.
- `pm/roadmap/serfbound/adoption/reference-architecture-inventory.md` -
  source-grounded inventory mapping `freeserf.net` subsystems to browser rewrite
  responsibilities.
- `pm/roadmap/serfbound/adoption/runtime-architecture-decision.md` -
  TypeScript-first browser runtime decision, rejected alternatives, phase
  mapping, stop signals, and phase-coverage review.
- `pm/roadmap/serfbound/adoption/parity-harness-design.md` - deterministic
  oracle target list, fixture locations, comparison rules, and browser
  consumption boundary for parity work.
- `pm/roadmap/serfbound/adoption/asset-and-legal-boundary.md` - browser import,
  storage, test-data, and redistribution boundary for original DOS/Amiga data.
- `pm/roadmap/serfbound/adoption/oracle-targets.md` - selected Phase 1 oracle
  targets, source files/methods, data requirements, output shapes, and protected
  future phases.
- `pm/roadmap/serfbound/adoption/oracle-fixture-contract.md` - v1 fixture
  schema, directory policy, checksum rules, local/manual output rules, and
  product-code boundary for oracle data.
- `pm/roadmap/serfbound/adoption/runtime-module-boundaries.md` - Phase 2
  boundary baseline for engine, assets, renderer, UI/input, audio, persistence,
  worker/threading, oracle fixtures/tests, and app shell.
- `pm/roadmap/serfbound/adoption/pointer-input-model.md` - Phase 6 pointer
  input boundary for map hover/selection, mouse/trackpad/touch viability, and
  projection reuse.
- `pm/roadmap/serfbound/reference-tools/` - isolated Phase 1 reference capture
  tooling that may inspect source behavior but is not Serfbound product code.
- `pm/roadmap/serfbound/reference-fixtures/ci/` - committed CI-safe oracle
  fixtures that browser-native code may consume in later phases.
- `serfbound-local-data/reference-output/` - ignored local/manual oracle outputs
  generated from user-provided assets; committed evidence may cite checksums and
  summaries only.

If a phase disagrees with source canon, the phase must record the disagreement
and either prove the new behavior intentionally or defer the decision.

## Phase index

| Phase | Goal (one line) | Status | Folder |
|---|---|---|---|
| 0 | Prove the rewrite shape before implementation starts | complete | [phase-0-setup](./phase-0-setup/) |
| 1 | Capture trustworthy reference behavior before rewriting it | complete | [phase-1-reference-oracle](./phase-1-reference-oracle/) |
| 2 | Establish the pure-browser workspace, runtime, and CI spine | complete | [phase-2-browser-foundation](./phase-2-browser-foundation/) |
| 3 | Port deterministic simulation primitives with parity evidence | complete | [phase-3-core-simulation](./phase-3-core-simulation/) |
| 4 | Import local user-owned DOS data and expose typed assets | complete | [phase-4-data-assets](./phase-4-data-assets/) |
| 5 | Build the map renderer, projection model, and visual asset path | complete | [phase-5-renderer-projection](./phase-5-renderer-projection/) |
| 6 | Build browser input, UI shell, and game interaction loops | complete | [phase-6-ui-input-shell](./phase-6-ui-input-shell/) |
| 7 | Ship the first local playable vertical slice | complete | [phase-7-playable-slice](./phase-7-playable-slice/) |
| 8 | Harden persistence, performance, workers, and browser constraints | complete | [phase-8-browser-hardening](./phase-8-browser-hardening/) |
| 9 | Package, document, and operate Serfbound as a browser product | complete | [phase-9-release-operations](./phase-9-release-operations/) |
| 10 | Decode real DOS sprites and render authentic game art in the browser | complete | [phase-10-authentic-asset-rendering](./phase-10-authentic-asset-rendering/) |
| 11 | Generate the original world and make it scrollable | complete | [phase-11-original-map-world](./phase-11-original-map-world/) |
| 12 | Found settlements: castle, flags, roads, construction | complete | [phase-12-settlement-construction](./phase-12-settlement-construction/) |
| 13 | Bring serfs to life: state machine and authentic animation | complete | [phase-13-serf-engine-animation](./phase-13-serf-engine-animation/) |
| 14 | Run every classic production chain | complete | [phase-14-working-economy](./phase-14-working-economy/) |
| 15 | Knights, territory, and combat | complete | [phase-15-knights-and-conquest](./phase-15-knights-and-conquest/) |
| 16 | Rebuild the original interface browser-native | complete | [phase-16-original-interface](./phase-16-original-interface/) |
| 17 | Sound effects and music through WebAudio | complete | [phase-17-sound-and-music](./phase-17-sound-and-music/) |
| 18 | Missions, classic AI, and original savegames | complete | [phase-18-complete-game](./phase-18-complete-game/) |
| 19 | First-class browser experience: performance, mobile, PWA | complete | [phase-19-browser-experience](./phase-19-browser-experience/) |
| 20 | Public launch and live operations | complete | [phase-20-launch-operations](./phase-20-launch-operations/) |
| 21 | Presentation fidelity: frames, text, resolution, gestures | complete | [phase-21-presentation-fidelity](./phase-21-presentation-fidelity/) |
| 22 | Multiplayer foundations: checksums, lockstep, loopback play | complete | [phase-22-multiplayer-foundations](./phase-22-multiplayer-foundations/) |
| 23 | Correspondence play: turn windows, recaps, hot-seat/async gate | complete | [phase-23-correspondence-foundations](./phase-23-correspondence-foundations/) |
| 24 | Repository independence: standalone GPL-3.0 repo, zero .NET | scaffolded | [phase-24-repository-independence](./phase-24-repository-independence/) |
| 25 | Community and identity: profiles, accounts, challenges, mailbox, ladder | scaffolded | [phase-25-community-identity](./phase-25-community-identity/) |
| 26 | Data breadth and localization: Amiga evaluation, language tables | scaffolded | [phase-26-data-breadth-localization](./phase-26-data-breadth-localization/) |
| 27 | Realtime online play: WebRTC transport, signaling, resilience | scaffolded | [phase-27-realtime-online-play](./phase-27-realtime-online-play/) |

## Delivery Gates

The phase sequence is intentionally front-loaded with proof work. A later phase
should not start just because the previous phase has "some code"; it starts
when the previous phase has evidence:

- Phase 1 proves we can capture reference behavior without keeping .NET in the
  product.
- Phase 2 proves the browser-native workspace is real, testable, and pushable.
- Phase 3 proves deterministic engine rules can match reference outputs.
- Phase 4 proves real local `SPAU.PA` data can be imported without committing
  assets.
- Phase 5 proves the map can be displayed through browser rendering APIs.
- Phase 6 proves player intent maps cleanly to engine actions.
- Phase 7 proves the loop is playable.
- Phase 8 proves it survives browser limits.
- Phase 9 proves it can be released and maintained.
- Phase 10 proves imported original data becomes visible, authentic game art —
  the gate phases 4/5 deferred by stopping at catalog metadata and synthetic
  rendering.
- Phase 11 proves the world itself is authentic: generator parity against
  reference fixtures, scrollable in the browser.
- Phase 12 proves players can found settlements with original rules.
- Phase 13 proves serfs live: the state machine and animation are real.
- Phase 14 proves the economy sustains itself through every classic chain.
- Phase 15 proves conquest works and games can be won or lost.
- Phase 16 proves the original interface drives the game browser-natively.
- Phase 17 proves it sounds like Settlers from the player's own data.
- Phase 18 proves it is the complete game: missions, AI, original saves.
- Phase 19 proves it is a first-class browser product on any device.
- Phase 20 proves it can launch publicly and be operated honestly.
- Phase 21 proves it looks right: authentic chrome, readable text, sharp
  high-DPI rendering, real touch gestures.
- Phase 22 proves lockstep multiplayer works with zero servers (loopback).
- Phase 23 proves correspondence play: trustless turn windows, recaps, and
  hot-seat/async matches with zero servers.
- Phase 24 proves Serfbound stands alone: its own GPL-3.0 repository with
  zero .NET, gates green in the new home.
- Phase 25 proves identity, challenges, and the turn mailbox can exist
  without gating play or eroding the privacy posture.
- Phase 26 proves data breadth (Amiga, evidence-gated) and localization
  within the original fonts.
- Phase 27 proves realtime online play works peer-to-peer over WebRTC.

Phases 11 onward inherit the Phase 10 standing rule: a phase gates on something
a player can see or play, captured from real local data via the visual gate —
never on infrastructure alone.

## Operating cadence

Per the framework methodology (`pm/roadmap/roadmap-builder.md` §3):
every shipping commit updates, in the same commit:

1. The story file header (status flip).
2. The phase's `current-phase-status.md` story-status row + "Where we are".
3. This README's "Last updated" line.
4. Any project-canon doc touched by the story.

Per `pm/roadmap/PMO-CONTRACT.md`: the pre-commit hook gates every
commit on a fresh `.tmp/CONTRACT.md`.

For Serfbound specifically, every implementation story must identify:

1. The `freeserf.net` behavior it preserves, replaces, or intentionally drops.
2. The browser platform boundary it crosses: filesystem, rendering, audio,
   input, persistence, worker/threading, packaging, or network.
3. The evidence that proves parity or explains divergence.
4. Whether any temporary .NET reference/oracle code was used. If yes, the story
   must state why it is not product code and how it will be removed or isolated.
5. The phase gate it advances. If it does not advance a gate, it is probably
   unfocused work.

## Project metadata

- **Slug:** `serfbound`
- **Story ID prefix:** `SB` (e.g. `SB-0-01`, `SB-3-04`)
- **Greenfield?:** mixed. The browser runtime is greenfield; the behavior
  reference is the existing `freeserf.net` repository.
- **Working title decision:** `Serfbound`, accepted on 2026-06-09.
- **Runtime constraint:** final Serfbound ships as browser-native code only. No
  .NET product runtime, no desktop app, no "browser shell around .NET".
- **Runtime baseline:** TypeScript-first product code with a narrow WASM escape
  hatch only if Phase 1 or Phase 2 evidence trips a recorded stop signal.
- **Asset constraint:** developers and players may use locally procured original
  data files, but Serfbound does not commit, host, bundle, or redistribute those
  files.
- **Import baseline:** direct user-selected `.PA` file import first, drag/drop
  as same-boundary convenience, IndexedDB persistence by default, directory
  picker as optional progressive enhancement.
- **Current local asset source:** user-owned English DOS files are present under
  ignored `serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/`;
  the current loader-relevant file is `SPAU.PA`.
- **Current local reference output:** metadata-only `SPAU.PA` catalog output is
  generated under ignored `serfbound-local-data/reference-output/`.
- **Current CI-safe reference fixtures:** `rng-fixed-seed-sequence.json` and
  `map-geometry-facts.json` live under
  `pm/roadmap/serfbound/reference-fixtures/ci/`.
- **Current browser workspace:** `serfbound/` is an npm/TypeScript workspace
  with app, engine, assets, and test-support package boundaries.
- **Current CI-safe browser command:** `npm test` from `serfbound/` builds the
  workspace, runs Node's built-in test runner against committed Phase 1 fixture
  data, builds the static browser shell, and runs the Playwright smoke test
  without `serfbound-local-data/`.
- **Current static release path:** `npm run release:static` builds and inspects
  `serfbound/dist/`; `npm run test:release:static` serves the artifact at
  `/serfbound/`, checks cache headers, imports generated `SPAU.PA`, and proves
  IndexedDB restore after reload. The release mechanics are documented in
  `serfbound/docs/static-hosting-release.md`.
- **Current operational docs:** `serfbound/docs/player-guide.md` documents
  local data import, start/play, save/load/reset, troubleshooting, and browser
  origin storage behavior; `serfbound/docs/developer-guide.md` documents setup,
  CI-safe vs local/manual tests, oracle fixtures, PMO flow, and release
  commands. `npm run test:docs` verifies required release documentation topics.
- **Current release readiness:** `pm/roadmap/serfbound/phase-9-release-operations/release-readiness-report.md`
  records the final Phase 9 checklist, phase gate audit, browser matrix,
  performance snapshot, asset-boundary audit, issue intake, known limitations,
  and go decision for the first browser-slice release candidate.
- **Current runtime boundary baseline:**
  `pm/roadmap/serfbound/adoption/runtime-module-boundaries.md`.
- **Current static shell proof:**
  `pm/roadmap/serfbound/phase-2-browser-foundation/artifacts/story-04-app-shell-desktop.png`.
- **Current engine parity primitives:** `@serfbound/engine` implements
  fixed-width numeric helpers, `FreeserfRandom`, and `MapGeometry` direction,
  movement, distance, and projection helpers matched against
  `rng-fixed-seed-sequence.json` and `map-geometry-facts.json`, plus a
  source-derived `SerfboundGameState` tick/snapshot skeleton and combined
  engine parity proof.
- **Current browser import boundary:** direct local `.PA` file selection accepts
  `SPAU.PA`, rejects unsupported names recoverably, and keeps real local asset
  checks opt-in/manual.
- **Current DOS asset catalog parser:** `@serfbound/assets` parses user-selected
  `SPAU.PA` bytes in the browser, reads the size/count header and catalog table,
  applies DOS loader fixups, and compares selected facts to ignored local oracle
  metadata through opt-in local checks.
- **Current browser asset persistence:** `@serfbound/app` persists the current
  imported `SPAU.PA` record in IndexedDB after successful catalog parsing,
  restores it on reload, and exposes a clear/reset flow.
- **Current typed asset catalog:** `@serfbound/assets` exposes terrain,
  object, serf, UI, and audio resource groups plus renderer/UI/audio request
  handles while keeping raw archive offsets behind asset internals.
- **Current DOS sprite decoding:** `@serfbound/assets` decodes DOS palettes
  (3/3997/3998) and solid/transparent/overlay/mask sprite payloads from
  imported `SPAU.PA` bytes into RGBA, ported from
  `Freeserf.Core/Data/DataSourceDos.cs`, with synthetic-fixture CI coverage and
  opt-in real-data checks.
- **Current browser-experience proof:** scale baselines measured and
  CI-guarded (size-6 full sim ~2M ticks/s, ~3ms scene builds), worker
  offload rejected on evidence, touch play proven on a phone viewport,
  and the PWA's offline shell boots imported games without a network.
- **Current complete-game proof:** the 31-mission campaign table is
  ported exactly with start-screen selection; AI opponents play through
  recorded world actions (fixture-deterministic founding, the reference
  build order, threat-leveled garrisons, attacks); the original .SAV
  binary layout parses and continues; speeds, autosave, and a leak-free
  2M-tick soak close the played-mission gate.
- **Current sound proof:** the 39 reference DOS clips decode with exact
  ConvertToWav parity and fire on commands, popups, construction, defeat,
  and production work loops; XMI tracks parse with the exact chunk walk
  and play through the recorded WebAudio-oscillator path; mute settings
  persist and tab visibility pauses/resumes.
- **Current original-interface proof:** the UI is decoded original art —
  game font, icons, frames, panel bar, popups (build pages, resources
  box, knight occupation), minimap with click-to-navigate, notifications,
  and the start screen with the decoded logo; the founding e2e drives the
  whole flow through the authentic UI.
- **Current conquest proof:** the combat port resolves seeded fights with
  the exact reference math and tables (independent-reimplementation parity
  across seeds), garrisons occupy and project territory, and capture
  transfers buildings, flags, and ground until a castle falls
  (`data-serfbound-game-over`).
- **Current working-economy proof:** every classic chain runs concurrently
  in one settlement (the SB-14-05 gate: twelve buildings on five road
  chains complete through serf labor, then wood, food, meat, mining,
  metallurgy, and tools all produce without deadlock), with demand-driven
  dispatch (delivered + in-flight < 4), lossless transport, food-gated
  mining over depleting deposits, and live stock stats exposed via
  `data-serfbound-stock-summary`.
- **Current living-settlement proof:** the serf engine ports the reference
  state machine core (tick/counter pattern, walking animation formulas,
  collision waiting), transporters and builders run construction logistics
  end-to-end in the browser, and serfs render through the authentic
  animation-table → appearance-table → player-color torso chain.
- **Current settlement proof:** the engine game world ports the reference
  flag/road graph, build validity, castle/territory (influence tables), and
  A* pathfinding; the app founds settlements end-to-end (castle → roads →
  buildings with stage sprites) with saves replaying the world-action log.
- **Current generated-world proof:** `@serfbound/engine` ports the classic
  map generator with tile-for-tile fixture parity
  (`map-generator-classic.json`); running games render the generated world
  with decoded art, animated waves, and arrow-key/drag scrolling with
  wrapping.
- **Current real-data visual proof:** decoded-scene screenshots from local
  `SPAU.PA` live under `phase-10-authentic-asset-rendering/artifacts/` and
  regenerate via opt-in `npm run capture:local:screenshots`; the opt-in local
  asset suite asserts real decode, composition, and decoded-scene facts.
- **Current decoded render path:** `@serfbound/app` builds decoded render
  assets from imported archive bytes (terrain triangle composition + runtime
  texture atlas), renders them through a textured WebGL2 path with authentic
  placement math, and falls back to the catalog scene for non-decodable
  archives; exercised in CI by a generated decodable fixture archive.
- **Current renderer API baseline:** Phase 5 selected a small first-party WebGL2
  renderer as the baseline, with Canvas2D reserved for generated debug/test
  paths and WebGPU deferred as a later accelerator.
- **Current render-layer proof:** `@serfbound/app` renders a WebGL2 map-like
  scene from generated CI-safe primitives, rebuilds scene metadata from typed
  `SPAU.PA` catalog requests after import/restore, resizes the canvas backing
  buffer to the displayed CSS size, and has desktop/mobile Playwright framing
  screenshots under `phase-5-renderer-projection/artifacts/`.
- **Current pointer interaction proof:** `@serfbound/app` resolves canvas
  pointer positions to view, map, and tile coordinates through
  `resolveFirstRenderLayerPointer()` and the shared Phase 5 projection math,
  then exposes hover/selection debug state in the browser shell.
- **Current command routing proof:** `@serfbound/engine` exposes a DOM-free
  `SerfboundCommandRouter`; `@serfbound/app` routes canvas tile selection
  through `debug.inspect-map-tile`, records deterministic command results, and
  routes `game.build` flag placement through running local game state.
- **Current first playable UI shell:** `@serfbound/app` exposes player-facing
  Data, Game, Map, Hover, Selected Tile, and Action panels, a visible
  `Start game` path, recoverable unsupported-data states, and desktop/mobile
  screenshot evidence under `phase-6-ui-input-shell/artifacts/`.
- **Current interaction ergonomics baseline:** Phase 6 ships a manual
  interaction script, shortcut conflict review, and ergonomics audit covering
  mouse-style pointer input, trackpad-equivalent pointer paths, touch-style
  PointerEvent handling, import recovery, start-game state, selected tile
  feedback, and desktop/mobile panel layout.
- **Current local game start proof:** `@serfbound/engine` initializes a
  deterministic local single-player game from imported `SPAU.PA` catalog
  metadata; `@serfbound/app` requires imported data before starting, swaps the
  command router onto the initialized game state, and displays the settlement
  map with screenshot evidence under `phase-7-playable-slice/artifacts/`.
- **Current first playable action proof:** `@serfbound/engine` mutates
  `builtStructures` through `game.build` flag commands, rejects occupied tiles
  and deferred build targets recoverably, and `@serfbound/app` renders the built
  flag back onto the browser WebGL2 map with screenshot evidence under
  `phase-7-playable-slice/artifacts/`.
- **Current browser save/load proof:** `@serfbound/engine` restores validated
  `serfbound.local-game` snapshots; `@serfbound/app` saves versioned browser
  records with imported-data source metadata in a dedicated IndexedDB store,
  reloads saved state after browser reload, rejects corrupt or unsupported
  storage versions recoverably, and keeps imported-data reset separate from
  local-save reset.
- **Current playable-loop proof:** Phase 7 manual evidence proves a browser
  user can import local `SPAU.PA`, start a local game, build a flag, save,
  reload, load, and see the restored built flag with no .NET runtime, desktop
  shell, native launcher, or bundled original data.
- **Current performance baseline:** Phase 8 measures the first playable slice
  with `npm run measure:performance`, capturing simulation tick average,
  desktop Chromium frame cadence, local `SPAU.PA` import, save, and reload/load
  timings plus explicit regression stop signals.
- **Current worker/threading strategy:** Phase 8 keeps the current playable
  slice main-thread-first. Web Workers are deferred until measured stop signals
  trip; any future worker path must prove message contracts, transfer/clone
  costs, deterministic equivalence, browser compatibility, and failure
  recovery before being enabled.
- **Current persistence recovery proof:** Phase 8 browser tests cover corrupt
  imported-data reset, corrupt save reset without losing imported data, and
  quota/write error UI feedback. Player-facing troubleshooting lives in
  `phase-8-browser-hardening/persistence-recovery-guide.md`.
- **Current browser compatibility proof:** Phase 8 compatibility tests cover
  desktop Chromium, desktop Firefox, desktop WebKit, mobile Chrome, and mobile
  Safari Playwright positions for WebGL2 rendering, file import, IndexedDB
  storage, pointer/touch-style input, keyboard focus, contrast, and
  reduced-motion state. See
  `phase-8-browser-hardening/browser-compatibility-matrix.md`.
- **Current release CI proof:** Phase 9 adds `.github/workflows/serfbound-ci.yml`
  and `npm run ci:release` for data-free browser release checks without
  `serfbound-local-data/`, .NET product builds, or desktop packaging.

## Glossary

- **Reference implementation:** The existing C# `freeserf.net` codebase.
- **Browser-native:** The shipped product runtime should use browser APIs and
  web build/test tooling. Temporary reference/oracle work may inspect the C#
  repo, but final Serfbound product code is not .NET.
- **Pure browser:** The app must run in a browser without a desktop companion,
  native launcher, local server dependency for normal play, or hidden desktop
  runtime.
- **Parity harness:** Tests or scripts that compare browser implementation
  behavior against captured reference behavior.
- **User-provided data:** Original DOS/Amiga game data supplied by the player,
  never bundled by Serfbound.
