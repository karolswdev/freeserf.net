# Serfbound — Roadmap

**Last updated:** 2026-06-09.
**Current phase:** [phase-0-setup](./phase-0-setup/current-phase-status.md)
**Status:** planning.

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

If a phase disagrees with source canon, the phase must record the disagreement
and either prove the new behavior intentionally or defer the decision.

## Phase index

| Phase | Goal (one line) | Status | Folder |
|---|---|---|---|
| 0 | Prove the rewrite shape before implementation starts | in-progress | [phase-0-setup](./phase-0-setup/) |
| 1 | Capture trustworthy reference behavior before rewriting it | planning | [phase-1-reference-oracle](./phase-1-reference-oracle/) |
| 2 | Establish the pure-browser workspace, runtime, and CI spine | planning | [phase-2-browser-foundation](./phase-2-browser-foundation/) |
| 3 | Port deterministic simulation primitives with parity evidence | planning | [phase-3-core-simulation](./phase-3-core-simulation/) |
| 4 | Import local user-owned DOS data and expose typed assets | planning | [phase-4-data-assets](./phase-4-data-assets/) |
| 5 | Build the map renderer, projection model, and visual asset path | planning | [phase-5-renderer-projection](./phase-5-renderer-projection/) |
| 6 | Build browser input, UI shell, and game interaction loops | planning | [phase-6-ui-input-shell](./phase-6-ui-input-shell/) |
| 7 | Ship the first local playable vertical slice | planning | [phase-7-playable-slice](./phase-7-playable-slice/) |
| 8 | Harden persistence, performance, workers, and browser constraints | planning | [phase-8-browser-hardening](./phase-8-browser-hardening/) |
| 9 | Package, document, and operate Serfbound as a browser product | planning | [phase-9-release-operations](./phase-9-release-operations/) |

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
