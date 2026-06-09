# Evidence — SB-1-05 — Capture Map Geometry Reference Output

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `pm/roadmap/serfbound/reference-tools/capture-map-geometry-oracle.py` -
  isolated Phase 1 capture helper for map geometry facts.
- `pm/roadmap/serfbound/reference-fixtures/ci/map-geometry-facts.json` -
  committed CI-safe map geometry fixture.
- `pm/roadmap/serfbound/phase-1-reference-oracle/story-05-map-geometry-reference-output.md`
  - new Phase 1 extension story, shipped done with paired evidence.
- `pm/roadmap/serfbound/phase-1-reference-oracle/current-phase-status.md` -
  adds SB-1-05 to the story table and records that Phase 1 now has three
  captured outputs.
- `pm/roadmap/serfbound/adoption/oracle-targets.md` - records SB-1-05 as the
  capture story for `map.geometry-facts`.
- `pm/roadmap/serfbound/adoption/phase-gate-verification-matrix.md` - records
  three captured Phase 1 outputs and the remaining fixture-contract gap.
- `pm/roadmap/serfbound/README.md` - records the current CI-safe fixtures.

## Captured output

- Target: `map.geometry-facts`.
- Fixture:
  `pm/roadmap/serfbound/reference-fixtures/ci/map-geometry-facts.json`.
- Fixture SHA-256:
  `c5de3e91fe53c5bfedbb7cf3bc030261478dfa63f770499d72306bfe8edde27d`.
- Fixture size: 30,554 bytes.
- Data requirement: data-free / CI-safe.

## Source facts

- `Freeserf.Core/MapGeometry.cs`
  - SHA-256: `e9ae83d6c8b85716239ce29b4771e5f13f43e8d816288cdd4a2c5f2705ccfc7c`.
  - last commit: `3cea30e66dd39140adbc090102a1e405ca55efdc`.
- `Freeserf.Core/CoordinateSpace.cs`
  - SHA-256: `38f653e0bddd13500b31835b80d31e31b055d232d6b934a1967aceaa5084630f`.
  - last commit: `94778ec5f5e121d978318a040b469e093ad92e8a`.
- `Freeserf.Core/Map.cs`
  - SHA-256: `4504c5182524efeae72fdf348c3ddbbc766f175cfdf062b2b06ddca68cfb23cf`.
  - last commit: `67208c78d33a83134454ef82c82ae85fcb1352c0`.
- `Freeserf.Core/Render/RenderMap.cs`
  - SHA-256: `a525f809993fda3c63c2f284d39b1b9e9bf2b1b72356de9891df9a02fc67aa99`.
  - last commit: `b340fe1133db9b96d58917c539a90351976fe4f3`.

## Captured facts summary

- Map sizes: 3 and 4.
- Render constants:
  - `RenderMap.TILE_WIDTH`: 32.
  - `RenderMap.TILE_HEIGHT`: 20.
- Direction facts:
  - clockwise default: `Right`, `DownRight`, `Down`, `Left`, `UpLeft`, `Up`.
  - counter-clockwise default: `Up`, `UpLeft`, `Left`, `Down`, `DownRight`,
    `Right`.
  - includes turn samples for each direction with turns `-7`, `-1`, `0`, `1`,
    `3`, and `8`.
- Size 3 dimensions:
  - columns: 64.
  - rows: 64.
  - column mask: 63.
  - row mask: 63.
  - row shift: 6.
  - tile count: 4,096.
- Size 4 dimensions:
  - columns: 128.
  - rows: 64.
  - column mask: 127.
  - row mask: 63.
  - row shift: 7.
  - tile count: 8,192.
- Projection model:
  - uses synthetic heights with formula `(column * 3 + row * 5 + size) % 32`.
  - includes `TileSpaceToMapSpace`, `MapSpaceToViewSpace`,
    `ViewSpaceToMapSpace`, `MapSpaceToTileSpace`, and `ViewSpaceToTileSpace`
    samples.

## Verification artifacts

- Source inspection:
  - `sed -n '1,260p' Freeserf.Core/MapGeometry.cs`
  - `sed -n '260,620p' Freeserf.Core/MapGeometry.cs`
  - `sed -n '1,260p' Freeserf.Core/CoordinateSpace.cs`
  - `sed -n '220,280p' Freeserf.Core/CoordinateSpace.cs`
  - `sed -n '1240,1335p' Freeserf.Core/Map.cs`
  - `sed -n '2760,2810p' Freeserf.Core/Map.cs`
  - `rg -n "TILE_WIDTH|TILE_HEIGHT|class RenderMap|const" Freeserf.Core/Render/RenderMap.cs`
- Capture command:
  - `python3 pm/roadmap/serfbound/reference-tools/capture-map-geometry-oracle.py --output pm/roadmap/serfbound/reference-fixtures/ci/map-geometry-facts.json`
  - Result:
    `pm/roadmap/serfbound/reference-fixtures/ci/map-geometry-facts.json`.
- JSON validity:
  - `python3 -m json.tool pm/roadmap/serfbound/reference-fixtures/ci/map-geometry-facts.json >/tmp/serfbound-map-geometry-jsoncheck.json`
  - Result: passed with no output.
- Determinism command:
  - `first=$(shasum -a 256 pm/roadmap/serfbound/reference-fixtures/ci/map-geometry-facts.json | awk '{print $1}'); python3 pm/roadmap/serfbound/reference-tools/capture-map-geometry-oracle.py --output pm/roadmap/serfbound/reference-fixtures/ci/map-geometry-facts.json >/tmp/serfbound-map-geometry-capture-2.out; second=$(shasum -a 256 pm/roadmap/serfbound/reference-fixtures/ci/map-geometry-facts.json | awk '{print $1}'); printf 'first=%s\nsecond=%s\n' "$first" "$second"; test "$first" = "$second" && echo deterministic-map-geometry-fixture`
  - Result:
    - `first=c5de3e91fe53c5bfedbb7cf3bc030261478dfa63f770499d72306bfe8edde27d`
    - `second=c5de3e91fe53c5bfedbb7cf3bc030261478dfa63f770499d72306bfe8edde27d`
    - `deterministic-map-geometry-fixture`.
- Tool checks:
  - `python3 -m py_compile pm/roadmap/serfbound/reference-tools/capture-map-geometry-oracle.py` -> passed with no output.
- Asset safety:
  - `rg -n "SPAU|SOUNDS|SERF\\.EXE|\\.PA|\\.ADF|sprite|sound|music|palette" pm/roadmap/serfbound/reference-fixtures/ci/map-geometry-facts.json || true`
  - Result: passed with no output.
- PMO and structural checks:
  - `git diff --check` -> passed with no output.
  - `for f in pm/roadmap/serfbound/phase-*/story-[0-9]*.md; do rg -q "^## Problem$" "$f" && rg -q "^## Scope$" "$f" && rg -q "^## Acceptance criteria$" "$f" && rg -q "^## Test plan$" "$f" || echo "missing required section: $f"; done` -> passed with no output.
  - `bash -n .githooks/pre-commit .githooks/post-commit .githooks/work-log-read .githooks/work-log-summarize` -> passed with no output.
  - `git ls-files | rg -n '(^|/)(SPA.*\.PA|SOUNDS\.PA|SERF\.EXE|.*\.adf$|sounds/|music/|serfbound-local-data/)' || true` -> passed with no output.

## Acceptance criteria — re-checked

- [x] A command captures `map.geometry-facts` into a committed CI-safe fixture —
  the Python command above emits `map-geometry-facts.json`.
- [x] The fixture names exact `freeserf.net` source files and commits — source
  metadata is embedded in the fixture and summarized above.
- [x] The fixture covers at least two map sizes and includes wraparound cases —
  sizes 3 and 4 are captured with edge positions and movement samples.
- [x] The fixture includes direction cycle and turn/reverse samples — captured
  under `directionFacts`.
- [x] The fixture includes projection samples tied to `RenderMap.TILE_WIDTH`
  and `RenderMap.TILE_HEIGHT` — render constants and projection samples are
  captured.
- [x] The fixture is deterministic across two consecutive runs — both runs
  produced SHA-256
  `c5de3e91fe53c5bfedbb7cf3bc030261478dfa63f770499d72306bfe8edde27d`.
- [x] The capture helper is isolated from final browser product code — helper is
  under `pm/roadmap/serfbound/reference-tools/`, documented as temporary
  reference tooling, and not imported by product runtime code.

## Residual risk

The local C#/.NET toolchain is unavailable, so this fixture is source-derived
from small integer methods rather than generated by executing compiled C#.
Before Phase 3 claims full simulation parity, a C#-capable environment should
cross-check these fixture values against the reference implementation.

Phase 1 now has three captured outputs. It still needs SB-1-04's fixture
contract and a final Phase 1 audit before it can be marked complete.
