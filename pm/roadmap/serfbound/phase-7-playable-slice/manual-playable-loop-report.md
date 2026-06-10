# Phase 7 Manual Playable Loop Report

**Story:** SB-7-04 — Verify Playable Loop Manually
**Executed:** 2026-06-09
**Result:** pass

## Environment

- OS: macOS 26.2, build 25C56
- Kernel: Darwin 25.2.0, arm64
- Node: v22.21.0 via `.nvmrc`
- npm: 11.6.2
- Browser: Playwright Chromium 148.0.7778.96
- User agent: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/148.0.7778.96 Safari/537.36`
- Platform: `MacIntel`
- Viewport: 1280x900
- Max touch points: 0
- App URL: `http://127.0.0.1:4183/`

## Local Data

- Local path:
  `serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA`
- Size: 1.2 MB
- SHA-256:
  `4a652471c4185d324b16fadd736f2464210df5d8938136aaa0ccc4a43c790ca2`
- Loader result: 4000 catalog entries, 2749 defined resources
- Asset handling: local user-provided data only; no original data bytes are
  committed or bundled.

## Captured Evidence

- Started local game:
  `artifacts/story-04-manual-started-desktop.png`
- Built flag and saved game:
  `artifacts/story-04-manual-flag-saved-desktop.png`
- Reloaded and loaded saved game:
  `artifacts/story-04-manual-loaded-save-desktop.png`

## Observed Final Browser State

```text
Data: Data imported
Game: Running
Source: Imported data
Map: Imported terrain
Save: Game loaded
Save detail: 1 built structures restored.
data-serfbound-runtime=browser
data-serfbound-game-state=running
data-serfbound-local-game-state=running
data-serfbound-local-save-state=loaded
data-serfbound-built-structure-count=1
data-serfbound-renderer=webgl2
data-serfbound-scene-source=dos-pa-catalog
nonblank WebGL pixels=144941
```

## Browser-Native Boundary

The manual run used Vite preview only as a static local file server for the
built browser app. The playable path ran in Chromium with IndexedDB and WebGL2.
No .NET runtime, desktop shell, native launcher, local companion process, or
bundled original data was used.

## Known Limitations

- The playable action is flag placement only; original roads, huts, ownership,
  terrain/buildability rules, workers, logistics, and economy remain deferred.
- Save data is Serfbound's browser-local v1 snapshot format, not original
  savegame compatibility.
- Manual evidence used Chromium on macOS in a headless browser context. Phase 8
  owns broader browser/device compatibility, performance budgets, persistence
  recovery hardening, and accessibility basics.
