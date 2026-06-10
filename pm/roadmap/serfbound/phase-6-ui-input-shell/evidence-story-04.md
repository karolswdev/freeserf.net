# Evidence — SB-6-04 — Verify Interaction Ergonomics

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `pm/roadmap/serfbound/phase-6-ui-input-shell/manual-interaction-script.md`
  - defines the repeatable mouse/trackpad, import recovery, start-game, and
  touch-capable browser check script.
- `pm/roadmap/serfbound/phase-6-ui-input-shell/shortcut-conflict-review.md`
  - documents browser-reserved shortcut conflicts and Phase 7 substitutions or
  deferrals.
- `pm/roadmap/serfbound/phase-6-ui-input-shell/interaction-ergonomics-audit.md`
  - records browser/version, OS, input-device notes, script execution summary,
  pointer feedback review, and blocking issue decision.
- `pm/roadmap/serfbound/phase-6-ui-input-shell/story-04-interaction-ergonomics.md`
  - marks SB-6-04 done.
- `pm/roadmap/serfbound/phase-6-ui-input-shell/current-phase-status.md` and
  `pm/roadmap/serfbound/phase-6-ui-input-shell/final-summary.md` - close Phase
  6 and hand off to Phase 7.
- `pm/roadmap/serfbound/phase-7-playable-slice/current-phase-status.md` and
  `pm/roadmap/serfbound/phase-7-playable-slice/story-01-start-local-game.md`
  - open SB-7-01 as ready.
- `pm/roadmap/serfbound/README.md` - records the interaction ergonomics
  baseline.

## Behavior protected

- Core map interactions have a repeatable manual verification script.
- Browser shortcut conflicts are explicitly documented before any global
  keyboard shortcuts are introduced.
- Pointer feedback is sufficient for Phase 7 build-action work: hover,
  selected tile, and action state are visible and persistent.
- Unsupported data import remains recoverable and does not block practice play.
- No Phase 7 blocking ergonomics issue was found.
- Physical touch hardware and separate physical trackpad breadth are documented
  as unavailable in this Codex environment and deferred to Phase 8 hardening;
  browser event paths are still covered.

## Browser And Device Evidence

```text
Browser: Playwright Chromium 148.0.7778.96
User agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/148.0.7778.96 Safari/537.36
Platform evidence: navigator.platform=MacIntel, navigator.maxTouchPoints=0
Host OS: macOS 26.2 build 25C56
```

Input notes:

- Mouse-style pointer: covered by Playwright `page.mouse.move()` and
  `page.mouse.click()` over the canvas.
- Trackpad-style pointer: Chromium exposes the same `pointerType: "mouse"`
  event path; no separate physical trackpad signal was available to automation.
- Touch-style pointer: covered at the Pointer Events boundary by dispatching a
  touch-style `PointerEvent`; physical touch hardware was not available.

## Commands and output

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm test && npm run check:boundaries && npm run test:local:assets && SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 SERFBOUND_SPAU_PA="../serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA" npm run test:local:assets && cd .. && git diff --check'
```

Output summary:

```text
35 unit tests passed.
2 chromium browser tests passed.
serfbound-boundaries-ok
serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
serfbound-local-asset-tests-ok: parsed SPAU.PA catalog and matched Phase 1 oracle metadata plus typed catalog and render-layer scene facts.
git diff --check passed with no output.
```

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && npm run test:browser'
```

Output summary:

```text
2 chromium browser tests passed.
```

Command:

```bash
zsh -lc 'sw_vers'
```

Output summary:

```text
ProductName: macOS
ProductVersion: 26.2
BuildVersion: 25C56
```

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use >/dev/null && node --input-type=module -e "import { chromium } from \"@playwright/test\"; const browser = await chromium.launch(); const page = await browser.newPage(); await page.goto(\"about:blank\"); console.log(JSON.stringify({playwrightChromiumVersion: browser.version(), userAgent: await page.evaluate(() => navigator.userAgent), platform: await page.evaluate(() => navigator.platform), maxTouchPoints: await page.evaluate(() => navigator.maxTouchPoints)})); await browser.close();"'
```

Output summary:

```json
{"playwrightChromiumVersion":"148.0.7778.96","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/148.0.7778.96 Safari/537.36","platform":"MacIntel","maxTouchPoints":0}
```
