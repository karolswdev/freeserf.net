# Evidence — SB-18-02 — Classic AI Foundation

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/engine/src/ai.ts` — `SerfboundAiPlayer`, staged
  like the reference `AI.cs`: paced decision windows on game ticks; the
  founding stage walks a per-player anchor lattice to the first
  founding-valid spot; the establishment stage builds the reference
  opening order (lumberjack → sawmill → stonecutter → forester → hut →
  farm → mill → baker), each sited near the castle and connected to the
  castle flag via the pathfinder, with construction logistics dispatched
  over the new road. Every action goes through `applyWorldAction` and is
  recorded as a world action — **AI games save and replay identically**.
  The `decisions` log makes seeded runs fixture exactly.
- `serfbound/packages/app/src/main.ts` — every non-human slot of a
  running game gets an AI driver (mission starts and restored saves);
  the sim timer drives them each pass; `data-serfbound-ai-count`.
- `serfbound/tests/ci/engine-ai-foundation.test.mjs` — decision fixtures
  on seeded runs: two identical seeds found the identical castle with
  identical first decisions; the establishment follows the plan order
  (lumberjack first, sawmill second) with at least two AI buildings
  COMPLETING through serf labor over the AI's own roads; mission AI slots
  (ACORN's pinned castle) start establishing immediately.

## Verification artifacts

```text
node --test tests/ci/engine-ai-foundation.test.mjs -> # tests 3 / pass 3
npm run test:unit -> # tests 163 / pass 163 / fail 0
npm run test:browser -> 6 passed (1.7m)
```

## Deviations from plan

- Decision fixtures are seeded self-regression fixtures over the staged
  reference behaviors (founding, establishment order, road-connected
  expansion). Tick-exact traces against the C# reference runs are not
  reproducible without running the .NET implementation; recorded as the
  fixture boundary — the staged ORDER and the determinism are what the
  fixtures pin.
- The reference AI's intelligence-driven variation (timing jitter by
  character) lands with SB-18-03's behavior work.

## Follow-ups

- SB-18-03: economy depth (mines, weapons) and military behaviors
  (garrisons, attacks) on top of this foundation.
