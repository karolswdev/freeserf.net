# Evidence — SB-19-04 — PWA Install and Offline Shell

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/public/manifest.webmanifest` — the installable app manifest
  (standalone display, theme colors, a self-drawn SVG icon — no original
  art in the manifest, per the asset boundary).
- `serfbound/public/icon.svg` — the app icon (original Serfbound art, not
  game data).
- `serfbound/public/sw.js` — the offline app shell worker: install-time
  precache of the shell plus the hashed build assets it references
  (parsed from the shell, so the very first visit suffices for offline
  play); cache-first for immutable hashed assets, network-first with
  cache fallback elsewhere; navigations fall back to the cached shell;
  `.PA` requests are never cached (original data lives only in the
  user's IndexedDB); a version endpoint for diagnostics. Cache matching
  ignores `Vary` — module-script requests carry CORS headers that
  otherwise miss the cached entries (a real bug the offline e2e caught).
- `serfbound/index.html` / `packages/app/src/main.ts` — manifest link,
  theme color, and `registerServiceWorker()` (secure contexts only,
  silent degradation).
- `serfbound/tests/browser/pwa-offline.spec.ts` — the offline proof: the
  manifest is wired, the worker activates, data imports into IndexedDB,
  and then OFFLINE: the shell boots from the cache, the imported data
  restores, and a game starts and runs without a network.

## Verification artifacts

```text
npx playwright test tests/browser/pwa-offline.spec.ts -> 1 passed
npm run test:browser -> 8 passed (1.8m)
```

## Deviations from plan

- Install-prompt UX (beforeinstallprompt banner) is browser-provided;
  a custom install button joins the SB-19-05 onboarding polish if the
  audit wants it.
- The icon is a single SVG (any-size/maskable); raster sizes can be added
  for legacy launchers at launch packaging (SB-20).

## Follow-ups

- SB-19-05: onboarding, accessibility, and settings close the phase.
