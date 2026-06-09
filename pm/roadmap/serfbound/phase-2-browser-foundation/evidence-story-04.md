# Evidence — SB-2-04 — Prove Static Browser App Shell

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `serfbound/index.html` - static browser entry point.
- `serfbound/packages/app/src/main.ts` and
  `serfbound/packages/app/src/styles.css` - shell rendering, generated terrain
  preview, visible browser/runtime/missing-data state.
- `serfbound/playwright.config.ts` and
  `serfbound/tests/browser/static-shell.spec.ts` - browser smoke test against
  the built static shell.
- `serfbound/package.json` and `serfbound/package-lock.json` - Vite,
  Playwright, static build, preview, and browser-test commands.
- `.gitignore` - ignores generated `serfbound/dist/`, Playwright reports, and
  test results while allowing PMO screenshot artifacts.
- `pm/roadmap/serfbound/phase-2-browser-foundation/artifacts/story-04-app-shell-desktop.png`
  - Playwright screenshot proof of the rendered shell.
- `serfbound/README.md` - documents startup, static build, preview, test, and
  one-time Playwright browser install commands.
- `pm/roadmap/serfbound/phase-2-browser-foundation/story-04-static-browser-shell.md`
  - marks SB-2-04 done and checks acceptance criteria.
- `pm/roadmap/serfbound/phase-2-browser-foundation/current-phase-status.md`,
  `pm/roadmap/serfbound/README.md`, and
  `pm/roadmap/serfbound/adoption/phase-gate-verification-matrix.md` - record
  Phase 2 static-shell proof and final-audit gap.

## Browser artifact

- Screenshot:
  `pm/roadmap/serfbound/phase-2-browser-foundation/artifacts/story-04-app-shell-desktop.png`
- Dimensions: 1280 x 720.
- Contents: Serfbound browser shell, generated non-original terrain preview,
  browser runtime status, and no-game-data-imported state.

## Commands and output

One-time local Playwright browser setup:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use >/tmp/serfbound-nvm-use.out && npx playwright install chromium'
```

Output:

```text
Downloading Chrome for Testing 148.0.7778.96 (playwright chromium v1223) from https://cdn.playwright.dev/builds/cft/148.0.7778.96/mac-arm64/chrome-mac-arm64.zip
Chrome for Testing 148.0.7778.96 (playwright chromium v1223) downloaded to /Users/karol/Library/Caches/ms-playwright/chromium-1223
Downloading Chrome Headless Shell 148.0.7778.96 (playwright chromium-headless-shell v1223) from https://cdn.playwright.dev/builds/cft/148.0.7778.96/mac-arm64/chrome-headless-shell-mac-arm64.zip
Chrome Headless Shell 148.0.7778.96 (playwright chromium-headless-shell v1223) downloaded to /Users/karol/Library/Caches/ms-playwright/chromium_headless_shell-1223
```

Full default validation:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm test && npm run check:boundaries && npm run test:local:assets'
```

Output:

```text
Found '/Users/karol/dev/code/settlers-clone/freeserf.net/serfbound/.nvmrc' with version <22.21.0>
Now using node v22.21.0 (npm v11.6.2)

> serfbound-workspace@0.0.0 test
> npm run test:ci


> serfbound-workspace@0.0.0 test:ci
> npm run test:unit && npm run test:browser


> serfbound-workspace@0.0.0 test:unit
> npm run build && node --test tests/ci/*.test.mjs


> serfbound-workspace@0.0.0 build
> tsc -b packages/engine packages/assets packages/test-support packages/app

TAP version 13
# Subtest: rng-fixed-seed-sequence.json satisfies the oracle fixture header contract
ok 1 - rng-fixed-seed-sequence.json satisfies the oracle fixture header contract
  ---
  duration_ms: 2.861041
  type: 'test'
  ...
# Subtest: map-geometry-facts.json satisfies the oracle fixture header contract
ok 2 - map-geometry-facts.json satisfies the oracle fixture header contract
  ---
  duration_ms: 0.740542
  type: 'test'
  ...
# Subtest: fixture validator fails unsupported schema versions with an actionable error
ok 3 - fixture validator fails unsupported schema versions with an actionable error
  ---
  duration_ms: 0.271042
  type: 'test'
  ...
# Subtest: rng fixture is consumed as data by CI-safe tests
ok 4 - rng fixture is consumed as data by CI-safe tests
  ---
  duration_ms: 1.369416
  type: 'test'
  ...
# Subtest: map geometry fixture is consumed as data by CI-safe tests
ok 5 - map geometry fixture is consumed as data by CI-safe tests
  ---
  duration_ms: 0.56825
  type: 'test'
  ...
1..5
# tests 5
# suites 0
# pass 5
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 42.695875

> serfbound-workspace@0.0.0 test:browser
> npm run build:web && playwright test


> serfbound-workspace@0.0.0 build:web
> npm run build && vite build


> serfbound-workspace@0.0.0 build
> tsc -b packages/engine packages/assets packages/test-support packages/app

vite v8.0.16 building client environment for production...
transforming...✓ 8 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                 0.39 kB │ gzip: 0.26 kB
dist/assets/index-8eb-UuOo.css  2.03 kB │ gzip: 0.92 kB
dist/assets/index-DfrWoI1q.js   3.70 kB │ gzip: 1.61 kB

✓ built in 26ms

Running 1 test using 1 worker

  ✓  1 [chromium] › tests/browser/static-shell.spec.ts:8:1 › static app shell renders without original data or a desktop companion (138ms)

  1 passed (902ms)

> serfbound-workspace@0.0.0 check:boundaries
> node scripts/check-boundaries.mjs

serfbound-boundaries-ok

> serfbound-workspace@0.0.0 test:local:assets
> node scripts/test-local-assets.mjs

serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
```

Screenshot inspection:

```bash
ls -lh pm/roadmap/serfbound/phase-2-browser-foundation/artifacts/story-04-app-shell-desktop.png
file pm/roadmap/serfbound/phase-2-browser-foundation/artifacts/story-04-app-shell-desktop.png
```

Output:

```text
-rw-r--r--  1 karol  staff   114K Jun  9 16:22 pm/roadmap/serfbound/phase-2-browser-foundation/artifacts/story-04-app-shell-desktop.png
pm/roadmap/serfbound/phase-2-browser-foundation/artifacts/story-04-app-shell-desktop.png: PNG image data, 1280 x 720, 8-bit/color RGB, non-interlaced
```

## Acceptance criteria — re-checked

- [x] A browser shell page loads from the chosen workspace — Playwright opened
  the Vite static preview from `serfbound/`.
- [x] The shell has a smoke test or screenshot proving it renders —
  `static-shell.spec.ts` asserts visible shell state, nonblank canvas pixels,
  and writes the screenshot artifact.
- [x] The shell does not require original game data — validation ran with local
  asset environment variables unset and the shell shows no-game-data-imported
  state.
- [x] The shell does not require a desktop companion for normal play semantics —
  the tested path is a static Vite browser artifact served by `vite preview`.
- [x] The startup path is documented for future agents — `serfbound/README.md`
  documents build, preview, Playwright setup, and test commands.

## Residual risk

SB-2-04 proves the static shell and browser smoke path, not gameplay rendering
or import. Phase 4 owns real local data import, Phase 5 owns renderer/map scene
proof, and Phase 6 owns interaction shell behavior.
