# Evidence — SB-0-01 — Name And Charter Serfbound

- **Shipped:** 2026-06-09
- **Commit:** pending initial roadmap commit
- **Owner:** Codex

## Files touched

- `pm/roadmap/serfbound/README.md` - names Serfbound, records source canon, and
  lists Phase 0 through Phase 9.
- `pm/roadmap/serfbound/phase-0-setup/current-phase-status.md` - records the
  naming decision and Phase 0 story table.
- `pm/roadmap/serfbound/phase-0-setup/story-01-name-and-charter.md` - defines
  the naming/charter story and marks its acceptance criteria complete.
- `pm/roadmap/serfbound/adoption/session-intake.md` - captures user direction
  for the browser-native rewrite.
- `AGENTS.md` - gives future agent sessions the Serfbound and PMO entry points.

## Verification artifacts

- Placeholder scan over `pm/roadmap/serfbound` -> only the intentional README
  example for `SB-0-01` / `SB-3-04` remained.
- `bash -n .githooks/pre-commit .githooks/post-commit .githooks/work-log-read .githooks/work-log-summarize` -> passed with no output.
- `find pm/roadmap/serfbound -maxdepth 3 -type f | sort` -> confirmed the project README, intake, Phase 0 stories, this evidence file, and Phase 1 through Phase 9 status files exist.

## Acceptance criteria — re-checked

- [x] `pm/roadmap/serfbound/README.md` uses `Serfbound` as the project title —
  proven by the roadmap header.
- [x] The roadmap records `serfbound` as the slug and `SB` as the story prefix —
  proven by the Project metadata section.
- [x] The Phase 0 status file records the 2026-06-09 naming decision — proven
  by Decisions made in `current-phase-status.md`.
- [x] The roadmap states that Serfbound is a browser-native rewrite track, not
  a .NET product-runtime continuation — proven by the Vision and Glossary.
- [x] The roadmap records pure-browser/no-.NET/no-desktop as a hard constraint —
  proven by Project metadata and Phase 0 decisions.

## Residual risk

Brand clearance, domain availability, logo, and package-name reservation are not
part of this story. They remain future product/branding work.
