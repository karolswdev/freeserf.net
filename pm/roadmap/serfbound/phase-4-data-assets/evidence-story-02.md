# Evidence — SB-4-02 — Parse DOS PA Resource Catalog

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `serfbound/packages/assets/src/index.ts` - adds the browser-native DOS `.PA`
  catalog parser, inherited-entry fixups, resource availability metadata, and
  typed parse errors.
- `serfbound/packages/app/src/main.ts` - parses selected `SPAU.PA` bytes through
  the browser import boundary and reports parsed/invalid catalog state.
- `serfbound/tests/ci/asset-pa-catalog.test.mjs` - tests generated valid and
  malformed archives without original data.
- `serfbound/tests/browser/static-shell.spec.ts` - proves browser file import
  reaches catalog parsing with a generated `SPAU.PA`.
- `serfbound/scripts/test-local-assets.mjs` - compares an explicitly provided
  local `SPAU.PA` against ignored Phase 1 oracle metadata.
- PMO status/story files - mark SB-4-02 done and keep later Phase 4 gates open.

## Behavior protected

- Browser-selected `SPAU.PA` files are read via `File.arrayBuffer()` and parsed
  without a desktop helper or .NET runtime.
- Parser recognizes the actual DOS catalog layout: declared file size, entry
  count, 4,000 `size, offset` table rows, and the old loader's 255 fixups.
- Malformed/truncated archives fail with actionable parser errors.
- Default CI remains data-free and uses generated archive buffers only.
- Real local asset validation is opt-in/manual and does not copy payload bytes
  into tracked paths.

## Commands and output

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm test && npm run check:boundaries && npm run test:local:assets'
```

Output summary:

```text
21 unit tests passed.
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
serfbound-local-asset-tests-ok: parsed SPAU.PA catalog and matched Phase 1 oracle metadata.
```
