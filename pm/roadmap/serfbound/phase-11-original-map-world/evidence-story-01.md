# Evidence — SB-11-01 — Capture Map Generator Oracle Fixtures

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `pm/roadmap/serfbound/reference-tools/capture-map-generator-oracle.py` —
  new reference tool mirroring `Freeserf.Core/MapGenerator.cs`
  (`ClassicMissionMapGenerator`: Midpoints, preserveBugs=true, water level 20,
  max lake area 14, spikyness 0x9999) plus the `Map.cs` spiral pattern,
  `GetRandomCoordinate`, `MapSpaceFromObject`, and `MapGeometry` movement
  semantics. Preserved reference quirks are ported and commented: the
  first-midpoint high-bit merge, the `TypeUp`-assigned-twice island removal
  bug, and the `HexagonTypesInRange` up-tile down-type check.
- `pm/roadmap/serfbound/reference-fixtures/ci/map-generator-classic.json` —
  committed CI-safe fixture: two seeds at size 3 (64x64), full per-position
  heights, typesUp/Down, objects, minerals, resourceAmounts plus per-array
  sha256 digests and generator parameters.
- `serfbound/tests/ci/oracle-fixtures.test.mjs` — validates the new fixture
  against the oracle header contract and asserts array completeness, value
  ranges, and content sanity (water, grass, trees, minerals all present).

## Verification artifacts

Capture run:

```text
wrote pm/roadmap/serfbound/reference-fixtures/ci/map-generator-classic.json
  size=3 seed=[4660, 22136, 39612] waterUp=379 trees=191 minerals=833
  size=3 seed=[49374, 48879, 66] waterUp=118 trees=216 minerals=815
```

Reproducibility — two consecutive runs produce byte-identical output:

```text
47636a89e4ba38db17d26bbfcc9e09a704cdcbac4a8040ff5962b701011be94a  (run 1)
47636a89e4ba38db17d26bbfcc9e09a704cdcbac4a8040ff5962b701011be94a  (run 2)
```

Fixture contract tests (`node --test tests/ci/oracle-fixtures.test.mjs`):

```text
# tests 7
# pass 7
# fail 0
```

## Acceptance criteria — re-checked

- [x] Fixture schema covers per-position height, type-up/type-down, object,
  and mineral data plus generator parameters and seed.
- [x] Two small-map fixtures (size 3) committed and validated by the fixture
  contract checks.
- [x] Capture is reproducible (byte-identical sha256 across runs).

## Deviations from plan

- The oracle is a Python mirror of the C# source (the Phase 1 pattern), since
  no .NET SDK is available in this environment. Risk recorded in the phase
  doc: the SB-11-02 TypeScript port is written independently from the C#
  source, so fixture agreement is two independent derivations agreeing.

## Follow-ups

- SB-11-02 ports the generator to `@serfbound/engine` and must match these
  digests exactly.
