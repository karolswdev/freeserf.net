# Evidence — SB-22-02 — Lockstep Session Core

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/engine/src/lockstep.ts` — `LockstepSession`: time
  divides into input turns (default 64 ticks); local commands stamp for
  `localTurn + inputDelayTurns` (default 2) and bundle per turn
  (`completeTurn` → broadcast payload); `receive` accepts remote bundles
  in any order (idempotent; conflicting duplicates throw);
  `readyThroughTurn` allows execution only when every player's bundle is
  present for every turn (bootstrap turns below the delay are implicitly
  empty); `executeNextTurn` applies the turn's actions through
  `applyWorldAction` strictly in order — player order then submission
  order — and throws on unready turns (stall = hold, never guess);
  deterministic rejection is a valid outcome. Transport-agnostic and
  DOM-free.
- `serfbound/packages/engine/src/index.ts` — exports the module.
- `serfbound/tests/ci/engine-lockstep-session.test.mjs` — two full
  simulations driven over a fake network with per-step delivery delays.

## Verification artifacts

```text
npm run test:unit -> # tests 189 / pass 189 / fail 0
npm run test:browser -> 10 passed (1.7m)
node --test tests/ci/engine-lockstep-session.test.mjs ->
  ok 1 - two peers play one lockstep game with matching checksum streams
  ok 2 - same-turn actions execute in player order regardless of arrival
  ok 3 - late bundles stall the simulation instead of breaking it
  ok 4 - bootstrap turns below the input delay execute empty
```

- 192 turns (12,288 ticks) under 0–1-step jitter: both peers execute
  every turn with zero stalls, 12 identical checksum records, both
  castles standing on both worlds.
- Same-turn submissions from both players (with a deliberately invalid
  action) produce identical outcome logs and checksums under
  asymmetric, out-of-phase delivery.
- 8-step delivery (far beyond the 2-turn delay): both peers hold
  repeatedly, catch up in bursts, finish all 96 turns, and agree
  exactly.

## Deviations from plan

- The session executes actions against the world directly; recording
  them into the local-game snapshot log (so lockstep games save like
  local ones) lands with the SB-22-04 shell wiring.
- The test harness paces one turn per wall step (classic lockstep
  consumption); the first harness draft let execution race ahead of
  input generation, which mislabeled input-bound waiting as network
  stalls — fixed in the harness, not the session.

## Follow-ups

- SB-22-03: the versioned wire encoding for handshake, bundles, and
  checksums.
