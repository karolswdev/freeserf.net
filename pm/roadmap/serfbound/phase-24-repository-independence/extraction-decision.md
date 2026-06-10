# Repository Extraction and Licensing — decision record (SB-24-01)

**Recorded:** 2026-06-10.

## The new repository

- **Name/owner:** `karolswdev/serfbound` (the name is free; verified
  via `gh`).
- **Visibility:** public — it is a GPL community project that deploys
  to GitHub Pages.
- **License:** **GPL-3.0**, same as freeserf.net. This is not optional
  courtesy: the engine ports *exact behavior* from GPL-licensed sources
  — the combat-resolution math and tables, knight morale, occupancy
  tables, the map generator, savegame layouts, UI layouts, the
  ConvertToWav and XMI parsers. That is derivation in the copyleft
  sense, regardless of the implementation language changing.
  "Inspiration-only" attribution would be legally false and is
  rejected.
- **Attribution:** one section in the README acknowledging the lineage:
  Serfbound is a browser-native reimplementation derived from the
  behavior of [freeserf.net](https://github.com/Pyrdacor/freeserf.net)
  (C#), itself derived from
  [freeserf](https://github.com/freeserf/freeserf) (C), recreating
  The Settlers I (Blue Byte, 1993). Players must supply their own
  original game data; none is included or hosted.

## What moves (the export inventory)

| Path (old repo) | New repo | Why |
|---|---|---|
| `serfbound/**` | repository root (`packages/`, `tests/`, `scripts/`, `docs/`, `public/`, configs) | The product. Promoted to root — no more subdirectory ceremony. |
| `pm/**` (roadmap framework + serfbound roadmap) | `pm/**` | The delivery record and the contract hook config; accountability travels with the project. |
| `.githooks/**` + hook config | `.githooks/**` | The PMO pre-commit contract keeps gating commits. |
| `.github/workflows/serfbound-ci.yml` | `.github/workflows/ci.yml` (paths adjusted) | The data-free gate. |
| `.github/workflows/serfbound-pages.yml` | `.github/workflows/pages.yml` (paths adjusted, tags `v*`) | The release path. |
| `.github/ISSUE_TEMPLATE/serfbound-bug-report.md` | `.github/ISSUE_TEMPLATE/bug-report.md` | Issue intake. |
| `serfbound-local-data/` convention | `.gitignore` carries `serfbound-local-data/` (sibling-or-inside, ignored) | The asset boundary, unchanged. |

## What stays behind (never moves)

| Path | Why it stays |
|---|---|
| `Freeserf.Core/`, `Freeserf.Audio/`, `Freeserf.Network/`, `Freeserf.Renderer/`, `Freeserf.Test/`, `FreeserfNet/`, `FreeserfNet.sln`, `Silk.NET.Window/`, `appveyor.yml` | The .NET reference implementation and its toolchain — the archive. |
| `pm/roadmap/serfbound/reference-tools/` | Phase 1 oracle tooling that inspects the C# sources; explicitly not product code. |
| `Configuration.md`, `Issues.md`, `changelog.txt`, `images/` | Upstream project documentation. |

`pm/roadmap/serfbound/reference-fixtures/ci/` (committed JSON oracle
fixtures) MOVES: the fixtures are data our tests consume; they contain
no .NET.

## History strategy

**Fresh history with a provenance stamp.** The initial commit message
records the source: extracted from `karolswdev/freeserf.net` at the
cutover commit. Rationale: the old history interleaves .NET paths and
serfbound work; filtering it adds tooling risk for little value when
the full PMO record (stories, evidence, final summaries) moves as
files. The old repository remains the permanent history archive.

## Code-comment citation posture

Engine and app comments cite upstream files by name
("Freeserf.Core/UI/Box.cs", "Player.UpdateKnightMorale") as behavioral
provenance. **They stay.** They reference the upstream project's files
— that *is* the attribution — and scrubbing them would damage
maintainability and honesty. The zero-.NET guard (SB-24-04) checks for
.NET *artifacts* (sources, project files, toolchain), not for honest
citations.

## PMO record posture

The roadmap moves verbatim, including every reference to the oracle
phases and the C# reference. It is the delivery record; rewriting
history to look "pure" would be exactly the kind of dishonesty the
contract forbids.
