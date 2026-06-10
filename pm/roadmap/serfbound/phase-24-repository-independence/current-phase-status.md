# Phase 24 — Repository Independence

**Last updated:** 2026-06-10.
**Status:** complete — see final-summary.md. The roadmap is authoritative in karolswdev/serfbound from the cutover onward.

## Goal

Serfbound graduates: its own GitHub repository, pure browser-native
TypeScript, with zero .NET code, tooling, or positioning — the original
freeserf.net codebase acknowledged once, properly (it is the GPL
behavioral ancestor, not just "inspiration"), and never shipped again.
The old repository becomes the archive it always was.

## Scope

- **In:** The extraction/licensing decision record (what moves, what
  stays behind, GPL-3.0 continuity and the derivation notice, history
  strategy), creating and populating the standalone repository via
  `gh`, a standalone README/docs rewrite, CI and the Pages release path
  running in the new repository, a mechanical zero-.NET guard in the
  new repo's gates, and the old repository's handoff note.
- **Out:** Rewriting the PMO history (the delivery record moves as-is —
  its references to the reference implementation are honest
  provenance); scrubbing behavioral citations from code comments (they
  cite the upstream project's files, which is the attribution); any
  feature work.

## Non-negotiable constraints

- License continuity: the engine ports exact GPL-licensed behavior
  (combat math, tables, layouts) from freeserf.net — the new repository
  is GPL-3.0 with an explicit derivation acknowledgment. "Inspiration"
  alone would be legally false.
- Zero .NET in the new repository: no C# sources, no .NET tooling, no
  desktop-shell references — enforced by a guard script in CI, not by
  promise.
- The asset boundary survives the move unchanged: no original game
  data in the new repository, its history, its CI, or its Pages site.
- The standing gates must pass in the new repository before it is
  declared primary.

## Exit criteria (evidence required)

- [x] The extraction and licensing decision record ships: inventory of
  what moves/stays, GPL-3.0 + derivation notice, fresh-history
  rationale. (SB-24-01)
- [x] The standalone repository exists and holds the complete
  browser-native workspace with standalone docs; the full local gate
  set passes in the export tree. (SB-24-02)
- [x] CI and the Pages release path run green in the new repository.
  (SB-24-03)
- [x] The zero-.NET guard enforces independence mechanically; the old
  repository carries the handoff note; phase close. (SB-24-04)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-24-01 | Extraction and licensing decision record | done | story-01-extraction-licensing.md | evidence-story-01.md |
| SB-24-02 | Create and populate the standalone repository | done | story-02-standalone-repository.md | evidence-story-02.md |
| SB-24-03 | CI and Pages in the new repository | done | story-03-ci-pages-new-repo.md | evidence-story-03.md |
| SB-24-04 | Independence gate and handoff | done | story-04-independence-gate.md | evidence-story-04.md |

## Where we are

The phase is closed and the cutover is done:
https://github.com/karolswdev/serfbound is Serfbound's home (GPL-3.0,
zero .NET enforced by the CI guard, Pages serving the build); this
repository is the archive, with the handoff note up top and its
serfbound workflows retired. See final-summary.md.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| GPL/attribution understated | low | The decision record is the license posture; reviewed before push | Any claim of independence from the GPL lineage |
| The export tree silently loses pieces | medium | Inventory checklist + full gate run in the export before push | Any gate red in the export |
| Old-repo workflows keep firing | medium | Old repo's serfbound workflows retired in the handoff | Duplicate deploys |

## Decisions made (this phase)

- none yet.

## Decisions deferred

- Archiving the old repository entirely (the maintainer's call after
  the handoff settles).
