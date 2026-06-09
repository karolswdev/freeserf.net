# SB-4-02 — Parse DOS PA Resource Catalog

- **Project:** serfbound
- **Phase:** 4
- **Status:** done
- **Depends on:** SB-4-01, SB-1-03, SB-1-04
- **Unblocks:** SB-4-04, SB-5-03
- **Owner:** Codex

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

- [x] Parser reads local `SPAU.PA` through the browser import boundary.
- [x] Parser output matches the Phase 1 metadata oracle for selected facts.
- [x] Parser handles malformed/truncated files with useful errors.
- [x] Tests can run with generated fake archives in CI.
- [x] Local `SPAU.PA` checks are opt-in/manual.

## Test plan

- **Unit:** Parser tests for generated valid and invalid archive buffers.
- **Integration / Cypress:** Optional local/manual browser import parse check.
- **Manual / device:** Run local `SPAU.PA` parse and compare metadata to oracle.
- **Design handoff:** n/a - non-visual.

## Notes / open questions

Shipped metadata-only DOS `.PA` catalog parsing in the browser assets package.
The parser reads the 8-byte size/count header, the little-endian `size, offset`
entry table, and the DOS loader's inherited-entry fixups. It exposes resource
availability metadata but does not decode sprite, sound, or music payloads.

Default CI uses generated archives only. Real `SPAU.PA` validation remains
manual/opt-in through `SERFBOUND_RUN_LOCAL_ASSET_TESTS=1` and compares selected
catalog facts against the ignored Phase 1 oracle metadata.
