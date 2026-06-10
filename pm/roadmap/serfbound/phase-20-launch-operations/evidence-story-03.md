# Evidence — SB-20-03 — Full-Game Documentation Refresh

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/docs/developer-guide.md` — the complete-game module map
  (every engine/assets/app module by responsibility), the full command
  reference (CI suites, browser suites, both measurement harnesses, the
  opt-in real-data checks, the release gate set), and the tag-driven
  release pointer.
- `serfbound/docs/player-guide.md` — refreshed across SB-19-05/SB-20-02:
  the original-interface controls, keyboard play, autosave, sound and
  music behavior, install/offline, and problem reporting.
- `serfbound/docs/static-hosting-release.md` — the Pages release path
  (SB-20-01).

## Verification artifacts

```text
npm run test:docs -> serfbound-docs-ok: player, developer, and static
hosting docs cover required release topics.
```

The docs verification gate runs in release CI, so the coverage holds at
every release commit.

## Deviations from plan

- The repository root README continues to describe the C# reference
  implementation it documents; the Serfbound product docs live under
  `serfbound/docs/` with the roadmap canon under `pm/roadmap/serfbound/`
  — recorded as the documentation layout decision (the reference repo
  remains the reference).

## Follow-ups

- SB-20-04: the launch readiness review and the post-launch roadmap
  record close the phase — and the roadmap.
