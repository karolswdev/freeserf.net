# Evidence - SB-8-03 - Harden Persistence Recovery

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `serfbound/packages/app/src/imported-data-store.ts` - makes invalid imported
  data records explicit recoverable errors instead of silently treating them as
  missing data.
- `serfbound/packages/app/src/local-game-save-store.ts` - makes invalid local
  save records explicit recoverable errors instead of silently treating them as
  missing saves.
- `serfbound/packages/app/src/main.ts` - enables `Clear data` for corrupt
  imported data, enables `Clear save` for corrupt saves, preserves imported
  data when only the save is cleared, and keeps quota/write failures
  player-visible.
- `serfbound/tests/ci/app-imported-data-store.test.mjs` - covers version
  mismatch and corrupt metadata validation for both persisted record types.
- `serfbound/tests/browser/static-shell.spec.ts` - covers corrupt imported-data
  reset, corrupt save reset without losing imported data, and quota/write error
  UI feedback in Chromium.
- `pm/roadmap/serfbound/phase-8-browser-hardening/persistence-recovery-guide.md`
  - documents player troubleshooting, version mismatch behavior, and reset
  boundaries.
- PMO status/story files, `pm/roadmap/serfbound/README.md`, and
  `pm/roadmap/serfbound/adoption/phase-gate-verification-matrix.md` - mark
  SB-8-03 done and open SB-8-04 as the next Phase 8 gap.

## Behavior protected

- Corrupt imported-data metadata can be reset through `Clear data`.
- Corrupt save data can be reset through `Clear save` without deleting imported
  data.
- Unsupported storage versions are rejected as recoverable corruption.
- Quota/write failures for imported data and saves produce player-visible
  recoverable UI feedback.
- Normal play remains pure browser and still uses local user-provided data only.

## Baseline command

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm test && SERFBOUND_PERF_OUTPUT="../.tmp/performance-generated-gate.json" npm run measure:performance && npm run check:boundaries && npm run test:local:assets && SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 SERFBOUND_SPAU_PA="../serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA" npm run test:local:assets && cd .. && git diff --check'
```

Output summary:

```text
Node v22.21.0 selected from serfbound/.nvmrc.
46 unit tests passed.
5 Chromium browser tests passed.
Vite production build passed.
serfbound-performance-baseline-written: /Users/karol/dev/code/settlers-clone/freeserf.net/.tmp/performance-generated-gate.json
serfbound-performance-summary: tickAvg=0.000070ms frameP95=9.900ms import=198.184ms save=88.315ms reloadLoad=216.642ms
serfbound-boundaries-ok
serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
serfbound-local-asset-tests-ok: parsed SPAU.PA catalog and matched Phase 1 oracle metadata plus typed catalog and render-layer scene facts.
git diff --check passed with no output.
```
