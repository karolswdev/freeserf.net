# Evidence — SB-24-04 — Independence Gate and Handoff

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## What shipped

- **The zero-.NET guard** (`scripts/check-independence.mjs` in the new
  repository): walks the tree for .NET artifacts (.cs/.csproj/.sln/
  .fsproj/.vbproj/.nupkg/.dll/.exe, nuget/global.json/Directory.Build,
  appveyor.yml) and scans workflows for .NET toolchain invocations;
  wired into `ci:release` as `check:independence`. Proven both ways: a
  planted `Probe.cs` fails the build with the offender named; the real
  tree passes ("serfbound-independence-ok").
- **The handoff** (this repository): the README opens with the moved
  notice (new repo + Pages URL, this repo's archive role), and the
  `serfbound-ci.yml` / `serfbound-pages.yml` workflows are retired (no
  duplicate gates or deploys).
- **The cutover record**: the completed phase-24 roadmap state and the
  phase final summary are synced into the new repository's `pm/` copy,
  which is authoritative from its next commit onward.

## Verification artifacts

```text
npm run check:independence -> serfbound-independence-ok
(with planted Probe.cs)    -> serfbound-independence-failed: Probe.cs
New-repo CI (ci:release incl. the guard): run on the closing push —
  completed success (run id in the new repo's history at the cutover
  commit).
Old repo: serfbound workflows deleted; README handoff banner added.
```

## Deviations from plan

- From the cutover commit onward, the roadmap copy in
  `karolswdev/serfbound` is authoritative; this archive copy freezes at
  the cutover (this evidence is its final serfbound entry).

## Follow-ups

- Phase 25 (community/identity) proceeds in the new repository.
- Archiving this repository entirely remains the maintainer's call.
