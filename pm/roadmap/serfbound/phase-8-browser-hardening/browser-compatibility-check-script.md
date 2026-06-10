# Browser Compatibility Check Script

**Story:** SB-8-04 - Verify Browser Compatibility
**Status:** baseline v1

## Automated Command

Run from the repository root:

```bash
cd serfbound
npx playwright install chromium firefox webkit
npm run test:compatibility
```

The install command is required on a fresh machine if the Playwright browser
engines are not already present. `npm run test:compatibility` builds the
browser app, serves the static Vite preview on `127.0.0.1:4174`, and runs one
smoke test across:

- `desktop-chromium`
- `desktop-firefox`
- `desktop-webkit`
- `mobile-chrome`
- `mobile-safari`

The smoke records browser/version metadata in
`artifacts/story-04-browser-compatibility-report.json`.

## Manual Review Checklist

For each browser position, confirm the report records:

- project name and engine;
- user agent and viewport;
- WebGL2 renderer status and nonblank pixel count;
- local file import status;
- IndexedDB import/save/load status;
- pointer and touch-style input status;
- keyboard focus status;
- contrast minimum and reduced-motion preference.

## Physical Device Follow-Up

If physical Android or iOS devices are available before release readiness:

1. Serve the built app from a static origin.
2. Import a user-owned `SPAU.PA`.
3. Start a local game.
4. Move/select on the map with touch input.
5. Save, reload, load, and verify the saved state returns.
6. Record browser name/version, device, OS version, viewport, renderer, and
   any failed step.

Physical-device evidence is not required to close SB-8-04, but any physical
device failure is a release-readiness stop signal.
