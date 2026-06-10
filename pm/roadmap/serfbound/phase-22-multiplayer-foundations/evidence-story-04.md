# Evidence — SB-22-04 — Two-Tab Loopback Gate

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/app/src/multiplayer.ts` —
  `SerfboundLoopbackMultiplayer`: hosts/joins over a BroadcastChannel
  (any text transport fits the same seam), handshakes with the
  protocol's hellos (the joiner adopts the host's deterministic
  settings, retries with the matching hello; non-settings mismatches
  reject recoverably), then pumps the lockstep loop from the shell
  timer: closes local input turns ahead of the simulation, executes
  ready turns (recording executed actions so saves keep working),
  advances tick by tick — holding at turn boundaries whose inputs are
  missing — runs the serf engine at fixed 16-tick boundaries so both
  peers update identically, and exchanges 512-tick checksums with
  divergence tracking.
- `serfbound/packages/engine/src/commands.ts` — the command router
  gains lockstep mode: `localPlayer` stamps world actions (every action
  previously hardcoded player 0) and the `onWorldAction` hook queues
  world-mutating commands for their scheduled turn (accepted as
  `queued-for-lockstep`) instead of applying immediately.
- `serfbound/packages/app/src/main.ts` — "Host 2P/Join 2P (this
  browser)" shell controls; the multiplayer start path (agreed settings,
  no AI for the second seat, router hooks wired); the game timer's
  lockstep branch (speed pinned at 1x — peers must consume turns at one
  rate); castle-pending placement keyed to the local player;
  `data-serfbound-mp-*` attributes (role, phase, stalled, executed turn,
  checksum tick/agreement, desync tick, per-player castles).
- `serfbound/docs/player-guide.md` — the experimental two-player section
  (no servers, data never leaves the machine); docs gate passes.
- Tests: `tests/ci/app-multiplayer.test.mjs` (handshake adoption,
  version rejection, and a full pumped two-peer game in-process: queued
  router commands, castles on both worlds, agreed checksums, recorded
  actions); `tests/browser/loopback-play.spec.ts` (the gate: two real
  tabs, host+join, both players found castles from their own tab, both
  worlds show `mp-castles=1,1`, checksums agree across tabs, nobody
  stalled or desynced).

## Verification artifacts

```text
npm run test:unit -> # tests 196 / pass 196 / fail 0
npx playwright test -> 11 passed (1.2m); rerun 11 passed (1.9m)
npx playwright test tests/browser/loopback-play.spec.ts --repeat-each=3
  -> 3 passed (19.5s)
npm run test:docs -> serfbound-docs-ok
npm run check:boundaries -> serfbound-boundaries-ok
npm run test:local:assets -> serfbound-local-asset-tests-ok (real SPAU.PA)
```

The gate e2e completes in ~12s: handshake to running in under a
second, both castles materialize on both peers at their lockstep turns,
and the cross-tab checksum exchange reports agreement on both sides.

## Deviations from plan

- Game speed is pinned to 1x in lockstep mode (synchronized speed
  changes are a protocol extension recorded for Phase 23+).
- The HUD/popup panels still summarize player 0's stock on both tabs;
  per-local-player presentation is cosmetic polish recorded for the
  Phase 23 UX pass. Castle placement, commands, and the world state are
  fully per-player.
- One unreproducible browser-suite failure occurred on the first
  full-suite run after the spec landed; three loopback repeats and two
  full-suite reruns (25+ spec executions) were all green. Recorded
  honestly; watching for recurrence.
- BroadcastChannel reaches tabs of one browser only — exactly the
  phase's zero-server scope; the internet transport is Phase 23.

## Follow-ups

- Phase 23: WebRTC transport behind the same channel seam, signaling,
  reconnect/resync.
