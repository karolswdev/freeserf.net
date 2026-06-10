# Evidence — SB-12-05 — Found a Settlement End-to-End

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/app/src/main.ts` — minimal build UI: road mode
  (Build road → start flag → destination flag, auto-pathed by the engine
  pathfinder), Build lumberjack on the selected tile, world-state button
  gating, accepted-effect data attribute, command status texts.
- `serfbound/packages/app/src/local-game-save-store.ts` — saved game records
  persist the world-action log (the field the whitelist cloner had dropped —
  caught by the end-to-end browser test).
- `serfbound/tests/browser/decoded-scene.spec.ts` — the full founding loop:
  castle → flag → road (road mode) → lumberjack → construction completes on
  the game clock → save → reload → load → world intact (castle, 3 flags,
  2 buildings).

## Verification artifacts

```text
npm run test:unit    -> # tests 92 / # pass 92 / # fail 0
npm run test:browser -> 6 passed (14.1s)   (includes the founding loop)
npm run ci:release   -> all gates green, data-free
```

Real-data captures: `artifacts/story-05-founding-*.png` (5194 decoded
sprites on screen with the founded settlement).

## Acceptance criteria — re-checked

- [x] Browser flow works end-to-end: castle → road → hut-class building →
  construction completes → save → reload → load → state intact (Playwright,
  data-free fixture archive; real-data capture manually).
- [x] All commands route through the deterministic command router (world
  actions recorded and replayed).
- [x] Real-data screenshots recorded; data-free browser test covers the flow.
- [x] (Transferred from SB-12-02) A browser user lays roads interactively in
  road mode with engine validity feedback.

## Deviations from plan

- The "minimal build UI" offers one building type (lumberjack) as planned;
  the full build menu is Phase 16.

## Follow-ups

- Phase 13 replaces interim construction with serf labor and deletes the
  time-stepped path.
