# SB-26-01 — Amiga Corpus Evaluation

- **Project:** serfbound
- **Phase:** 26
- **Status:** backlog
- **Depends on:** SB-25-04
- **Unblocks:** SB-26-02
- **Owner:** unassigned

## Problem

The reference loads Amiga data; Serfbound only loads DOS `SPAU.PA`. The
post-launch record requires a real evaluation before any commitment: can
a lawful user-owned Amiga corpus be sourced locally, what formats does it
add (per `Freeserf.Core` Amiga data sources), and can the DOS-grade
parity standard be met?

## Scope

- **In:** Lawful corpus sourcing into ignored `serfbound-local-data/`,
  reference Amiga loader inventory (formats, palettes, music: sonic
  arranger vs XMI), oracle-output capture for selected facts, effort/
  risk assessment, the go/no-go decision record.
- **Out:** Product decode code (SB-26-02, only on go).

## Acceptance criteria

- [ ] The decision record ships with corpus provenance, format
  inventory, parity-standard feasibility, and a clear go/no-go.
- [ ] If a corpus exists locally, metadata oracle outputs are captured
  under the ignored reference-output path with committed checksums.
- [ ] No-go (if so) names the blocking facts honestly.

## Test plan

- **Unit:** n/a (evaluation story).
- **Integration / e2e:** n/a.
- **Manual / device:** Opt-in local inspection runs over the corpus.
- **Design handoff:** The decision record in the phase folder.

## Notes / open questions

- Preserves: the asset/legal boundary, applied to a second platform.
- Browser boundary: none yet.
- .NET reference use: read-only inventory of Amiga loaders.
- Phase gate advanced: exit criterion 1.
