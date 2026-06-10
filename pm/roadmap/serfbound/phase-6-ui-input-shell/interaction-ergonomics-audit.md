# Phase 6 Interaction Ergonomics Audit

**Run date:** 2026-06-09
**Browser:** Playwright Chromium `148.0.7778.96`
**User agent:** `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/148.0.7778.96 Safari/537.36`
**Platform evidence:** `navigator.platform=MacIntel`, `navigator.maxTouchPoints=0`
**Host OS:** macOS `26.2` build `25C56`

## Input Device Notes

| Input | Evidence | Result |
|---|---|---|
| Mouse-style pointer | Playwright `page.mouse.move()` and `page.mouse.click()` execute the canvas hover/selection path in Chromium. | Passed. Hover, Selected Tile, and Action panels update. |
| Trackpad-style pointer | Chromium exposes trackpad pointer movement through the same `pointerType: "mouse"` browser path used by the Playwright mouse check. | No separate physical trackpad signal was available to automation; no Phase 7 blocker found because the browser event path is the same. |
| Touch-style pointer | Browser smoke dispatches a touch-style `PointerEvent` against the canvas and verifies `data-serfbound-pointer-type="touch"` plus visible feedback. | Passed at Pointer Events boundary. Physical touch hardware was not available in this environment. |

## Script Execution Summary

| Script area | Evidence | Result |
|---|---|---|
| First screen panels | Browser smoke checks Data, Game, Map, Hover, Selected Tile, and Action panels. | Passed. |
| Desktop layout | 1280x720 screenshot `artifacts/story-03-basic-panels-desktop.png` inspected. | Passed. No overlap or hidden required state. |
| Mobile layout | 390x844 screenshot `artifacts/story-03-basic-panels-mobile.png` inspected. | Passed. Panels stack and controls fit. |
| Pointer hover | Browser smoke moves pointer over canvas and verifies hover state. | Passed. |
| Pointer selection | Browser smoke clicks canvas and verifies selected tile and action state. | Passed. |
| Touch-style pointer | Browser smoke dispatches touch-style pointer movement. | Passed. |
| Unsupported import recovery | Browser smoke selects `README.txt` and verifies recoverable file-error state with `Start game` still enabled. | Passed. |
| Imported data readiness | Browser smoke imports generated `SPAU.PA`, reloads, and clears data. | Passed. |
| Start-game path | Browser smoke starts an imported-data settlement and verifies running state. | Passed. |
| Visible implementation leakage | Browser smoke asserts visible shell text does not expose `@serfbound/engine`, `WebGL`, or `debug.inspect-map-tile`. | Passed. |

## Pointer Feedback Review

- Hover feedback shows the current tile coordinate and map coordinate.
- Selection feedback is persistent in both Hover and Selected Tile panels.
- Action feedback changes to `Inspect land` after selection, which is enough for
  Phase 7 to attach build-action affordances without changing the input model.
- The canvas sets `touch-action: none`, preventing browser panning/zooming from
  competing with map taps on touch-capable browsers.
- No layout shift was observed in the screenshot evidence after the first
  playable panel expansion.

## Blocking Issues

No blocking ergonomics issue was found for Phase 7. The remaining limitation is
coverage breadth: physical touch hardware and a separate physical trackpad
session were not available in this Codex environment. This does not stop Phase 7
because the implemented browser event paths are covered, but broader
cross-device hardening remains Phase 8 work.
