# Evidence — SB-4-03 — Persist Imported Data Locally

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `serfbound/packages/app/src/imported-data-store.ts` - adds the current archive
  storage contract, record builder, IndexedDB implementation, and recoverable
  save/clear result helpers.
- `serfbound/packages/app/src/main.ts` - restores persisted archive bytes on
  mount, persists imported `SPAU.PA` bytes after catalog parsing, and exposes a
  clear/reset flow.
- `serfbound/packages/app/src/styles.css` - styles the reset button without
  changing the browser shell layout model.
- `serfbound/tests/ci/app-imported-data-store.test.mjs` - tests generated-byte
  metadata records, save/load/clear behavior, and storage error results.
- `serfbound/tests/browser/static-shell.spec.ts` - proves generated archive
  import, IndexedDB persistence, reload restore, reset, and reload-empty states.
- `pm/roadmap/serfbound/phase-2-browser-foundation/artifacts/story-04-app-shell-desktop.png`
  - refreshed browser-shell evidence with the reset control present.
- PMO story/status files and `pm/roadmap/serfbound/README.md` - mark SB-4-03
  done and SB-4-04 ready.

## Behavior protected

- Imported archive metadata and bytes are stored locally in IndexedDB under a
  versioned current DOS `.PA` record.
- Reload restores persisted bytes and immediately re-runs catalog parsing.
- Users can clear the stored archive and reload into the missing-data state.
- Storage failures are surfaced as recoverable UI/error results instead of
  crashing the app shell.
- All committed tests use generated archive bytes only; original assets remain
  ignored and opt-in/manual.

## Commands and output

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm test && npm run check:boundaries && npm run test:local:assets'
```

Output summary:

```text
24 unit tests passed.
1 chromium browser smoke passed.
serfbound-boundaries-ok
serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
```

Manual/local browser command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && npm run preview -- --host 127.0.0.1 --port 4174'
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use >/dev/null && node <local Playwright persistence check>'
```

Output:

```text
serfbound-local-browser-persistence-ok
```

The local browser check imported ignored
`serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA`,
verified `4000 entries, 2749 defined, 255 fixups, persisted locally`, reloaded
and verified `Restored SPAU.PA: 4000 entries, 2749 defined`, then cleared the
stored record.
