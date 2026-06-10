# Browser Compatibility Matrix

**Story:** SB-8-04 - Verify Browser Compatibility
**Status:** baseline v1
**Measured:** 2026-06-09

## Scope

This matrix covers the current first playable browser slice: generated data
preview, local `.PA` file import path using generated CI-safe bytes, WebGL2 map
rendering, IndexedDB import/save persistence, pointer/touch-style input,
keyboard focus, contrast, and reduced-motion state.

The automated proof is `npm run test:compatibility`, which writes
`artifacts/story-04-browser-compatibility-report.json`.

## Automated Matrix

| Position | Engine / project | Browser metadata | Renderer | File import | Storage | Input | Accessibility basics | Status |
|---|---|---|---|---|---|---|---|---|
| Chrome desktop | Playwright Chromium `desktop-chromium` | Chrome 148.0.7778.96 UA, 1280x720, DPR 1 | WebGL2 pass, 902,208 nonblank pixels | pass | IndexedDB import/save/load pass | pointer + synthetic touch pointer pass | keyboard focus pass, contrast min 8.66, reduced motion observed | pass |
| Firefox desktop | Playwright Firefox `desktop-firefox` | Firefox 150.0.2 UA, 1280x720, DPR 1 | WebGL2 pass, 902,208 nonblank pixels | pass | IndexedDB import/save/load pass | pointer + synthetic touch pointer pass | keyboard focus pass, contrast min 8.66, reduced motion observed | pass |
| Safari/WebKit desktop | Playwright WebKit `desktop-webkit` | Safari/WebKit 26.4 UA, 1280x720, DPR 2 | WebGL2 pass, 902,208 nonblank pixels | pass | IndexedDB import/save/load pass | pointer + synthetic touch pointer pass | keyboard focus pass, contrast min 8.66, reduced motion observed | pass |
| Mobile Chrome | Playwright Chromium `mobile-chrome`, Pixel 7 profile | Chrome 148.0.7778.96 mobile UA, 412x839, DPR 2.625 | WebGL2 pass, 151,152 nonblank pixels | pass | IndexedDB import/save/load pass | pointer + synthetic touch pointer pass | keyboard focus pass, contrast min 8.66, reduced motion observed | pass |
| Mobile Safari | Playwright WebKit `mobile-safari`, iPhone 15 profile | Safari/WebKit 26.4 mobile UA, 393x659, DPR 3 | WebGL2 pass, 114,240 nonblank pixels | pass | IndexedDB import/save/load pass | pointer + synthetic touch pointer pass | keyboard focus pass, contrast min 8.66, reduced motion observed | pass |

## Manual / Device Notes

The SB-8-04 available-browser check is scripted through Playwright instead of a
hand-clicked physical-device pass. It records browser/version metadata,
viewport, user agent, pixel proof, and capability status per browser position.

Physical iOS Safari and physical Android Chrome were not available in this
session. The release readiness review must decide whether the Playwright mobile
positions are enough for the first release candidate or whether physical-device
checks are a blocking follow-up.

## Accessibility Basics

The compatibility smoke verifies:

- Keyboard focus reaches the visible `Import data` control instead of a hidden
  file input.
- Visible text/control contrast sampled by the smoke test has a minimum ratio
  of 8.66, above the 4.5 baseline for normal text.
- The runtime records the current `prefers-reduced-motion` state. The current
  shell has no animation or transition-dependent gameplay path.
- Pointer input and a touch-style `PointerEvent` path both update map hover
  state.

## Stop Signals

Block Phase 9 release readiness if any of these appear:

- WebGL2 is unavailable or the scene reports zero/non-threshold nonblank pixels
  in any supported baseline position.
- Local file import or IndexedDB save/load fails in Chrome, Firefox, or
  Safari/WebKit baseline positions.
- Mobile Chrome or mobile Safari emulation fails rendering, import, storage, or
  input checks.
- Keyboard focus cannot reach visible controls, or text/control contrast drops
  below 4.5 for player-facing normal text.
- Physical-device release checks, if required by SB-9-04, contradict the
  Playwright mobile positions.

## Known Limitations

- Mobile Chrome and mobile Safari evidence is Playwright device emulation, not
  physical hardware.
- The matrix covers the first playable slice only, not full original gameplay,
  audio, performance on low-end devices, or long-session memory behavior.
- WebGPU, OffscreenCanvas, workers, and original savegame compatibility are not
  release assumptions.
