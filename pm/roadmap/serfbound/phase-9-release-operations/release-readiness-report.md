# Serfbound Release Readiness Report

**Date:** 2026-06-09.
**Story:** SB-9-04 - Run Release Readiness Review.
**Decision:** go for the first Serfbound browser-slice release candidate.

This decision applies to the current browser-native first playable slice:
import local data, start a local game, select land, build one flag, save,
reload, load, reset, and ship as a static browser artifact. It is not a claim
that the full original game has been reimplemented.

## Checklist

| Gate | Evidence | Result |
|---|---|---|
| Release CI passes without local original assets | `npm run ci:release`; GitHub Actions run `27248495556` at commit `05ff837` before this report | passed |
| Static artifact can be built and hosted under a path | `npm run test:release:static`; SB-9-02 evidence | passed |
| Product artifact contains no .NET, desktop, native runtime, or original asset files | `npm run check:release-artifact`; inspected `serfbound/dist/` with 3 static files | passed |
| Serfbound tracked scope contains no committed original asset or native runtime files | `git ls-files serfbound pm/roadmap/serfbound .github/workflows/serfbound-ci.yml \| rg ...` produced no output | passed |
| Browser compatibility matrix passes | `npm run test:compatibility`; 5 Playwright projects passed | passed |
| Performance snapshot is within budgets | `npm run measure:performance`; generated `.tmp/release-readiness-performance.json` | passed |
| Local/manual `SPAU.PA` verification works when explicitly enabled | `SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 ... npm run test:local:assets` | passed |
| Player docs explain local data, save/load/reset, troubleshooting | `serfbound/docs/player-guide.md`; `npm run test:docs` | passed |
| Developer docs explain CI-safe fixtures, local/manual checks, PMO flow, release commands | `serfbound/docs/developer-guide.md`; `npm run test:docs` | passed |
| Issue intake warns against uploading original data | `.github/ISSUE_TEMPLATE/serfbound-bug.yml` | passed |

## Phase Gate Audit

| Phase | Gate | Evidence | Result |
|---|---|---|---|
| 0 | Rewrite discovery is credible | [Phase 0 final summary](../phase-0-setup/final-summary.md) | passed |
| 1 | Reference oracle is trustworthy | [Phase 1 final summary](../phase-1-reference-oracle/final-summary.md) | passed |
| 2 | Browser foundation is real | [Phase 2 final summary](../phase-2-browser-foundation/final-summary.md) | passed |
| 3 | Simulation parity starts | [Phase 3 final summary](../phase-3-core-simulation/final-summary.md) | passed |
| 4 | Local data import works | [Phase 4 final summary](../phase-4-data-assets/final-summary.md) | passed |
| 5 | Map rendering is proven | [Phase 5 final summary](../phase-5-renderer-projection/final-summary.md) | passed |
| 6 | Player intent reaches engine | [Phase 6 final summary](../phase-6-ui-input-shell/final-summary.md) | passed |
| 7 | First playable loop works | [Phase 7 final summary](../phase-7-playable-slice/final-summary.md) | passed |
| 8 | Browser constraints are handled | [Phase 8 final summary](../phase-8-browser-hardening/final-summary.md) | passed |
| 9 | Release is operational | This report, SB-9-01 through SB-9-04 evidence, and [Phase 9 final summary](./final-summary.md) | passed |

## Browser Matrix

Source: `pm/roadmap/serfbound/phase-8-browser-hardening/artifacts/story-04-browser-compatibility-report.json`
and fresh `npm run test:compatibility` in the SB-9-04 audit.

| Project | Browser | Result | Covered behavior |
|---|---|---|---|
| desktop-chromium | Chromium | passed | rendering, import, IndexedDB, pointer/touch path, keyboard focus, contrast |
| desktop-firefox | Firefox | passed | rendering, import, IndexedDB, pointer/touch path, keyboard focus, contrast |
| desktop-webkit | WebKit/Safari profile | passed | rendering, import, IndexedDB, pointer/touch path, keyboard focus, contrast |
| mobile-chrome | Chromium Pixel profile | passed | rendering, import, IndexedDB, pointer/touch path, keyboard focus, contrast |
| mobile-safari | WebKit iPhone profile | passed | rendering, import, IndexedDB, pointer/touch path, keyboard focus, contrast |

## Performance Snapshot

Source: `.tmp/release-readiness-performance.json` from the SB-9-04 audit.

| Measurement | Budget | Result |
|---|---:|---:|
| Simulation tick average | 0.05 ms | 0.000067 ms |
| Browser frame p95 | 20 ms | 9.600 ms |
| Generated data import | 1000 ms | 186.047 ms |
| Save | 100 ms | 86.117 ms |
| Reload and load | 1000 ms | 218.397 ms |
| WebGL nonblank pixels | > 0 | 144941 |

The committed Phase 8 performance artifact remains the local `SPAU.PA`
performance baseline; this SB-9-04 snapshot proves the release gate also passes
with CI-safe generated data.

## Asset Boundary

Release artifact:

```text
serfbound/dist/index.html
serfbound/dist/assets/index-DqBBmPy4.js
serfbound/dist/assets/index-U5AdamHH.css
```

`npm run check:release-artifact` inspected the artifact and passed:

```text
serfbound-release-artifact-ok: inspected 3 static files in dist/.
```

Tracked Serfbound scope was checked for original data and native/desktop
runtime file patterns:

```bash
git ls-files serfbound pm/roadmap/serfbound .github/workflows/serfbound-ci.yml |
  rg '(^|/)(serfbound-local-data|SPA[A-Z]?\.PA|SOUNDS\.PA|SERF\.EXE|.*\.adf|.*\.exe|.*\.dll|.*\.dylib|.*\.so|.*\.dmg|.*\.app)(/|$)'
```

Output:

```text
<no output>
```

The upstream `FreeserfNet/` desktop tree still contains native audio libraries.
That source tree is not part of the Serfbound browser release artifact and is
not used by `npm run ci:release`.

## Known Limitations

- This is the first browser playable slice, not full original gameplay.
- Economy, roads, buildings beyond first flag placement, serf logistics, AI,
  multiplayer, full audio/music playback, original savegame compatibility, and
  complete asset decoding remain out of this release candidate.
- Mobile evidence is Playwright browser/device-profile coverage, not physical
  iOS/Android device certification.
- The current renderer baseline is WebGL2. WebGPU and worker offload are
  deferred until measured stop signals justify them.
- Original DOS/Amiga data remains user-provided. Serfbound does not bundle,
  host, sell, download, or redistribute it.
- Browser storage is local to the origin. Moving hosts, ports, or scheme can
  require reimporting `SPAU.PA`.

These are release notes, not blockers for the current scoped release candidate.
They become blockers only if the release claim expands beyond the first browser
playable slice.

## Go/No-Go

Go for a first Serfbound browser-slice release candidate.

Stop if any of these regress before tagging or publishing:

- GitHub Actions `Serfbound CI` fails at the release branch tip.
- `npm run ci:release` fails locally or remotely.
- `npm run test:compatibility` fails in any required browser profile.
- `npm run check:release-artifact` finds forbidden product artifacts.
- Any original data file or extracted original asset becomes tracked or bundled.
- Player/developer docs diverge from shipped import, save/load/reset, or release
  behavior.
