# Evidence — SB-19-02 — Worker Offload Decision and Implementation

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `pm/roadmap/serfbound/phase-19-browser-experience/worker-offload-decision.md`
  — the decision record: worker offload **explicitly rejected with
  measurements**, per the Phase 8 contract's allowed outcome.

## Verification artifacts

```text
Measured grounds (sb-19-01-scale-baseline.json):
  8 sim ticks/frame at size 6 with economy + AI: ~4 µs (0.002% of the
  175 ms frame); scene build ~2-3 ms; heap flat over 500k ticks.
CI guards: tests/ci/app-performance-scale.test.mjs (2 tests, passing)
alarm an order of magnitude before the recorded stop signals.
```

The decision document carries the full reasoning: cloning/transferring
the engine state per frame costs orders of magnitude more than the 4 µs
of work a worker would absorb, determinism would need re-proving across
the message boundary, and failure recovery adds protocol with no
user-visible benefit. Stop-signal thresholds that reopen the decision
are recorded with CI alarms an order of magnitude earlier.

## Deviations from plan

- None: the story's "implemented or explicitly rejected with
  measurements" resolves to the rejection branch, exactly as the Phase 8
  worker contract anticipated.

## Follow-ups

- SB-19-03: touch and mobile play.
