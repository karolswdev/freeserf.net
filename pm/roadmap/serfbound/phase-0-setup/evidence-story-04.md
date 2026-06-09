# Evidence — SB-0-04 — Design Deterministic Parity Harness

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `pm/roadmap/serfbound/adoption/parity-harness-design.md` - new deterministic
  parity harness design.
- `pm/roadmap/serfbound/README.md` - adds the parity harness design to source
  canon.
- `pm/roadmap/serfbound/adoption/phase-gate-verification-matrix.md` - updates
  the current gap summary to point at SB-0-05 after this story.
- `pm/roadmap/serfbound/adoption/reference-architecture-inventory.md` - removes
  the runtime open question already resolved by SB-0-03 and records the new
  parity decision.
- `pm/roadmap/serfbound/phase-0-setup/story-04-parity-harness-design.md` -
  marks SB-0-04 done and checks acceptance criteria.
- `pm/roadmap/serfbound/phase-0-setup/current-phase-status.md` - marks the
  parity-harness exit criterion and story table row complete.

## Verification artifacts

- Story and phase context:
  - `sed -n '1,240p' pm/roadmap/serfbound/phase-0-setup/story-04-parity-harness-design.md`
  - `sed -n '1,260p' pm/roadmap/serfbound/phase-0-setup/current-phase-status.md`
  - `sed -n '1,260p' pm/roadmap/serfbound/adoption/reference-architecture-inventory.md`
- Source inspection for parity targets:
  - `sed -n '1,220p' Freeserf.Core/Random.cs`
  - `sed -n '1,620p' Freeserf.Core/MapGeometry.cs`
  - `sed -n '1,620p' Freeserf.Core/CoordinateSpace.cs`
  - `rg -n "class Map|Position\\(|Move(Right|DownRight|Down|Left|UpLeft|Up)|PositionColumn|PositionRow|PositionAdd|PositionAddSpirally|Size|Columns|Rows|GetHeight|SetHeight" Freeserf.Core/Map.cs Freeserf.Core/MapGeometry.cs Freeserf.Core/MapGenerator.cs`
  - `sed -n '1,260p' Freeserf.Test/Freeserf.Core/Serialize/StateSerializerTests.cs`
  - `sed -n '1,220p' Freeserf.Test/Freeserf.Core/Serialize/TestState.cs`
  - `find Freeserf.Test/Freeserf.Core/Serialize -type f -maxdepth 1 -print | sort`
  - `sed -n '320,420p' Freeserf.Core/Data/DataSourceDos.cs`
  - `sed -n '1,220p' pm/roadmap/serfbound/adoption/local-asset-inventory.md`
  - `rg -n "InternalsVisibleTo|Freeserf.Test|<AssemblyName|RootNamespace" Freeserf.Core Freeserf.Test Freeserf.Core/Freeserf.Core.csproj Freeserf.Test/Freeserf.Test.csproj`
- Phase 1 story alignment:
  - `sed -n '1,220p' pm/roadmap/serfbound/phase-1-reference-oracle/story-01-select-oracle-targets.md`
  - `sed -n '1,220p' pm/roadmap/serfbound/phase-1-reference-oracle/story-02-data-free-reference-output.md`
  - `sed -n '1,220p' pm/roadmap/serfbound/phase-1-reference-oracle/story-03-local-spau-resource-output.md`
  - `sed -n '1,220p' pm/roadmap/serfbound/phase-1-reference-oracle/story-04-oracle-fixture-contract.md`
- PMO and structural checks:
  - `git diff --check` -> passed with no output.
  - placeholder/template scan over `pm/roadmap/serfbound` and `AGENTS.md` ->
    passed with no output.
  - `for f in pm/roadmap/serfbound/phase-*/story-[0-9]*.md; do rg -q "^## Problem$" "$f" && rg -q "^## Scope$" "$f" && rg -q "^## Acceptance criteria$" "$f" && rg -q "^## Test plan$" "$f" || echo "missing required section: $f"; done` -> passed with no output.
  - `bash -n .githooks/pre-commit .githooks/post-commit .githooks/work-log-read .githooks/work-log-summarize` -> passed with no output.
  - `test -f Freeserf.Core/Random.cs && test -f Freeserf.Core/MapGeometry.cs && test -f Freeserf.Core/CoordinateSpace.cs && test -f Freeserf.Core/Map.cs && test -f Freeserf.Core/MapGenerator.cs && test -f Freeserf.Core/Render/RenderMap.cs && test -f Freeserf.Core/GameState.cs && test -f Freeserf.Core/FlagState.cs && test -f Freeserf.Core/Data/DataSourceDos.cs && test -f Freeserf.Core/Data/Data.cs && test -f Freeserf.Core/Data/DataSource.cs && test -f Freeserf.Test/Freeserf.Core/Serialize/StateSerializerTests.cs && test -f Freeserf.Test/Freeserf.Core/Serialize/TestState.cs && echo referenced-files-present` -> `referenced-files-present`.
  - `rg -n "Should runtime|No web runtime|SB-0-04: design|SB-0-03: decide|next responsible move is SB-0-04|Phase 0 story SB-0-04" pm/roadmap/serfbound || true` -> passed with no output.
  - `test -f pm/roadmap/serfbound/adoption/parity-harness-design.md && test -f pm/roadmap/serfbound/phase-0-setup/evidence-story-04.md && echo sb-0-04-artifacts-present` -> `sb-0-04-artifacts-present`.
  - `command -v dotnet || true` -> no output; `dotnet` is still not on `PATH`.

## Acceptance criteria — re-checked

- [x] `pm/roadmap/serfbound/adoption/parity-harness-design.md` exists —
  created in this story.
- [x] The design names the first three parity targets, with source files and
  expected output shape — proven by First Parity Targets.
- [x] The design distinguishes data-free tests from tests requiring
  user-provided original data — proven by First Parity Targets and Local/Manual
  Parity Target.
- [x] The design defines where generated reference outputs may live and what
  must be excluded from Git — proven by Fixture Locations.
- [x] The design includes at least one map/generator target and one state/tick
  or serialization target — proven by map geometry/projection and state
  serializer targets.

## Residual risk

This story does not implement oracle capture, run `.NET` tests, or generate
fixtures. Those are Phase 1 responsibilities. `dotnet` was previously checked
and is not on `PATH` in this environment, so Phase 1 needs either a repaired
local SDK path or another environment for reference capture.
