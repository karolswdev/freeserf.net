# Evidence - SB-8-04 - Verify Browser Compatibility

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `serfbound/playwright.compatibility.config.ts` - adds dedicated Playwright
  compatibility projects for desktop Chromium, desktop Firefox, desktop
  WebKit, mobile Chrome, and mobile Safari.
- `serfbound/tests/browser/compatibility.spec.ts` - adds the browser
  compatibility smoke for WebGL2 rendering, file import, IndexedDB save/load,
  pointer/touch-style input, keyboard focus, contrast, and reduced-motion state.
- `serfbound/playwright.config.ts` - keeps the default screenshot/browser suite
  focused on its existing Chromium tests by excluding the compatibility spec.
- `serfbound/package.json` - adds `npm run test:compatibility`.
- `serfbound/packages/app/src/main.ts` and `serfbound/packages/app/src/styles.css`
  - make the visible `Import data` control keyboard-focusable while keeping the
  native file input programmatically reachable.
- `pm/roadmap/serfbound/phase-8-browser-hardening/browser-compatibility-matrix.md`
  - records the browser matrix, stop signals, accessibility basics, and known
  limitations.
- `pm/roadmap/serfbound/phase-8-browser-hardening/browser-compatibility-check-script.md`
  - records the command and physical-device follow-up checklist.
- `pm/roadmap/serfbound/phase-8-browser-hardening/artifacts/story-04-browser-compatibility-report.json`
  - stores browser/version metadata and pass results for each position.
- `pm/roadmap/serfbound/phase-8-browser-hardening/final-summary.md`,
  story/status files, `pm/roadmap/serfbound/README.md`, and
  `pm/roadmap/serfbound/adoption/phase-gate-verification-matrix.md` - close
  Phase 8 and open Phase 9.

## Behavior protected

- The first playable slice runs in desktop Chromium, Firefox, and WebKit.
- The first playable slice runs in mobile Chrome and mobile Safari Playwright
  device profiles.
- WebGL2 rendering is nonblank in every measured browser position.
- File import, IndexedDB persistence, save/reload/load, pointer input,
  touch-style pointer input, keyboard focus, contrast, and reduced-motion state
  are checked in the compatibility smoke.
- Normal play remains pure browser and does not introduce .NET, desktop, native
  launcher, local companion process, or bundled original data.

## Compatibility command

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && npm run test:compatibility'
```

Output summary:

```text
Node v22.21.0 selected from serfbound/.nvmrc.
Vite production build passed.
5 compatibility browser tests passed:
- desktop-chromium
- desktop-firefox
- desktop-webkit
- mobile-chrome
- mobile-safari
```

## Baseline command

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm test && npm run test:compatibility && SERFBOUND_PERF_OUTPUT="../.tmp/performance-generated-gate.json" npm run measure:performance && npm run check:boundaries && npm run test:local:assets && SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 SERFBOUND_SPAU_PA="../serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA" npm run test:local:assets && cd .. && git diff --check'
```

Output summary:

```text
Node v22.21.0 selected from serfbound/.nvmrc.
46 unit tests passed.
5 Chromium browser tests passed.
5 compatibility browser tests passed across desktop-chromium, desktop-firefox, desktop-webkit, mobile-chrome, and mobile-safari.
Vite production builds passed.
serfbound-performance-baseline-written: /Users/karol/dev/code/settlers-clone/freeserf.net/.tmp/performance-generated-gate.json
serfbound-performance-summary: tickAvg=0.000069ms frameP95=9.600ms import=188.927ms save=84.752ms reloadLoad=201.006ms
serfbound-boundaries-ok
serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
serfbound-local-asset-tests-ok: parsed SPAU.PA catalog and matched Phase 1 oracle metadata plus typed catalog and render-layer scene facts.
git diff --check passed with no output.
```

## Compatibility artifact

`artifacts/story-04-browser-compatibility-report.json` records:

```text
desktop-chromium: Chrome 148.0.7778.96, WebGL2, import/storage/input/accessibility pass, 902208 nonblank pixels
desktop-firefox: Firefox 150.0.2, WebGL2, import/storage/input/accessibility pass, 902208 nonblank pixels
desktop-webkit: Safari/WebKit 26.4, WebGL2, import/storage/input/accessibility pass, 902208 nonblank pixels
mobile-chrome: Chrome 148.0.7778.96 mobile profile, WebGL2, import/storage/input/accessibility pass, 151152 nonblank pixels
mobile-safari: Safari/WebKit 26.4 mobile profile, WebGL2, import/storage/input/accessibility pass, 114240 nonblank pixels
minimum sampled contrast ratio: 8.66
```

Known limitation:

```text
Mobile Chrome and mobile Safari checks are Playwright device emulation, not
physical device evidence. Physical-device contradiction is a Phase 9 release
readiness stop signal.
```
