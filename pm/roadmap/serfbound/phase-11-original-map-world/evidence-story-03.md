# Evidence — SB-11-03 — Place Map Objects and Minerals

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/engine/src/local-game.ts` —
  `landscapeForLocalGameSettings()` and `SerfboundLocalGame.landscape()`:
  the generated world derives deterministically from the saved seed string
  (lazily cached per game), so saves stay small and restores rebuild the
  identical landscape.
- `serfbound/tests/ci/engine-local-game-landscape.test.mjs` — determinism,
  restore-identity, and placement-rule fact tests.

## Scope note

Object and mineral *placement* itself shipped inside SB-11-02 (the generator
ports as one unit because its RNG stream spans all stages — recorded there).
This story delivers the remaining acceptance criteria: the engine exposes the
landscape queryably per position with sprite-index-compatible object values,
and placement facts are proven on derived game landscapes.

## Verification artifacts

```text
node --test tests/ci/engine-local-game-landscape.test.mjs
# tests 3 / # pass 3 / # fail 0

npm run test:unit
# tests 70 / # pass 70 / # fail 0
```

Facts proven on the default-seed landscape: fish only on water tiles; mineral
amounts follow the reference 4*(count-j) rule; every tree/pine stands on
grass triangles; water trees sit in shallow water; heights stay in 0..31;
landscapes regenerate identically across start/restore.

## Acceptance criteria — re-checked

- [x] Object and mineral placement matches the SB-11-01 fixture (proven in
  SB-11-02's per-position parity, which covers objects and minerals).
- [x] Objects carry the sprite-index-compatible `objectType` values the
  Phase 10 renderer maps via `objectType - 8`.
- [x] Engine map snapshot exposes objects/minerals queryably per position
  (typed arrays on `ClassicMapLandscape`, reachable from the local game).

## Deviations from plan

- Re-scoped per the SB-11-02 decision; no placement logic was duplicated.

## Follow-ups

- SB-11-04 renders this landscape through the scrolling viewport.
