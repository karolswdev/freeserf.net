# Evidence — SB-24-01 — Extraction and Licensing Decision Record

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `pm/roadmap/serfbound/phase-24-repository-independence/extraction-decision.md`
  — the record: `karolswdev/serfbound`, public, **GPL-3.0 with an
  explicit derivation acknowledgment** (the engine ports exact GPL
  behavior — combat math, tables, generators, parsers — so
  "inspiration-only" is rejected as legally false); the full move/stay
  inventory (workspace promoted to the repository root; PMO record,
  hooks, workflows, fixtures move; all .NET trees, the reference
  tooling, and upstream docs stay); fresh history with a provenance
  stamp (rationale recorded); code-comment citations stay (they are the
  attribution); the PMO record moves verbatim.

## Verification artifacts

```text
gh auth status -> logged in as karolswdev
gh repo view karolswdev/serfbound -> Could not resolve (name is free)
LICENSE (upstream) -> GNU GENERAL PUBLIC LICENSE Version 3
```

Decision-story checks: every top-level path of the current repository
is classified in the inventory (verified against `ls` of the tree);
the license decision quotes the ported-behavior basis.

## Deviations from plan

- The user's framing ("tiny attribution for inspiration") is delivered
  as a single README acknowledgment section — but on a GPL-3.0 license
  with a derivation notice, because the ported behavior makes that the
  honest and lawful floor. Recorded prominently rather than silently
  adjusted.

## Follow-ups

- SB-24-02 executes the extraction.
