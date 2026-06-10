# Serfbound Static Hosting Release

Serfbound releases as a static browser artifact. The first release path is:

1. Build and inspect the artifact.
2. Publish `serfbound/dist/` to a static host.
3. Serve it over HTTPS.
4. Keep original DOS/Amiga data outside the artifact and outside the host.

No server process, account system, cloud save service, desktop launcher, .NET
runtime, or native wrapper is part of the release path.

## Exact Commands

From the repository root:

```bash
cd serfbound
source ~/.nvm/nvm.sh
nvm use
npm ci
npm run release:static
npm run test:release:static
```

`npm run release:static` compiles the TypeScript packages, builds the Vite
browser artifact, and runs the release artifact inspection.

`npm run test:release:static` serves `dist/` from a local static host mounted at
`/serfbound/`, checks release cache headers, imports a generated `SPAU.PA`, and
verifies that browser storage restores the import after reload.

For the full release gate, run:

```bash
npm run ci:release
```

## Artifact

The release artifact is `serfbound/dist/`.

Expected shape after `npm run release:static`:

```text
dist/
  index.html
  assets/
    index-*.css
    index-*.js
```

The artifact must not contain:

- Original DOS/Amiga data files such as `SPAU.PA`, `SOUNDS.PA`, or disk images.
- .NET assemblies, native libraries, desktop launchers, installers, or app
  bundles.
- References to local-only paths such as `serfbound-local-data/`.

`npm run check:release-artifact` enforces those boundaries.

## Hosting Target

Use any static HTTPS host that can publish the contents of `serfbound/dist/`:

- GitHub Pages
- Cloudflare Pages
- Netlify
- Vercel static output
- An object bucket plus CDN
- A plain HTTPS file server

Serfbound is built with relative asset URLs, so it can be hosted at an origin
root such as `https://example.com/` or under a path such as
`https://example.com/serfbound/`.

For the first release, do not add server-side routes. If a host requires a
fallback setting, point only the Serfbound mount root to `index.html`; do not
add endpoints for original game data.

## Hosted-Origin Behavior

Players provide original game data through the browser file picker. The static
host never receives, stores, or serves that data.

Imported data and local saves are stored in IndexedDB on the browser origin:

- Imported archive database: `serfbound-imported-data`
- Local save database: `serfbound-local-game-saves`

Browser storage is scoped by scheme, host, and port. Moving from
`http://example.test` to `https://example.test`, changing subdomains, or using a
different port creates a different storage origin. Players may need to reimport
their local data after an origin change.

Changing only the path on the same origin does not create a new browser origin,
but release builds are still verified under `/serfbound/` so path-mounted
hosting works.

## Cache And Updates

Use this cache policy:

```text
index.html: Cache-Control: no-cache
assets/*:  Cache-Control: public, max-age=31536000, immutable
```

Vite emits hashed asset filenames. Long-lived caching is correct for files in
`assets/` because a content change creates a new filename. `index.html` must
revalidate so returning players receive the newest asset references after a
deployment.

Serfbound does not register a service worker in the first release path. If a
player sees stale UI after a deployment, refresh the page. If the issue remains,
clear site data for the Serfbound origin and reimport local data.

## Release Stop Signals

Do not release the artifact if any of these are true:

- `npm run release:static` fails.
- `npm run test:release:static` fails.
- `npm run ci:release` fails.
- `dist/` contains original game data, .NET artifacts, native runtime files, or
  desktop packaging.
- The hosted app cannot import a local `SPAU.PA` through the browser file picker
  and restore it from IndexedDB after reload.
