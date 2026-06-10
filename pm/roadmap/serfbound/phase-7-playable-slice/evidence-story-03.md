# Evidence — SB-7-03 — Add Browser Save/Load Loop

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `serfbound/packages/engine/src/local-game.ts` - adds validated local-game
  snapshot restore and recoverable restore rejection reasons.
- `serfbound/packages/app/src/local-game-save-store.ts` - adds a dedicated
  IndexedDB-backed Serfbound local game save store with versioned source
  metadata, save/load/clear helpers, and cloning.
- `serfbound/packages/app/src/main.ts` - adds Save, Load, and Clear Save browser
  controls, wires save records to running local game snapshots, restores saved
  game state after browser reload, and keeps save errors recoverable.
- `serfbound/tests/ci/engine-local-game.test.mjs` - verifies saved snapshot
  restore, deterministic resume, and corrupt snapshot rejection.
- `serfbound/tests/ci/app-imported-data-store.test.mjs` - verifies local save
  record metadata, store save/load/clear behavior, and recoverable store errors.
- `serfbound/tests/browser/static-shell.spec.ts` - verifies browser save,
  reload, load, restored built-flag state, and clear-save behavior.
- `pm/roadmap/serfbound/phase-7-playable-slice/story-03-browser-save-load-loop.md`
  - marks SB-7-03 done.
- `pm/roadmap/serfbound/phase-7-playable-slice/story-04-playable-loop-verification.md`
  - opens SB-7-04 as ready.
- `pm/roadmap/serfbound/phase-7-playable-slice/current-phase-status.md` and
  `pm/roadmap/serfbound/README.md` - record the browser save/load baseline.

## Behavior protected

- A running local browser game can be saved after the first visible build
  action.
- Save data is Serfbound-owned, versioned with `schemaVersion: 1`, and stores
  imported `SPAU.PA` source metadata separately from the imported data record.
- Browser reload restores imported data and exposes the saved local game for
  loading.
- Loading reconstructs engine state through `restoreSerfboundLocalGame()` and
  redraws the built flag from restored `builtStructures`.
- Missing, corrupt, or storage-error save paths stay recoverable and do not
  crash the browser shell.
- Original DOS/Amiga data remains user-provided only; no original assets,
  desktop companion, native launcher, or .NET runtime is introduced.

## Commands and output

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm test && npm run check:boundaries && npm run test:local:assets && SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 SERFBOUND_SPAU_PA="../serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA" npm run test:local:assets && cd .. && git diff --check'
```

Output summary:

```text
44 unit tests passed.
2 chromium browser tests passed.
serfbound-boundaries-ok
serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
serfbound-local-asset-tests-ok: parsed SPAU.PA catalog and matched Phase 1 oracle metadata plus typed catalog and render-layer scene facts.
git diff --check passed with no output.
```

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && npm run test:unit'
```

Output summary:

```text
44 unit tests passed.
```

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && npm run test:browser'
```

Output summary:

```text
2 chromium browser tests passed.
```
