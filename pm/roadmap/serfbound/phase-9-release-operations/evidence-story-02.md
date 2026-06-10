# Evidence - SB-9-02 - Define Static Hosting Release Path

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `serfbound/vite.config.ts` - sets the browser build base to `./` so release
  assets are relative and work at an origin root or path mount.
- `serfbound/package.json` - adds `npm run release:static` and
  `npm run test:release:static`.
- `serfbound/scripts/test-static-hosting.mjs` - serves `dist/` at
  `/serfbound/`, verifies cache headers, imports generated `SPAU.PA`, and
  proves IndexedDB restore after reload.
- `serfbound/docs/static-hosting-release.md` - documents the release artifact,
  hosting target, origin-scoped storage behavior, cache/update policy, commands,
  and stop signals.
- PMO status/story files and `pm/roadmap/serfbound/README.md` - mark SB-9-02
  done and open SB-9-03.

## Behavior protected

- The release artifact is static-only `serfbound/dist/`.
- Release hosting works at a subpath such as `/serfbound/`, not only at an
  origin root.
- `index.html` is expected to revalidate; hashed `assets/*` files are expected
  to be immutable.
- User-owned original data still enters only through the browser file picker and
  persists only in origin-scoped IndexedDB.
- No original data, .NET runtime, native runtime, desktop launcher, or installer
  is included in the artifact.

## Release path

Exact first-release commands:

```bash
cd serfbound
source ~/.nvm/nvm.sh
nvm use
npm ci
npm run release:static
npm run test:release:static
npm run ci:release
```

Release artifact:

```text
serfbound/dist/
```

Current generated artifact shape:

```text
dist/index.html
dist/assets/index-DqBBmPy4.js
dist/assets/index-U5AdamHH.css
```

Current `dist/index.html` uses relative release asset URLs:

```text
./assets/index-DqBBmPy4.js
./assets/index-U5AdamHH.css
```

## Baseline command

Command:

```bash
cd serfbound
source ~/.nvm/nvm.sh
nvm use
env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm run ci:release
cd ..
git diff --check
```

Output summary:

```text
Node v22.21.0 / npm v11.6.2 selected from serfbound/.nvmrc.
46 CI-safe unit/parity tests passed.
5 Chromium browser smoke/recovery tests passed.
vite v8.0.16 built dist/index.html plus hashed CSS and JS assets.
serfbound-boundaries-ok
serfbound-release-artifact-ok: inspected 3 static files in dist/.
serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
serfbound-static-hosting-ok: served dist at /serfbound/, imported generated SPAU.PA, and restored IndexedDB state after reload.
git diff --check produced no output.
```

## Documentation proof

`serfbound/docs/static-hosting-release.md` documents:

- `serfbound/dist/` as the release artifact.
- Static HTTPS hosts as the deployment target.
- No server-side original asset hosting.
- File picker import and IndexedDB origin scoping.
- `Cache-Control: no-cache` for `index.html`.
- `Cache-Control: public, max-age=31536000, immutable` for `assets/*`.
- Stop signals for failed build, failed static-hosting verification, failed
  release CI, forbidden artifacts, or broken browser import/restore behavior.
