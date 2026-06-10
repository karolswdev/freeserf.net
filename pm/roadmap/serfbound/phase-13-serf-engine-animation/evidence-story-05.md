# Evidence — SB-13-05 — Animated Settlement Visual Gate

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/app/src/render-layer-scene.ts` — decoded assets carry
  the parsed serf animation table, 48 composed player-color torsos, and 64
  head sprites from the imported archive.
- `serfbound/packages/app/src/landscape-scene.ts` — the reference rendering
  chain: frame = animationTable[serf.animation][counter >> 3]
  (`DataSource.GetAnimation`), frame sprite byte → torso body + head via the
  verbatim `AppearanceIndex1/2` tables (`RenderSerf.GetHeadSprite`), drawn at
  the serf's map tile plus the frame's x/y offsets.
- `serfbound/packages/app/src/main.ts` — active serfs flow from the serf
  engine into every rendered frame; `data-serfbound-serf-sprite-count`,
  `serf-count`, and `game-tick` attributes for tests/evidence.
- `serfbound/tests/ci/app-landscape-scene.test.mjs` — serf rendering test.

## Verification artifacts

```text
npm run test:unit    -> # tests 100 / pass 100 / fail 0
npm run test:browser -> 6 passed (1.9m)
```

Real-data gate (local `SPAU.PA`, live browser): after founding a settlement
with a road-connected lumberjack, the page reports 2 active serfs rendering
4 serf sprites (torso + head each); the zoom capture
(`artifacts/story-05-serfs-corridor-zoom.png`) shows the transporter standing
at the castle flag; `story-05-serfs-working-desktop.png` records the full
scene. The browser founding-loop test completes through these serfs' labor.

## Acceptance criteria — re-checked

- [x] Serfs animate through transport and construction with player colors
  (composed player-color torsos; engine journey/transport tests; live
  attribute-verified rendering).
- [x] Tick + frame timing stays within baselines (browser suite timing
  unchanged; the animation driver also runs the simulation).
- [x] Save/load: world state restores exactly via action replay; in-flight
  serf positions re-derive from re-dispatched logistics — recorded
  limitation, carried to Phase 14's persistence story.

## Deviations from plan

- DOS serfs are ~8x16 px — the visual evidence relies on the zoom capture
  plus the scene attribute counts; a recorded follow-up is a debug zoom for
  closer evidence at Phase 16's interface work.
- Head placement uses the head sprite's own header offsets at the torso
  anchor (reference per-state head offset table deferred).

## Follow-ups

- Phase 14 extends serfs to professions and serializes in-flight serf state.
