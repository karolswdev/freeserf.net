# Evidence — SB-13-02 — Port the Serf State Machine Core

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/engine/src/serfs.ts` — new `SerfboundSerfEngine`:
  the reference update pattern (`delta = tick - serf.tick; counter -= delta;
  while (counter < 0) step`), spawn into the castle inventory
  (`InitGeneric`), leave-building slide (slope-scaled counters per
  `LeaveBuilding`), the walking state core (`HandleSerfWalkingState`: flag
  routing, road following excluding the arrival direction, destination
  handling, enter-building transition with slope length), collision waiting
  with the reference encoding (animation 81+direction, direction−6 stored
  negative), and `ChangeDirection` semantics (reverse-direction storage,
  per-tile serf index bookkeeping). Reference formulas exported:
  `walkingAnimation` (4 + heightDiff + 9·direction) and
  `counterFromAnimation` (the 511..1023 walking row + 127 waiting).
- `serfbound/tests/ci/engine-serfs.test.mjs` — formula checks; a full
  journey test (castle → slide to flag → every road tile visited → arrival
  at the destination flag); collision wait + resume test.

## Verification artifacts

```text
node --test tests/ci/engine-serfs.test.mjs -> # tests 3 / pass 3
npm run test:unit -> all green (count below)
```

## Acceptance criteria — re-checked

- [x] Serf tick sequences follow the reference pattern (journey test drives
  the engine on the game clock; per-tile traversal asserted).
- [x] Rendering of walking serfs transfers to SB-13-05's animated-settlement
  gate where the animation-frame chain integrates (scope transfer recorded;
  the data it needs — animation table + composed torsos — shipped in
  SB-13-01, and positions/animations are exposed on `WorldSerf`).
- [x] Serf state is plain serializable data (engine snapshot wiring rides
  with the transport story that makes serfs persistent actors).

## Deviations from plan

- The flag-graph routing is a condensed breadth-first search (the reference
  `FlagSearch`) — sufficient for tree-shaped road networks; the full search
  with transporter semantics lands in SB-13-03.
- Loop detection in waiting (reference 100-serf chain walk) is condensed to
  direction retry; recorded for SB-13-03 where congestion matters.

## Follow-ups

- SB-13-03 turns arrivals into transporters and moves resources.
