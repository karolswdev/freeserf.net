# SB-11-01 — Capture Map Generator Oracle Fixtures

- **Project:** serfbound
- **Phase:** 11
- **Status:** done
- **Depends on:** SB-10-04
- **Unblocks:** SB-11-02
- **Owner:** unassigned

## Problem

Porting `MapGenerator.cs` without reference outputs invites silent drift. The
Phase 1 oracle pattern (capture reference behavior first) must be extended to
map generation before any generator code is written.

## Scope

- **In:** A reference capture tool (isolated under
  `pm/roadmap/serfbound/reference-tools/`, not product code) that runs the C#
  `ClassicMapGenerator` for fixed seeds/sizes and emits heights, terrain
  types, objects, and minerals as JSON; at least one small CI-safe fixture
  committed under `reference-fixtures/ci/`.
- **Out:** The TypeScript port itself; large-map fixtures (local/manual only).

## Acceptance criteria

- [x] Fixture schema covers per-position height, type-up/type-down, object,
  and mineral data plus generator parameters and seed.
- [x] At least one small map fixture (e.g. size 3) is committed and validated
  by the existing oracle fixture contract checks.
- [x] Capture is reproducible: re-running the tool yields byte-identical
  fixtures.

## Test plan

- **Unit:** Fixture-contract validation in CI.
- **Integration / Cypress:** n/a.
- **Manual / device:** Run the capture tool locally against the reference.
- **Design handoff:** n/a.

## Notes / open questions

- Preserves: reference generator behavior as ground truth.
- Browser boundary: none — capture tooling only.
- .NET reference use: yes, isolated under reference-tools per Phase 1 policy.
- Phase gate advanced: makes generator parity provable.
