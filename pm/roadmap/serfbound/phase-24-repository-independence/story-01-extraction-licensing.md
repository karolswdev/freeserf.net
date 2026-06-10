# SB-24-01 — Extraction and Licensing Decision Record

- **Project:** serfbound
- **Phase:** 24
- **Status:** done
- **Depends on:** SB-23-04
- **Unblocks:** SB-24-02
- **Owner:** Claude

## Problem

Before anything moves: what exactly constitutes Serfbound (workspace,
PMO record, workflows, conventions), what stays behind (.NET reference
code, reference tooling), what license the standalone repository
carries (GPL-3.0 — the engine ports exact GPL behavior; this is
derivation, not inspiration), and what history strategy applies.

## Scope

- **In:** The move/stay inventory, the GPL-3.0 + derivation-notice
  decision, the fresh-history-with-provenance decision, the
  code-comment citation posture (upstream file references stay — they
  ARE the attribution), the new-repo naming and visibility decision.
- **Out:** Executing the move (SB-24-02).

## Acceptance criteria

- [x] The decision record enumerates every top-level path as move/stay
  with reasons.
- [x] The license posture is recorded: GPL-3.0, the derivation notice
  text, and why "inspiration-only" is insufficient.
- [x] History, naming, and visibility decisions are recorded.

## Test plan

- **Unit:** n/a (decision story).
- **Integration / e2e:** n/a.
- **Manual / device:** n/a.
- **Design handoff:** The decision record in the phase folder.

## Notes / open questions

- Preserves: the GPL lineage and the asset boundary.
- Browser boundary: none.
- .NET reference use: none (this story decides how to leave it behind).
- Phase gate advanced: exit criterion 1.
