# SB-1-03 — Capture Local SPAU.PA Resource Output

- **Project:** serfbound
- **Phase:** 1
- **Status:** backlog
- **Depends on:** SB-1-01, SB-0-05
- **Unblocks:** SB-1-04, SB-4-02, SB-4-04
- **Owner:** unassigned

## Problem

Serfbound has a real ignored local DOS source, `SPAU.PA`, and the rewrite must
prove it can reason about that data without committing the asset. A local/manual
oracle output gives Phase 4 a concrete target for browser import and parsing.

## Scope

- **In:** Capture metadata-only facts from local `SPAU.PA`, such as archive
  identity, resource counts, resource names, selected dimensions, or checksums
  of derived non-asset metadata.
- **Out:** Committing `SPAU.PA`, committing extracted original assets, building
  the browser parser, or executing original DOS binaries.

## Acceptance criteria

- [ ] The local source path is read from ignored `serfbound-local-data/` or an
  explicit environment variable.
- [ ] Output contains metadata/checksums only, not raw original asset payloads.
- [ ] The output records the `SPAU.PA` checksum from
  `adoption/local-asset-inventory.md`.
- [ ] Missing local data produces a clear skip message, not a failed CI path.
- [ ] Phase 4 can use the output as a resource-catalog target.

## Test plan

- **Unit:** Run the local capture with `SPAU.PA` present and verify metadata.
- **Integration / Cypress:** n/a.
- **Manual / device:** Temporarily run without the local path configured and
  confirm the command skips cleanly.
- **Design handoff:** n/a - non-visual.

## Notes / open questions

This story is local/manual by design. CI must remain useful without these files.
