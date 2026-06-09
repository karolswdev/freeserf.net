# Evidence — SB-4-04 — Expose Typed Asset Catalog

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `serfbound/packages/assets/src/index.ts` - adds typed asset catalog groups,
  semantic resource handles, availability states, lookup, and renderer/UI/audio
  request paths built from the parsed DOS `.PA` catalog.
- `serfbound/tests/ci/asset-typed-catalog.test.mjs` - tests generated fixtures
  for semantic groups, renderer request handles, deferred decoder paths, missing
  groups, and hidden archive offsets.
- `serfbound/scripts/test-local-assets.mjs` - extends opt-in local `SPAU.PA`
  verification to compare typed catalog facts for terrain, objects, serfs, UI,
  sound, and music.
- PMO story/status/final-summary files and `pm/roadmap/serfbound/README.md` -
  mark SB-4-04 done, close Phase 4, and hand off to Phase 5.

## Behavior protected

- Typed catalog groups are aligned with `Freeserf.Core/Data/Data.cs` resource
  names and counts.
- Renderer-facing requests can ask for map ground, path ground, map objects,
  game objects, and map shadows without reading raw archive offsets.
- UI-facing requests expose font, font shadow, icons, and cursor placeholders.
- Audio-facing requests expose sound-effect and music placeholders with decoder
  status deferred.
- Missing and partial groups are explicit availability states.
- CI uses generated archive buffers only; real local `SPAU.PA` checks remain
  opt-in/manual.

## Commands and output

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm test && npm run check:boundaries && npm run test:local:assets'
```

Output summary:

```text
26 unit tests passed.
1 chromium browser smoke passed.
serfbound-boundaries-ok
serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
```

Opt-in local oracle command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 SERFBOUND_SPAU_PA="../serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA" npm run test:local:assets'
```

Output:

```text
serfbound-local-asset-tests-ok: parsed SPAU.PA catalog and matched Phase 1 oracle metadata plus typed catalog facts.
```
