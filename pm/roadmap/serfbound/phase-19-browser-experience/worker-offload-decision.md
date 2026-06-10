# Worker Offload Decision — SB-19-02

**Decided:** 2026-06-10. **Decision: explicitly rejected, with measurements.**

## The Phase 8 contract

Worker adoption requires proven message contracts, transfer/clone cost
accounting, deterministic equivalence, browser compatibility, and failure
recovery — and is justified only when measured stop signals trip.

## The measurements (sb-19-01-scale-baseline.json)

| Cost | Measured | Frame budget share |
|---|---|---|
| 8 sim ticks/frame, size-6 map, full economy + AI | ~4 µs | 0.002 % of 175 ms |
| Scene build, 1280×720, live world + chrome | ~2–3 ms | 1.7 % |
| Heap over 500k ticks at every size | flat | no leak signal |

The simulation is four orders of magnitude under the frame budget on the
largest supported map with an AI opponent running. The dominant per-frame
cost (scene construction) is itself under 2 % of the budget.

## Why a worker would make it worse

- The engine state (typed arrays, Maps of serfs/flags/buildings) would
  need structured cloning or transfer every frame, or a full
  message-protocol port of the world. Either costs more than the 4 µs of
  work being offloaded — by orders of magnitude.
- Determinism would have to be re-proven across the message boundary
  (the Phase 3 parity suite runs in one thread today).
- Failure recovery (worker death mid-tick) adds a state-resync protocol
  with no user-visible benefit.

## Stop signals that reopen this decision

| Signal | Threshold |
|---|---|
| Sim ticks/frame cost | > 40 ms (25 % of frame) on mid hardware |
| Scene build | > 50 ms at 1280×720 |
| New always-on subsystem (e.g. pathfinding-heavy 4-player AI battles) | profiled > 40 ms/frame |

The CI guards in `app-performance-scale.test.mjs` alarm an order of
magnitude before these thresholds.
