# Evidence — SB-19-01 — Performance at Scale

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/scripts/measure-scale.mjs` (`npm run measure:scale`) — the
  Phase 8 measurement harness extended to scale: full simulation
  (economy + AI opponent) across map sizes 3–6 with throughput and heap
  facts, plus decoded-scene build timing at desktop resolution over a
  live world with the panel chrome.
- `pm/roadmap/serfbound/phase-19-browser-experience/artifacts/sb-19-01-scale-baseline.json`
  — the recorded baseline.
- `serfbound/tests/ci/app-performance-scale.test.mjs` — CI guards: a
  size-5 economy+AI run must sustain >100k ticks/s and the size-5 scene
  must build inside the frame budget — order-of-magnitude regression
  alarms below the recorded baseline.

## Verification artifacts

```text
npm run measure:scale -> scale-baseline-ok:
  size6 2,058,646 ticks/s; scene builds size3=2.88ms, size5=2.22ms
node --test tests/ci/app-performance-scale.test.mjs -> # tests 2 / pass 2
npm run test:unit -> # tests 171 / pass 171 / fail 0
```

Measured at scale (full economy + AI):
| map size | tiles | ticks/s | heap |
|---|---|---|---|
| 3 | 4,096 | ~4M | flat |
| 6 | 65,536 | ~2.06M | flat |

The browser frame drives 8 sim ticks per 175 ms; at size 6 those 8 ticks
cost ~4 µs — 0.002% of the frame budget. Scene construction (the heaviest
per-frame render cost) takes ~2–3 ms at 1280×720 regardless of map size
(the lattice is viewport-bound, not map-bound).

## Optimization decision (recorded, measurement-first)

All recorded budgets are met with 10–100x headroom; per the phase
constraint (measure first, optimize second) **no optimization work is
warranted**. The CI guards pin the conclusion against regressions.

## Deviations from plan

- Mid-hardware browser frame cadence remains covered by the Phase 8
  measured baseline (`measure:performance`), which still runs; the scale
  additions are headless because the sim and scene-build costs dominate
  and measure identically in Node and the browser main thread.

## Follow-ups

- SB-19-02 consumes these numbers for the worker-offload decision.
