# Serfbound Oracle Targets

**Status:** accepted target list for Phase 1 capture.
**Date:** 2026-06-09.
**Story:** SB-1-01.

## Purpose

Select the first `freeserf.net` reference outputs Serfbound will capture before
porting behavior. These targets are deliberately small, deterministic, and tied
to exact source files so Phase 1 can produce reviewable fixtures instead of a
large opaque dump.

Temporary .NET/C# code may be used only to emit these reference outputs.
Serfbound product code must remain browser-native and must consume fixture data,
not reference tooling.

## Capture Order

| Order | Target id | Data requirement | First capture story | Future phase protected | Why this target is first-wave |
|---|---|---|---|---|---|
| 1 | `rng.fixed-seed-sequence` | data-free / CI-safe | SB-1-02 | Phase 3 | Smallest deterministic behavior with high blast radius; protects numeric wrapping and map generation. |
| 2 | `map.geometry-facts` | data-free / CI-safe | SB-1-05 | Phase 3, Phase 5, Phase 6 | Protects map positions, direction cycles, wraparound, and screen/map conversion assumptions. |
| 3 | `serializer.state-fixtures` | data-free / CI-safe | SB-1-02 or later Phase 1 extension | Phase 3, Phase 7, future sync work | Protects state ordering, dirty arrays/maps, and future browser save/state design. |
| 4 | `dos.spau-catalog-metadata` | local/manual `SPAU.PA` | SB-1-03 | Phase 4, Phase 5 | Gives the browser parser a real local archive target without committing original asset payloads. |

SB-1-02 only needs to capture at least one data-free target. Start with
`rng.fixed-seed-sequence`; SB-1-05 adds `map.geometry-facts` as the third
captured output because the fixture remained small and reviewable. SB-1-03 owns
the local/manual `SPAU.PA` metadata target.

## Target Details

### `rng.fixed-seed-sequence`

| Field | Value |
|---|---|
| Data requirement | data-free / CI-safe |
| Primary source | `Freeserf.Core/Random.cs` |
| Exact classes/methods | `Freeserf.Random`, constructors `Random(ushort)`, `Random(string)`, `Random(ushort base0, ushort base1, ushort base2)`, `Next()`, `ToString()`, operator `^` |
| Secondary source | `Freeserf.Core/MapGenerator.cs` call sites using random output |
| Expected output | JSON payload with fixed seed cases. Each case records constructor input, step number, `before` state `[s0,s1,s2]`, `next` value, `after` state `[s0,s1,s2]`, and `ToString()` where applicable. |
| Fixture class | CI-safe reference fixture under `pm/roadmap/serfbound/reference-fixtures/ci/` |
| Protects | Phase 3 numeric/random rules and later map generator parity |
| Review rule | Exact integer comparison; no tolerance and no timestamps in payload |

Rationale: this is the smallest high-value target. It exercises 16-bit wrapping,
bit rotation, mutation order, and string seed conversion without original data,
rendering, audio, or browser APIs.

### `map.geometry-facts`

| Field | Value |
|---|---|
| Data requirement | data-free / CI-safe |
| Primary sources | `Freeserf.Core/MapGeometry.cs`, `Freeserf.Core/CoordinateSpace.cs`, `Freeserf.Core/Map.cs`, `Freeserf.Core/Render/RenderMap.cs` |
| Exact classes/methods | `Direction`, `DirectionExtensions.Turn()`, `DirectionExtensions.Reverse()`, `DirectionCycleCW.CreateDefault()`, `DirectionCycleCW.CreateWithout()`, `DirectionCycleCCW.CreateDefault()`, `MapGeometry.PositionColumn()`, `PositionRow()`, `Position()`, `PositionAdd()`, `DistanceX()`, `DistanceY()`, `Move()`, `MoveRight()`, `MoveDownRight()`, `MoveDown()`, `MoveLeft()`, `MoveUpLeft()`, `MoveUp()`, `MoveRightN()`, `MoveDownN()`, `CoordinateSpace.TileSpaceToMapSpace()`, `MapSpaceToViewSpace()`, `ViewSpaceToMapSpace()`, `MapSpaceToTileSpace()`, `ViewSpaceToTileSpace()`, `RenderMap.TILE_WIDTH`, `RenderMap.TILE_HEIGHT` |
| Expected output | JSON rows for selected map sizes and positions: dimensions, masks, row shift, direction cycles, turn/reverse samples, position encode/decode, move/wrap results, distance samples, and projection samples using synthetic heights. |
| Fixture class | CI-safe reference fixture under `pm/roadmap/serfbound/reference-fixtures/ci/` |
| Protects | Phase 3 map primitives, Phase 5 projection, Phase 6 pointer-to-map interaction |
| Review rule | Exact integer comparison; selected rows only, not full-map dumps |

Rationale: map geometry is shared by simulation, rendering, and input. A small
fixture prevents later browser code from making incompatible coordinate choices.

### `serializer.state-fixtures`

| Field | Value |
|---|---|
| Data requirement | data-free / CI-safe |
| Primary sources | `Freeserf.Core/Serialize/StateSerializer.cs`, `DataAttribute.cs`, `DirtyArray.cs`, `DirtyMap.cs`, `Freeserf.Core/GameState.cs`, `Freeserf.Core/FlagState.cs`, `Freeserf.Test/Freeserf.Core/Serialize/StateSerializerTests.cs`, `TestState.cs` |
| Exact classes/methods | `StateSerializer.Serialize()`, `StateSerializer.Deserialize()`, `GameStateSerializer.SerializeFrom()`, `GameStateSerializer.DeserializeInto()`, `TestState`, `TestState.InnerState`, `TestState_DataAttribute`, `FlagState` |
| Expected output | JSON manifest plus hex/checksum facts for selected serializer inputs: empty `TestState`, populated `TestState`, `TestState_DataAttribute`, and empty `FlagState`; include `full` and `leaveOpen` options, byte length, SHA-256, and short hex preview. |
| Fixture class | CI-safe reference fixture under `pm/roadmap/serfbound/reference-fixtures/ci/` |
| Protects | Phase 3 state skeleton, Phase 7 browser save/load loop, future sync/state compatibility |
| Review rule | Byte length and SHA-256 compare exactly; binary payload stays small or is summarized with a manifest |

Rationale: Serfbound may choose a browser-native save format later, but it still
needs an explicit reference for ordering, dirty structures, and state snapshot
semantics before implementing save/load behavior.

### `dos.spau-catalog-metadata`

| Field | Value |
|---|---|
| Data requirement | local/manual `SPAU.PA`; not CI-required |
| Local source | `serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA` |
| Local source checksum | `4a652471c4185d324b16fadd736f2464210df5d8938136aaa0ccc4a43c790ca2` |
| Primary sources | `Freeserf.Core/Data/DataSourceDos.cs`, `Freeserf.Core/Data/Data.cs`, `Freeserf.Core/Data/DataSource.cs`, `pm/roadmap/serfbound/adoption/local-asset-inventory.md` |
| Exact classes/methods | `DataSourceDos.Check()`, `DataSourceDos.Load()`, `DataSourceDos.GetSpriteParts()`, `DataSourceDos.GetSound()`, `DataSourceDos.GetMusic()`, internal archive entry count/read loop in `Load()`, `Data.GetResourceName()`, `Data.GetResourceCount()`, `Data.GetResourceType()`, `DataSource.GetSpriteInfo()` |
| Expected output | Metadata-only JSON: source label, file name, file size, SHA-256, detected source type, archive entry count, selected entry offset/size facts, resource names/counts/types, selected resource availability flags, and derived checksums of metadata only. |
| Fixture class | Local/manual output under ignored `serfbound-local-data/reference-output/`; committed evidence may contain checksums and summaries only |
| Protects | Phase 4 browser import/parser, Phase 4 typed asset catalog, Phase 5 first local asset-backed scene |
| Review rule | No raw original bytes, no extracted sprites/sounds/music/palettes, no committed `.PA` payload, clear skip when local data is missing |

Rationale: the project has a real local DOS source. Phase 4 should parse against
that reality, but only through metadata/checksums that keep CI and Git clean.

## Fixture Policy

- CI-safe fixtures live under `pm/roadmap/serfbound/reference-fixtures/ci/`.
- Local/manual outputs live under ignored `serfbound-local-data/reference-output/`.
- Every fixture should include schema version, target id, source commit, source
  files, generation command, data requirement, checksum algorithm, checksum
  value, and payload.
- Browser product code must not import C# capture helpers or require `.NET`.
- Browser tests may load fixture files as JSON/binary data after Phase 2 creates
  the workspace.

## Stop Signals

Revisit this target list if:

- the first data-free target cannot be captured deterministically twice;
- a target requires committing original asset bytes;
- a target requires broad gameplay setup before a small fixture exists;
- a target cannot name exact source files and methods;
- browser tests would need to run .NET tooling instead of consuming fixtures.

## Source Verification Commands

```bash
rg -n "class Random|public Random\\(|public ushort Next\\(|public override string ToString|operator \\^" Freeserf.Core/Random.cs
rg -n "enum Direction|Turn\\(|Reverse\\(|class DirectionCycle|CreateDefault|CreateWithout|class MapGeometry|PositionColumn|PositionRow|Position\\(|PositionAdd\\(|DistanceX|DistanceY|Move\\(|MoveRight|MoveDownRight|MoveDown|MoveLeft|MoveUpLeft|MoveUp|Init\\(" Freeserf.Core/MapGeometry.cs
rg -n "class CoordinateSpace|TileSpaceToMapSpace|TileSpaceToViewSpace|MapSpaceToViewSpace|ViewSpaceToMapSpace|MapSpaceToTileSpace|ViewSpaceToTileSpace|NormalizeMapPosition|TILE_WIDTH|TILE_HEIGHT" Freeserf.Core/CoordinateSpace.cs Freeserf.Core/Render/RenderMap.cs
rg -n "class StateSerializer|Serialize\\(|Deserialize\\(|Write\\(|Read\\(|DataAttribute|DirtyArray|DirtyMap|class GameStateSerializer|SerializeFrom|DeserializeInto" Freeserf.Core/Serialize/StateSerializer.cs Freeserf.Core/Serialize/DataAttribute.cs Freeserf.Core/Serialize/DirtyArray.cs Freeserf.Core/Serialize/DirtyMap.cs Freeserf.Core/GameState.cs
rg -n "EmptyState|TestState_Should|FlagState|TestState_DataAttribute|StateSerializer.Serialize|StateSerializer.Deserialize|class TestState|class InnerState|class TestState_DataAttribute" Freeserf.Test/Freeserf.Core/Serialize/StateSerializerTests.cs Freeserf.Test/Freeserf.Core/Serialize/TestState.cs
rg -n "class DataSourceDos|DefaultFileNames|SPAU|Load\\(|entryCount|entries\\.Add|FixUp|GetSpriteParts|GetMusic|GetSound|GetObject|Resource\\(|dataResources|GetResourceCount|GetResourceName|GetResourceType" Freeserf.Core/Data/DataSourceDos.cs Freeserf.Core/Data/Data.cs Freeserf.Core/Data/DataSource.cs
```
