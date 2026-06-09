# Serfbound Deterministic Parity Harness Design

**Status:** accepted baseline for Phase 1.
**Date:** 2026-06-09.
**Story:** SB-0-04.

## Purpose

Serfbound must not become a different game by accident. The parity harness
exists to capture small, deterministic facts from `freeserf.net` and make later
browser-native TypeScript code prove that it still matches those facts.

The harness is a reference boundary, not product architecture. Temporary .NET
or C# capture code may exist only to emit fixtures from the current repository.
Final Serfbound product code must not import, execute, bundle, or depend on the
.NET reference tooling.

## Harness Shape

The parity flow has four steps:

1. **Capture:** isolated reference tooling runs against `Freeserf.Core` and
   writes deterministic fixture output.
2. **Review:** fixture output is small, text-first, source-attributed, and easy
   to diff.
3. **Consume:** browser-native TypeScript tests load tracked CI-safe fixtures
   and compare Serfbound output exactly.
4. **Isolate local data:** any fixture that requires original DOS/Amiga data is
   local/manual, metadata-only, and ignored unless converted into a small
   reviewed checksum/summary.

Phase 1 owns capture. Phase 2 owns CI consumption. Phases 3 and 4 use these
fixtures as their first implementation gates.

## First Parity Targets

| Priority | Target | Source files/classes | Data requirement | Expected output shape | Protects |
|---|---|---|---|---|---|
| 1 | RNG fixed-seed sequence | `Freeserf.Core/Random.cs`; later map generator call sites in `Freeserf.Core/MapGenerator.cs` | Data-free / CI-safe | JSON rows for fixed seeds, each row containing seed input, per-step `before` state, `next` value, `after` state, and `ToString()` value where stable | TypeScript fixed-width integer semantics, map-generation determinism |
| 2 | Map geometry and projection facts | `Freeserf.Core/MapGeometry.cs`, `Freeserf.Core/Map.cs`, `Freeserf.Core/CoordinateSpace.cs`, `Freeserf.Core/Render/RenderMap.cs` | Data-free / CI-safe, using synthetic map heights where projection needs heights | JSON rows for selected sizes and positions: `columns`, `rows`, masks, `Position()`, column/row extraction, direction turns/reverses, move results, wraparound distances, and tile/map/view transform samples | Phase 3 map primitives, Phase 5 projection, Phase 6 pointer-to-map routing |
| 3 | State serializer byte contract | `Freeserf.Core/Serialize/*`, `Freeserf.Core/GameState.cs`, `Freeserf.Core/FlagState.cs`, `Freeserf.Test/Freeserf.Core/Serialize/*` | Data-free / CI-safe | JSON manifest plus binary or hex/checksum output for selected serializer inputs: empty `TestState`, populated `TestState`, `TestState_DataAttribute`, and empty `FlagState`; include serializer options `full` and `leaveOpen` | Browser save/state model, dirty-state parity, future sync/state snapshot work |

## Local/Manual Parity Target

| Target | Source files/classes | Data requirement | Expected output shape | Git policy |
|---|---|---|---|---|
| DOS `SPAU.PA` resource catalog metadata | `Freeserf.Core/Data/DataSourceDos.cs`, `Freeserf.Core/Data/Data.cs`, `Freeserf.Core/Data/DataSource.cs`, `pm/roadmap/serfbound/adoption/local-asset-inventory.md` | Requires user-provided local `SPAU.PA` under ignored `serfbound-local-data/` or an explicit environment variable | Metadata-only JSON: source path label, SHA-256 checksum, entry count, selected entry sizes/offsets, resource group names/counts, availability flags, and derived checksums of metadata only | Raw `.PA`, extracted sprites, sounds, music, palettes, and original bytes are never committed. Local output lives under ignored `serfbound-local-data/reference-output/`; evidence may commit only checksums and summaries. |

## Fixture Locations

Until Phase 2 creates the browser workspace, Phase 1 should use these locations:

| Output type | Location | Tracked? | Rules |
|---|---|---:|---|
| CI-safe reference fixtures | `pm/roadmap/serfbound/reference-fixtures/ci/` | yes | Small JSON/text fixtures and tiny binary/hex fixtures are allowed when they contain no original game data. Each fixture must include schema version, target id, source commit, generation command, and checksum. |
| Local/manual reference outputs | `serfbound-local-data/reference-output/` | no | May contain metadata derived from user-owned local data. Must stay ignored. Evidence files may record command output, source checksum, and metadata checksums only. |
| Product/browser implementation outputs | Phase 2 workspace path, decided by SB-2-01/SB-2-02 | yes, if data-free | Browser tests should generate comparable output during test runs, not commit bulky result files. |
| Raw original data or extracted original assets | nowhere in Git | no | Forbidden in tracked files and release artifacts. |

The Phase 1 fixture contract (`SB-1-04`) may rename the tracked fixture folder
only if it updates this design and every consumer reference in the same commit.

## Fixture Schema Baseline

Every reference fixture should start with this minimum shape:

```json
{
  "schema": "serfbound.oracle.v1",
  "target": "rng.fixed-seed-sequence",
  "source": {
    "repository": "freeserf.net",
    "commit": "<git commit>",
    "files": ["Freeserf.Core/Random.cs"]
  },
  "dataRequirement": "data-free",
  "generatedBy": {
    "command": "<exact command>",
    "environment": "<short environment summary>"
  },
  "checksum": {
    "algorithm": "sha256",
    "value": "<checksum of canonical payload>"
  },
  "payload": {}
}
```

For local/manual fixtures, `dataRequirement` must be `local-spau-pa`, and
`payload` must be metadata-only.

## Command Policy

Preferred Phase 1 command shape:

```bash
dotnet run --project tools/Serfbound.ReferenceOracle -- \
  capture rng.fixed-seed-sequence \
  --out pm/roadmap/serfbound/reference-fixtures/ci/rng-fixed-seed-sequence.json
```

Alternative if a console tool is too much for the first oracle:

```bash
dotnet test Freeserf.Test/Freeserf.Test.csproj \
  --filter SerfboundOracle \
  --logger "console;verbosity=normal"
```

The command must be deterministic across two consecutive runs. If an internal
class such as `Freeserf.Random` requires same-assembly access, Phase 1 may add a
reference-only test/helper path because `Freeserf.Core/Freeserf.cs` already
declares `InternalsVisibleTo("Freeserf.Test")`. That helper remains oracle code,
not product code.

## Comparison Rules

- Numeric outputs compare exactly. No tolerance is allowed for integer state,
  coordinates, masks, serializer bytes, checksums, or resource metadata.
- Ordering is part of the contract unless a target explicitly defines a sorted
  canonical form.
- JSON is canonicalized before checksum calculation: stable object keys,
  newline at EOF, UTF-8, and no timestamps inside `payload`.
- Binary serializer fixtures compare by byte length and SHA-256, with optional
  short hex samples for review.
- Rendering screenshots are out of scope for Phase 1 parity. Visual proof starts
  in Phase 5 after engine/data fixtures exist.
- Local/manual `SPAU.PA` outputs must skip cleanly when the local source is
  absent; CI must not fail because original data is missing.

## Browser Consumption

Phase 2 should make TypeScript tests consume the CI-safe fixtures directly:

- `engine` tests consume RNG, map geometry, and later tick/state snapshots.
- `assets` tests consume generated fake archive fixtures in CI and compare
  local/manual `SPAU.PA` metadata only when explicitly enabled.
- `renderer` and `ui` tests consume map/projection facts, not screenshots, until
  Phase 5 introduces browser pixel/screenshot evidence.
- Product code never imports .NET capture helpers. Test code reads fixture data
  as JSON/binary artifacts.

## Stop Signals

Revisit the harness design before Phase 2 exits if any of these occur:

- First data-free fixture cannot be generated deterministically twice from the
  same source commit.
- A proposed fixture requires committing original asset bytes.
- Browser tests need to run .NET tooling during normal CI instead of consuming
  captured fixtures.
- Serializer fixtures are too large or opaque to review without a smaller
  checksum/manifest layer.
- Map geometry/projection fixtures require real game assets before synthetic
  data-free checks can pass.

## Phase 1 Story Mapping

| Phase 1 story | Harness responsibility |
|---|---|
| SB-1-01 Select First Oracle Targets | Convert this baseline into `oracle-targets.md`, confirm target order, and name exact capture methods/commands. |
| SB-1-02 Capture Data-Free Reference Output | Implement the first CI-safe capture, preferably RNG first, then map geometry or serializer if feasible. |
| SB-1-03 Capture Local SPAU.PA Resource Output | Emit metadata-only local `SPAU.PA` output under ignored local data paths and record summary/checksums in evidence. |
| SB-1-04 Define Oracle Fixture Contract | Finalize schema, directory policy, validation rules, and product-code import restrictions before Phase 2 consumes fixtures. |

## Commands Used To Ground This Design

```bash
sed -n '1,220p' Freeserf.Core/Random.cs
sed -n '1,620p' Freeserf.Core/MapGeometry.cs
sed -n '1,620p' Freeserf.Core/CoordinateSpace.cs
rg -n "class Map|Position\\(|Move(Right|DownRight|Down|Left|UpLeft|Up)|PositionColumn|PositionRow|PositionAdd|PositionAddSpirally|Size|Columns|Rows|GetHeight|SetHeight" Freeserf.Core/Map.cs Freeserf.Core/MapGeometry.cs Freeserf.Core/MapGenerator.cs
sed -n '1,260p' Freeserf.Test/Freeserf.Core/Serialize/StateSerializerTests.cs
sed -n '1,220p' Freeserf.Test/Freeserf.Core/Serialize/TestState.cs
sed -n '320,420p' Freeserf.Core/Data/DataSourceDos.cs
rg -n "InternalsVisibleTo|Freeserf.Test|<AssemblyName|RootNamespace" Freeserf.Core Freeserf.Test Freeserf.Core/Freeserf.Core.csproj Freeserf.Test/Freeserf.Test.csproj
```
