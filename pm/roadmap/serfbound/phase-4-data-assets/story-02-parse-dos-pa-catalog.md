# SB-4-02 — Parse DOS PA Resource Catalog

- **Project:** serfbound
- **Phase:** 4
- **Status:** ready
- **Depends on:** SB-4-01, SB-1-03, SB-1-04
- **Unblocks:** SB-4-04, SB-5-03
- **Owner:** unassigned

## Problem

Serfbound needs to understand the DOS `.PA` archive enough to expose resources
without relying on the original executable or the C# runtime. The first parser
must prove catalog-level facts before decoding every asset.

## Scope

- **In:** Browser-side `.PA` header/catalog parsing, metadata extraction,
  checksum comparison against Phase 1 local oracle output, and error handling.
- **Out:** Full sprite/audio decoding, rendering, committing asset payloads, or
  executing DOS files.

## Acceptance criteria

- [ ] Parser reads local `SPAU.PA` through the browser import boundary.
- [ ] Parser output matches the Phase 1 metadata oracle for selected facts.
- [ ] Parser handles malformed/truncated files with useful errors.
- [ ] Tests can run with generated fake archives in CI.
- [ ] Local `SPAU.PA` checks are opt-in/manual.

## Test plan

- **Unit:** Parser tests for generated valid and invalid archive buffers.
- **Integration / Cypress:** Optional local/manual browser import parse check.
- **Manual / device:** Run local `SPAU.PA` parse and compare metadata to oracle.
- **Design handoff:** n/a - non-visual.

## Notes / open questions

Do not decode every resource in this story. Catalog fidelity is the first gate.
