# SB-22-01 — Determinism Checksums and Desync Detection

- **Project:** serfbound
- **Phase:** 22
- **Status:** done
- **Depends on:** SB-21-05
- **Unblocks:** SB-22-02
- **Owner:** Claude

## Problem

Lockstep lives or dies on determinism. The engine replays world-action
logs deterministically (the AI and save paths prove it), but nothing yet
measures agreement cheaply at runtime. Peers need a per-tick checksum
over the flat world state to detect desync at the exact tick it happens.

## Scope

- **In:** A fast checksum over the typed-array world state (terrain,
  buildings, serfs, players, inventories, RNG state), checksum cadence
  configuration, fixtures proving stability across runs/replays and
  exact-tick divergence detection under injected mutations.
- **Out:** Networking (SB-22-03), recovery UX (Phase 23).

## Acceptance criteria

- [x] The same seed + action schedule yields identical checksum streams
  across independent runs.
- [x] An injected single-field mutation is caught at the exact tick.
  (First checksum at/after the mutation; exactness follows the cadence.)
- [x] Checksum cost stays within the perf guard at gameplay cadence.

## Test plan

- **Unit:** Checksum stability and divergence fixtures in CI.
- **Integration / e2e:** Replay an existing save's action log; assert
  the checksum stream matches the original run.
- **Manual / device:** n/a (engine-level story).
- **Design handoff:** n/a.

## Notes / open questions

- Preserves: engine determinism as the multiplayer substrate.
- Browser boundary: none new.
- .NET reference use: none.
- Phase gate advanced: exit criterion 1.
