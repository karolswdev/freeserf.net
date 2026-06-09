# Evidence — SB-1-01 — Select First Oracle Targets

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `pm/roadmap/serfbound/adoption/oracle-targets.md` - new selected oracle target
  list for Phase 1.
- `pm/roadmap/serfbound/README.md` - adds the target list to source canon.
- `pm/roadmap/serfbound/phase-1-reference-oracle/story-01-select-oracle-targets.md`
  - marks SB-1-01 done and checks acceptance criteria.
- `pm/roadmap/serfbound/phase-1-reference-oracle/current-phase-status.md` -
  marks the story table row done and records the next Phase 1 move.

## Verification artifacts

- Phase/story context:
  - `sed -n '1,220p' pm/roadmap/serfbound/phase-1-reference-oracle/story-01-select-oracle-targets.md`
  - `sed -n '1,220p' pm/roadmap/serfbound/phase-1-reference-oracle/current-phase-status.md`
  - `sed -n '1,260p' pm/roadmap/serfbound/adoption/parity-harness-design.md`
  - `sed -n '1,180p' pm/roadmap/serfbound/adoption/asset-and-legal-boundary.md`
  - `sed -n '1,120p' pm/roadmap/serfbound/adoption/local-asset-inventory.md`
- Source target inspection:
  - `rg -n "class Random|public Random\\(|public ushort Next\\(|public override string ToString|operator \\^" Freeserf.Core/Random.cs`
  - `rg -n "enum Direction|Turn\\(|Reverse\\(|class DirectionCycle|CreateDefault|CreateWithout|class MapGeometry|PositionColumn|PositionRow|Position\\(|PositionAdd\\(|DistanceX|DistanceY|Move\\(|MoveRight|MoveDownRight|MoveDown|MoveLeft|MoveUpLeft|MoveUp|Init\\(" Freeserf.Core/MapGeometry.cs`
  - `rg -n "class CoordinateSpace|TileSpaceToMapSpace|TileSpaceToViewSpace|MapSpaceToViewSpace|ViewSpaceToMapSpace|MapSpaceToTileSpace|ViewSpaceToTileSpace|NormalizeMapPosition|TILE_WIDTH|TILE_HEIGHT" Freeserf.Core/CoordinateSpace.cs Freeserf.Core/Render/RenderMap.cs`
  - `rg -n "class StateSerializer|Serialize\\(|Deserialize\\(|Write\\(|Read\\(|DataAttribute|DirtyArray|DirtyMap|class GameStateSerializer|SerializeFrom|DeserializeInto" Freeserf.Core/Serialize/StateSerializer.cs Freeserf.Core/Serialize/DataAttribute.cs Freeserf.Core/Serialize/DirtyArray.cs Freeserf.Core/Serialize/DirtyMap.cs Freeserf.Core/GameState.cs`
  - `rg -n "EmptyState|TestState_Should|FlagState|TestState_DataAttribute|StateSerializer.Serialize|StateSerializer.Deserialize|class TestState|class InnerState|class TestState_DataAttribute" Freeserf.Test/Freeserf.Core/Serialize/StateSerializerTests.cs Freeserf.Test/Freeserf.Core/Serialize/TestState.cs`
  - `rg -n "class DataSourceDos|DefaultFileNames|SPAU|Load\\(|entryCount|entries\\.Add|FixUp|GetSpriteParts|GetMusic|GetSound|GetObject|Resource\\(|dataResources|GetResourceCount|GetResourceName|GetResourceType" Freeserf.Core/Data/DataSourceDos.cs Freeserf.Core/Data/Data.cs Freeserf.Core/Data/DataSource.cs`
- Tool availability:
  - `command -v dotnet || true; command -v shasum || true; command -v rg || true`
  - Result: `dotnet` is not on `PATH`; `shasum` and `rg` are available.
- PMO and structural checks:
  - `git diff --check` -> passed with no output.
  - placeholder/template scan over `pm/roadmap/serfbound` and `AGENTS.md` ->
    passed with no output.
  - `for f in pm/roadmap/serfbound/phase-*/story-[0-9]*.md; do rg -q "^## Problem$" "$f" && rg -q "^## Scope$" "$f" && rg -q "^## Acceptance criteria$" "$f" && rg -q "^## Test plan$" "$f" || echo "missing required section: $f"; done` -> passed with no output.
  - `bash -n .githooks/pre-commit .githooks/post-commit .githooks/work-log-read .githooks/work-log-summarize` -> passed with no output.
  - `test -f Freeserf.Core/Random.cs && test -f Freeserf.Core/MapGenerator.cs && test -f Freeserf.Core/MapGeometry.cs && test -f Freeserf.Core/CoordinateSpace.cs && test -f Freeserf.Core/Map.cs && test -f Freeserf.Core/Render/RenderMap.cs && test -f Freeserf.Core/Serialize/StateSerializer.cs && test -f Freeserf.Core/Serialize/DataAttribute.cs && test -f Freeserf.Core/Serialize/DirtyArray.cs && test -f Freeserf.Core/Serialize/DirtyMap.cs && test -f Freeserf.Core/GameState.cs && test -f Freeserf.Core/FlagState.cs && test -f Freeserf.Test/Freeserf.Core/Serialize/StateSerializerTests.cs && test -f Freeserf.Test/Freeserf.Core/Serialize/TestState.cs && test -f Freeserf.Core/Data/DataSourceDos.cs && test -f Freeserf.Core/Data/Data.cs && test -f Freeserf.Core/Data/DataSource.cs && echo oracle-source-files-present` -> `oracle-source-files-present`.
  - `test -f pm/roadmap/serfbound/adoption/oracle-targets.md && test -f pm/roadmap/serfbound/phase-1-reference-oracle/evidence-story-01.md && echo sb-1-01-artifacts-present` -> `sb-1-01-artifacts-present`.
  - `git ls-files | rg -n '(^|/)(SPA.*\.PA|SOUNDS\.PA|SERF\.EXE|.*\.adf$|sounds/|music/|serfbound-local-data/)' || true` -> passed with no output.

## Acceptance criteria — re-checked

- [x] `pm/roadmap/serfbound/adoption/oracle-targets.md` exists — created in
  this story.
- [x] At least one target is data-free and suitable for CI — three targets are
  data-free/CI-safe: RNG, map geometry, and serializer fixtures.
- [x] At least one target uses local `SPAU.PA` and is marked local/manual —
  `dos.spau-catalog-metadata`.
- [x] Every target names exact source files and methods/classes to inspect —
  proven by Target Details.
- [x] Every target states the future Serfbound phase it protects — proven by
  Capture Order and Target Details.

## Residual risk

This story does not implement capture tooling or generate fixtures. SB-1-02
owns the first data-free capture and should start with `rng.fixed-seed-sequence`.
SB-1-03 owns the local/manual `SPAU.PA` metadata capture. `dotnet` is not
available in this environment yet, so capture work needs a repaired SDK path or
another environment.
