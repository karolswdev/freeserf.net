# Evidence — SB-20-04 — Launch Readiness and Post-Launch Roadmap

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `pm/roadmap/serfbound/phase-20-launch-operations/launch-readiness-report.md`
  — every standing gate rerun at the release commit: boundaries, 171/171
  unit tests, 9/9 browser suites, docs, static hosting, the opt-in
  real-data decode sweep (including all 39 SFX and the 10,409-event XMI
  track), and the scale baseline (size-6 full sim at 2.01M ticks/s). The
  asset/legal boundary audit and the recorded known limitations. **Go.**
- `pm/roadmap/serfbound/phase-20-launch-operations/post-launch-roadmap.md`
  — the decision record: multiplayer via WebRTC data channels with
  deterministic lockstep over the existing world-action log (relay server
  rejected, stop signal recorded); Amiga data behind a corpus-parity
  standard; localization via string extraction; the consolidated polish
  backlog from every phase's records.

## Verification artifacts

```text
check:boundaries -> serfbound-boundaries-ok
test:unit -> # tests 171 / pass 171 / fail 0
test:browser -> 9 passed (1.7m)
test:docs -> serfbound-docs-ok
test:release:static -> artifact + subpath + IndexedDB restore ok
test:local:assets (real SPAU.PA) -> full decode sweep ok
measure:scale -> size6 2,012,240 ticks/s; scene builds 2.2-2.9ms
```

## Deviations from plan

- The public URL activates with the maintainer's one-time Pages settings
  toggle plus pushing the `serfbound-v0.1.0` tag (the pipeline itself is
  shipped and gate-verified, per SB-20-01's record).

## Follow-ups

- The roadmap is delivered; operations continue per the intake flow and
  the post-launch roadmap record.
