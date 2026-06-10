# Evidence — SB-22-01 — Determinism Checksums and Desync Detection

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/engine/src/checksum.ts` — the lockstep
  fingerprint: FNV-1a (32-bit) over a fixed-order structural walk of the
  materialized game state — every map array (heights, types, objects,
  minerals, resource amounts, paths, owners, object indexes), every
  flag (with per-direction path state and resource slots), building
  (construction, deliveries, requests, garrison), inventory (resources,
  pools, pending out), player (morale, gold, occupation, defeat),
  every serf (all 28 behavioral fields), the serf position index, and
  both RNG states plus the tick. Iteration order is pinned (sorted
  entity indexes, sorted record keys with zero-count skipping, the
  canonical direction order). `computeGameChecksum` builds the
  fingerprint; `firstChecksumDivergence` compares two streams and names
  the first shared tick they disagree on.
- `serfbound/packages/engine/src/index.ts` — exports the module.
- `serfbound/tests/ci/engine-lockstep-checksum.test.mjs` — the
  determinism contract as fixtures (two-player AI game, 40,960 ticks,
  checksums every 1024).

## Verification artifacts

```text
npm run test:ci -> # tests 185 / pass 185 / fail 0; 10 passed (1.9m)
node --test tests/ci/engine-lockstep-checksum.test.mjs ->
  ok 1 - identical seed and schedule produce identical checksum streams
  ok 2 - an injected single-field mutation is caught at its tick
  ok 3 - the world-action log replays deterministically across restores
  ok 4 - checksum cost stays negligible at gameplay cadence (<10ms guard;
         measured well under it on a size-3 world)
```

- Identical streams: two independently constructed games (same seed,
  same AI schedule) produce 40 identical records with live variation
  across ticks; `firstChecksumDivergence` returns null.
- Exact-tick detection: a single `heights[100]` mutation injected at
  tick 20,000 leaves every earlier record identical and reports
  divergence at the first checksum after it (20,480 at the 1024
  cadence).

## Deviations from plan

- "Detected at the exact tick" means the first checksum at or after the
  divergent tick — exactness follows the configured cadence (per-tick
  cadence gives per-tick exactness; the cost test shows that is
  affordable).
- A live world and its snapshot-replay differ by design: in-flight
  serf-driven state is not serialized (the recorded Phase 13
  limitation), so restore parity is tested as replay determinism (two
  restores fingerprint identically) while full-state lockstep parity is
  the fresh-run property. Phase 23's late-rejoin resync must therefore
  replay the log through the full simulation from tick 0 (or ship the
  Phase 13 follow-up serializing serf state) — recorded for SB-23-03.
- Private monotonic id counters (next flag/building/serf index) are not
  directly hashed; their divergence surfaces through the entity indexes
  they mint, which are hashed.

## Follow-ups

- SB-22-02: the lockstep session core schedules tick-stamped actions
  over this contract.
