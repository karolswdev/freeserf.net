# SB-22-02 — Lockstep Session Core

- **Project:** serfbound
- **Phase:** 22
- **Status:** done
- **Depends on:** SB-22-01
- **Unblocks:** SB-22-03
- **Owner:** Claude

## Problem

Peers must agree on which world actions execute at which tick. The
lockstep core schedules tick-stamped actions with input delay, holds
ticks until all peers' inputs arrive, and surfaces stalls — all as a
transport-agnostic layer over the engine.

## Scope

- **In:** Tick-stamped action scheduling with configurable input delay,
  per-peer input queues, stall/hold semantics, deterministic tie-break
  ordering for same-tick actions, in-process simulated peers driven
  through latency/jitter schedules.
- **Out:** Wire encoding (SB-22-03), real transports (SB-22-04+).

## Acceptance criteria

- [x] Two simulated peers complete a scripted game with identical
  checksum streams.
- [x] Latency/jitter schedules within the input delay produce no stalls;
  beyond it, stalls hold determinism instead of breaking it.
- [x] Same-tick actions from different peers order identically on both
  sides.

## Test plan

- **Unit:** Scheduler semantics (delay, hold, ordering) in CI.
- **Integration / e2e:** Simulated two-peer game in the Node test
  runner with checksum agreement.
- **Manual / device:** n/a.
- **Design handoff:** n/a.

## Notes / open questions

- Preserves: the world-action log as the only gameplay payload.
- Browser boundary: none new (in-process).
- .NET reference use: none.
- Phase gate advanced: exit criterion 2.
