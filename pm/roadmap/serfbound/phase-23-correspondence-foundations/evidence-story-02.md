# Evidence — SB-23-02 — Window Digests and Recap Replay

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/engine/src/correspondence.ts` — window digests:
  per-player deltas (buildings started/completed, flags, land area,
  stock, serfs) computed from state before/after each window at the
  boundary, identically on both sides (`lastWindowDigest`); and the
  stepped move replay (`beginMoveReplay`) — the same trustless
  re-simulation as `applyMove`, drivable in chunks so the shell renders
  the opponent's window at high speed before `finish()` verifies the
  checksum and commits (or rejects and restores). `applyMove` is now
  the atomic form of the same core.
- `serfbound/packages/engine/src/simulation.ts` — `monotonicTick`: the
  uint16 game tick wraps every 65,536 ticks; window/turn bookkeeping now
  rides game time (uint32 seconds + sub-second ticks), which does not.
  A real correctness bug for day-scale matches (and ~24-minute realtime
  sessions) found while building the chunked replay — correspondence
  window math and the Phase 22 lockstep pump both switched over.
- `serfbound/packages/app/src/recap.ts` — `createRecapDriver` (one
  chunk per shell frame, ~16x at the 175ms cadence) and `digestLines`
  (digest text inside the game font's alphabet — no '+', losses spelled
  with '-', quiet windows say QUIET).
- `serfbound/packages/app/src/multiplayer.ts` — the lockstep pump uses
  the monotonic tick (the wrap fix) and keeps pumping in hidden tabs
  while a session runs (a backgrounded peer froze its game loop
  entirely — the visibility check now exempts running sessions).
- e2e determinism (a flake class fixed at the root): the init screen
  seeds games with `Math.random`, so every probe-grid spec had been
  playing a different world per run since Phase 16. `?seed=` now pins
  the start-screen seed (`main.ts` — also a shareable-worlds feature);
  the founding/mobile/loopback/high-DPI specs pin a site-rich seed
  (`6235842872325272`, found by searching start-view castle sites);
  the mobile castle probe dispatches fast synthetic taps (Playwright's
  `tap()` can straddle the 500ms long-press threshold under CI load,
  turning probes into tile inspects); the desktop probe gained
  scroll-and-retry passes.
- Tests: `tests/ci/app-recap.test.mjs` (frame-chunked replay to the
  verified end, identical digests both sides reflecting the window's
  events, tamper failure at finish with restoration, digest text inside
  the glyph set).

## Verification artifacts

```text
npm run test:unit -> # tests 204 / pass 204 / fail 0
npx playwright test -> 11 passed — three consecutive full-suite runs
  (1.9m each) after the determinism fixes, plus a fourth after final
  edits; previously the suite flaked roughly every other run
npm run test:docs -> serfbound-docs-ok
node --test tests/ci/app-recap.test.mjs ->
  ok 1 - the recap driver replays a window in frame chunks to the verified end
  ok 2 - a tampered move fails at finish and the match restores
  ok 3 - digest lines render inside the game font's alphabet
```

## Deviations from plan

- The shell's visual recap surface (the turn-flow screen that drives
  this driver) lands with SB-23-03/04 where the whose-turn UI lives;
  this story proves the driver end-to-end headless (chunked progression,
  verified landing, digest agreement) — recorded against the
  acceptance wording.
- The digest counts buildings/flags/land/stock/serfs; combat events are
  deferred until correspondence matches carry military action (the
  recap replay shows fights regardless — it re-simulates everything).
- Three latent defects fixed beyond plan scope, each found by this
  story's stabilization work and recorded above: the uint16 tick wrap,
  the hidden-tab pump freeze, and the random-seed e2e worlds.

## Follow-ups

- SB-23-03: the turn-flow UI (whose-turn states, countdown, hot-seat)
  surfaces the recap visually.
