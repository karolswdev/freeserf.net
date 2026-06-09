# Evidence — SB-1-04 — Define Oracle Fixture Contract

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `pm/roadmap/serfbound/adoption/oracle-fixture-contract.md` - new v1 fixture
  contract for CI-safe fixtures, local/manual outputs, checksums, schema fields,
  command policy, validation rules, and product-code boundaries.
- `pm/roadmap/serfbound/phase-1-reference-oracle/story-04-oracle-fixture-contract.md`
  - marks SB-1-04 done and checks acceptance criteria.
- `pm/roadmap/serfbound/phase-1-reference-oracle/current-phase-status.md` -
  marks the story table row done and records final Phase 1 audit as the next
  move.
- `pm/roadmap/serfbound/README.md` - adds the contract to source canon.
- `pm/roadmap/serfbound/adoption/phase-gate-verification-matrix.md` - records
  that Phase 1 stories are shipped and final audit remains.

## Contract summary

- CI-safe fixture path:
  `pm/roadmap/serfbound/reference-fixtures/ci/`.
- Local/manual output path:
  `serfbound-local-data/reference-output/`.
- Reference helper path:
  `pm/roadmap/serfbound/reference-tools/`.
- Current schema version: `1`.
- Required top-level fields for CI-safe JSON fixtures:
  `schemaVersion`, `targetId`, `dataRequirement`, `source`, `generation`.
- Allowed `dataRequirement` values:
  - `data-free / CI-safe`
  - `local/manual SPAU.PA`
- Product boundary: browser product/runtime code may read fixture data but must
  not import, execute, bundle, or depend on reference helpers, .NET tooling,
  Python helpers, DOS executables, local companion processes, or original asset
  payloads.

## Verification artifacts

- Context reads:
  - `sed -n '1,220p' pm/roadmap/serfbound/phase-1-reference-oracle/story-04-oracle-fixture-contract.md`
  - `sed -n '1,220p' pm/roadmap/serfbound/phase-1-reference-oracle/current-phase-status.md`
  - `sed -n '1,280p' pm/roadmap/serfbound/adoption/parity-harness-design.md`
  - `sed -n '1,220p' pm/roadmap/serfbound/adoption/asset-and-legal-boundary.md`
- Fixture shape inspection:
  - `python3 - <<'PY' ...` over `pm/roadmap/serfbound/reference-fixtures/ci/*.json`
  - Result:
    - `ci-fixture-ok pm/roadmap/serfbound/reference-fixtures/ci/map-geometry-facts.json map.geometry-facts`
    - `ci-fixture-ok pm/roadmap/serfbound/reference-fixtures/ci/rng-fixed-seed-sequence.json rng.fixed-seed-sequence`
- Local/manual output shape inspection:
  - `python3 - <<'PY' ...` over `serfbound-local-data/reference-output/spau-catalog-metadata.json`
  - Result:
    - `local-output-ok serfbound-local-data/reference-output/spau-catalog-metadata.json present`
- Contract coverage scan:
  - `rg -n "reference-tools|reference-fixtures|serfbound-local-data/reference-output|schemaVersion|targetId|dataRequirement|Product-code|Product-Code|Validation Rules" pm/roadmap/serfbound/adoption/oracle-fixture-contract.md`
  - Result: found directory policy, schema fields, product-code boundary, and
    validation rules.
- Roadmap/status scan:
  - `rg -n "oracle-fixture-contract|SB-1-04|fixture contract" pm/roadmap/serfbound/README.md pm/roadmap/serfbound/phase-1-reference-oracle/current-phase-status.md pm/roadmap/serfbound/phase-1-reference-oracle/story-04-oracle-fixture-contract.md`
  - Result: README source canon, story row, status note, and story notes all
    reference SB-1-04 / the fixture contract.
- PMO and structural checks:
  - `git diff --check` -> passed with no output.
  - `for f in pm/roadmap/serfbound/phase-*/story-[0-9]*.md; do rg -q "^## Problem$" "$f" && rg -q "^## Scope$" "$f" && rg -q "^## Acceptance criteria$" "$f" && rg -q "^## Test plan$" "$f" || echo "missing required section: $f"; done` -> passed with no output.
  - `bash -n .githooks/pre-commit .githooks/post-commit .githooks/work-log-read .githooks/work-log-summarize` -> passed with no output.
  - `git ls-files | rg -n '(^|/)(SPA.*\.PA|SOUNDS\.PA|SERF\.EXE|.*\.adf$|sounds/|music/|serfbound-local-data/)' || true` -> passed with no output.

## Acceptance criteria — re-checked

- [x] `pm/roadmap/serfbound/adoption/oracle-fixture-contract.md` exists —
  created in this story.
- [x] The contract defines where CI-safe fixtures live —
  `pm/roadmap/serfbound/reference-fixtures/ci/`.
- [x] The contract defines where local/manual outputs live or how they are
  ignored — `serfbound-local-data/reference-output/`, ignored and not required
  for CI.
- [x] The contract forbids product code importing .NET capture helpers — it
  forbids product/runtime imports or execution of reference helpers, .NET/C#,
  Python helpers, DOS executables, local companion processes, and release
  bundling of reference tooling.
- [x] The contract includes validation rules for fixture schema version,
  checksum, source target, and local-data requirement — covered under Schema
  Version, Source Attribution, Checksum Rules, Local/Manual Output Rules, and
  Validation Rules.

## Residual risk

The contract is documentation and policy, not an automated validator. Phase 2
must turn the contract into browser-native test assertions when it creates the
test spine. Phase 1 still needs a final audit and `final-summary.md` before the
phase can be marked complete.
