# Serfbound Oracle Fixture Contract

**Status:** accepted Phase 1 contract.
**Date:** 2026-06-09.
**Story:** SB-1-04.

## Purpose

Define the fixture rules that later Serfbound phases must obey when consuming
reference outputs. The contract keeps reference data useful without allowing
capture tooling, local assets, or .NET assumptions to leak into browser product
architecture.

This contract applies to every Phase 1 oracle target:

- `rng.fixed-seed-sequence`
- `map.geometry-facts`
- `dos.spau-catalog-metadata`

It also applies to future Phase 1 extensions such as
`serializer.state-fixtures` if they are added later.

## Directory Policy

| Output class | Path | Tracked? | Required behavior |
|---|---|---:|---|
| CI-safe reference fixtures | `pm/roadmap/serfbound/reference-fixtures/ci/` | yes | JSON/text/binary fixtures that contain no original game asset payloads. These are valid inputs for normal CI and later browser tests. |
| Local/manual reference outputs | `serfbound-local-data/reference-output/` | no | Metadata-only outputs derived from user-provided local data. These must remain ignored and must not be required by CI. |
| Reference capture helpers | `pm/roadmap/serfbound/reference-tools/` | yes | Temporary Phase 1 tooling only. Helpers may inspect source behavior or local files but must not be imported by product runtime code. |
| Product/browser implementation outputs | Phase 2 workspace path | depends | Browser tests may generate comparable outputs during test runs. Product code reads fixtures as data only; it never runs reference helpers. |
| Original data or extracted original assets | nowhere in Git | no | Forbidden in tracked files, CI artifacts, release artifacts, screenshots, generated media, and committed fixture payloads. |

## Schema Version

All JSON fixtures and local/manual outputs must include:

```json
{
  "schemaVersion": 1,
  "targetId": "map.geometry-facts",
  "dataRequirement": "data-free / CI-safe",
  "source": {},
  "generation": {}
}
```

Rules:

- `schemaVersion` is an integer. Current version is `1`.
- `targetId` must match an accepted target id in
  `pm/roadmap/serfbound/adoption/oracle-targets.md`, or the story that adds a
  new fixture must update that target list in the same commit.
- `dataRequirement` must be one of:
  - `data-free / CI-safe`
  - `local/manual SPAU.PA`
- `source` must identify the reference source files and either source-file
  checksums, source commits, or both.
- `generation` must identify the exact command and helper path used to create
  the output.
- JSON fixtures must be deterministic: stable object keys, UTF-8, newline at
  EOF, and no timestamps or machine-local absolute paths in the payload.

Any future schema version must be introduced by a PMO story that updates this
file, records migration/compatibility rules, and proves all existing consumers
still know which version they read.

## CI-Safe Fixture Rules

Tracked CI-safe fixtures must:

- live under `pm/roadmap/serfbound/reference-fixtures/ci/`;
- contain `schemaVersion`, `targetId`, `dataRequirement`, `source`, and
  `generation`;
- use `dataRequirement: "data-free / CI-safe"`;
- contain no original DOS/Amiga archive bytes, extracted sprites, palettes,
  sound, music, executable data, manuals, screenshots of original art, or other
  original payload;
- be deterministic across two consecutive generations from the same source
  tree;
- be small enough to review in ordinary Git diffs unless the story explicitly
  justifies a binary/checksum manifest;
- be consumed by browser tests as data, not as executable tooling.

Current CI-safe fixtures:

| Fixture | Target id | Required consumer phase | Validation anchor |
|---|---|---|---|
| `pm/roadmap/serfbound/reference-fixtures/ci/rng-fixed-seed-sequence.json` | `rng.fixed-seed-sequence` | Phase 3 | exact integer state, `Next()`, and `ToString()` comparisons |
| `pm/roadmap/serfbound/reference-fixtures/ci/map-geometry-facts.json` | `map.geometry-facts` | Phase 3, Phase 5, Phase 6 | exact integer map geometry, direction, distance, and projection comparisons |

## Local/Manual Output Rules

Local/manual outputs must:

- live under `serfbound-local-data/reference-output/`;
- remain ignored by Git;
- use `dataRequirement: "local/manual SPAU.PA"`;
- include `status: "present"` when the local source exists;
- include `status: "skipped"` and exit successfully when local data is absent;
- record the expected local source checksum from
  `pm/roadmap/serfbound/adoption/local-asset-inventory.md`;
- record actual source checksum when local data is present;
- record metadata and metadata checksums only;
- never write raw `.PA` bytes, extracted sprites, sounds, music, palettes,
  executable bytes, title art, or converted original assets.

Committed evidence may cite:

- generation command;
- local source path label;
- source file size;
- source SHA-256;
- output SHA-256;
- entry counts;
- resource names/counts/types;
- availability counts;
- metadata checksums;
- skip output status.

Committed evidence must not include raw payload bytes, long hex dumps of
original data, or extracted asset previews.

Current local/manual output:

| Output | Target id | Required consumer phase | Validation anchor |
|---|---|---|---|
| `serfbound-local-data/reference-output/spau-catalog-metadata.json` | `dos.spau-catalog-metadata` | Phase 4, Phase 5 | `SPAU.PA` checksum, archive header, entry counts, resource availability, metadata checksums |

## Source Attribution

Each fixture must identify source behavior with enough precision for later
audits.

For one-source fixtures, `source` may use:

```json
{
  "file": "Freeserf.Core/Random.cs",
  "sha256": "<source file sha256>",
  "lastCommit": "<last commit that touched this file>",
  "methods": ["Freeserf.Random.Next()"]
}
```

For multi-source fixtures, `source` should use:

```json
{
  "files": [
    {
      "path": "Freeserf.Core/MapGeometry.cs",
      "sha256": "<source file sha256>",
      "lastCommit": "<last commit that touched this file>"
    }
  ],
  "methods": ["MapGeometry.Position()"]
}
```

Local/manual outputs may use `referenceSources.files` for source attribution if
`source` is reserved for the local data file.

## Checksum Rules

- Source file checksums use SHA-256.
- Fixture file checksums recorded in evidence use SHA-256.
- Metadata checksums inside local/manual outputs use SHA-256 over a stable JSON
  representation of metadata only.
- A fixture's own file SHA-256 is recorded in the story evidence, not inside the
  fixture itself, unless a future schema version defines canonical
  self-checksum exclusion rules.
- If a fixture includes a checksum for a payload section, the story must define
  exactly what bytes or canonical JSON object were hashed.
- A checksum mismatch is a failing parity signal unless the story records an
  intentional source update and regenerates the fixture with evidence.

## Command Rules

Reference capture commands must be exact and copy-pastable from evidence.

Current command shape:

```bash
python3 pm/roadmap/serfbound/reference-tools/capture-rng-oracle.py \
  --output pm/roadmap/serfbound/reference-fixtures/ci/rng-fixed-seed-sequence.json
```

Local/manual commands must have a clean skip path:

```bash
python3 pm/roadmap/serfbound/reference-tools/capture-spau-catalog-metadata.py \
  --path serfbound-local-data/sources/missing/SPAU.PA \
  --output /tmp/serfbound-spau-skip.json
```

Rules:

- CI-safe fixture commands must not require `serfbound-local-data/`.
- Local/manual commands must succeed with `status: "skipped"` when local data is
  missing.
- Commands must write deterministic output across two consecutive runs.
- Commands must not fetch original data from the network.
- Commands must not execute original DOS binaries.

## Product-Code Boundary

Reference tools are not product architecture.

Forbidden:

- Serfbound product runtime importing from `pm/roadmap/serfbound/reference-tools/`.
- Browser tests invoking .NET, C#, Python reference helpers, DOS executables, or
  local companion processes during normal CI.
- Shipping reference helpers in browser release artifacts.
- Wrapping `.NET` or desktop code in a browser shell.
- Treating local/manual outputs as required CI inputs.

Allowed:

- Browser tests reading committed CI-safe fixtures as JSON/text/binary data.
- Local/manual developer commands regenerating ignored metadata outputs.
- Future C# cross-check helpers when a C# toolchain exists, as long as they stay
  quarantined under reference tooling and are not product dependencies.

Phase 2 must implement product/test consumers against fixture data, not against
capture tooling.

## Validation Rules

Before a fixture story can mark done:

1. The fixture/output has the required schema fields.
2. `targetId` matches the story and `oracle-targets.md`.
3. `dataRequirement` is correct for the fixture path.
4. The generation command is recorded and was run.
5. Two consecutive generations produce the same output checksum.
6. JSON fixtures parse with `python3 -m json.tool`.
7. CI-safe fixtures contain no original asset marker strings or tracked asset
   paths.
8. Local/manual outputs live under ignored `serfbound-local-data/`.
9. The evidence file records output checksum, source attribution, commands, and
   residual risks.

Before Phase 2 consumes fixtures:

1. TypeScript tests must parse `schemaVersion`.
2. TypeScript tests must fail on unsupported `schemaVersion`.
3. TypeScript tests must assert expected `targetId`.
4. TypeScript tests must assert expected `dataRequirement`.
5. Product code must have no import path to `reference-tools/`.

Before any release:

1. No original asset file patterns are tracked.
2. No `serfbound-local-data/` contents are bundled.
3. No reference helper is bundled into the product artifact.
4. Release documentation still states that players supply their own original
   data.

## Current Fixture Conformance

| Target id | Path | Conformance |
|---|---|---|
| `rng.fixed-seed-sequence` | `pm/roadmap/serfbound/reference-fixtures/ci/rng-fixed-seed-sequence.json` | Conforms to v1 CI-safe JSON fixture rules. |
| `map.geometry-facts` | `pm/roadmap/serfbound/reference-fixtures/ci/map-geometry-facts.json` | Conforms to v1 CI-safe JSON fixture rules. |
| `dos.spau-catalog-metadata` | `serfbound-local-data/reference-output/spau-catalog-metadata.json` | Conforms to v1 local/manual metadata-output rules when local `SPAU.PA` is present; skip output is valid when absent. |

## Stop Signals

Stop and update this contract before proceeding if:

- a fixture needs original asset bytes in Git;
- a fixture cannot be regenerated deterministically;
- a browser test needs to execute reference tooling instead of reading fixture
  data;
- local/manual data becomes required for normal CI;
- a future schema change cannot be consumed explicitly by tests;
- product code imports from `reference-tools/`;
- a release artifact contains `.NET`, desktop runtime, original data, local
  reference outputs, or reference capture helpers.
