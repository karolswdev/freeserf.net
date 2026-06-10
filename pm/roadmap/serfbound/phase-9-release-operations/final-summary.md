# Phase 9 Final Summary - Release Operations

**Completed:** 2026-06-09.
**Status:** complete; first Serfbound browser-slice release candidate ready.

## Result

Phase 9 turned the Serfbound browser workspace into an operable release
candidate. It added branch CI, static release packaging, player/developer docs,
issue intake, and a release readiness report backed by local and remote command
evidence.

The release candidate is scoped to the first browser playable slice. It does
not claim full original gameplay parity.

## Shipped Stories

| Story | Commit | Evidence | Result |
|---|---|---|---|
| SB-9-01 Add release CI checks | `4d5f8c3`, `da2b39c`, `26718aa` | [evidence-story-01](./evidence-story-01.md) | Added browser-native GitHub Actions release CI and a local `npm run ci:release` gate. |
| SB-9-02 Define static hosting release path | `12b14dc` | [evidence-story-02](./evidence-story-02.md) | Defined `serfbound/dist/` static hosting, relative asset URLs, cache policy, and subpath-hosting verification. |
| SB-9-03 Write player and developer docs | `05ff837` | [evidence-story-03](./evidence-story-03.md) | Added operational player/developer docs and docs coverage checks in release CI. |
| SB-9-04 Run release readiness review | `4ced835` | [evidence-story-04](./evidence-story-04.md) | Audited phase gates, release artifact, CI, compatibility, performance, local assets, docs, issue intake, and known limitations. |

## Exit Criteria Audit

| Exit criterion | Evidence | Status |
|---|---|---|
| CI runs build/type checks, unit tests, browser tests, and data-free parity tests | SB-9-01 evidence, `npm run ci:release`, and GitHub Actions `27248495556` | passed |
| Release packaging is browser/static-web oriented and contains no .NET or desktop runtime artifacts | SB-9-02 evidence, `npm run test:release:static`, `npm run check:release-artifact` | passed |
| Player docs explain import, save, reset, troubleshooting, and local asset requirements | `serfbound/docs/player-guide.md` and SB-9-03 evidence | passed |
| Developer docs explain oracle fixtures, local asset checks, and PMO flow | `serfbound/docs/developer-guide.md` and SB-9-03 evidence | passed |
| Release checklist records browser matrix, performance snapshot, and known limitations | [release-readiness-report](./release-readiness-report.md) and SB-9-04 evidence | passed |

## Verification Commands

```bash
cd serfbound
source ~/.nvm/nvm.sh
nvm use
env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm run ci:release
npm run test:compatibility
SERFBOUND_PERF_OUTPUT="../.tmp/release-readiness-performance.json" npm run measure:performance
SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 SERFBOUND_SPAU_PA="../serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA" npm run test:local:assets
cd ..
git diff --check
```

Representative output:

```text
46 CI-safe unit/parity tests passed.
5 Chromium browser smoke/recovery tests passed.
5 compatibility tests passed across desktop-chromium, desktop-firefox, desktop-webkit, mobile-chrome, and mobile-safari.
serfbound-boundaries-ok
serfbound-release-artifact-ok: inspected 3 static files in dist/.
serfbound-static-hosting-ok: served dist at /serfbound/, imported generated SPAU.PA, and restored IndexedDB state after reload.
serfbound-docs-ok: player, developer, and static hosting docs cover required release topics.
serfbound-performance-summary: tickAvg=0.000067ms frameP95=9.600ms import=186.047ms save=86.117ms reloadLoad=218.397ms
serfbound-local-asset-tests-ok: parsed SPAU.PA catalog and matched Phase 1 oracle metadata plus typed catalog and render-layer scene facts.
git diff --check passed with no output.
```

## Decisions

- Release as a static browser artifact under `serfbound/dist/`.
- Keep original data user-provided only through browser file import.
- Treat the current release candidate as a first browser playable slice.
- Keep Web Workers, WebGPU, full asset decoding, full original gameplay,
  multiplayer, cloud saves, and original savegame compatibility deferred until
  future evidence makes them release blockers.

## Known Limitations

- First browser playable slice only; not full original gameplay.
- No full economy, roads, building set, serf logistics, AI, multiplayer, full
  audio/music playback, original savegame compatibility, or full asset decoder.
- Mobile compatibility evidence is Playwright device-profile coverage, not
  physical iOS/Android hardware certification.
- WebGL2 is required for the current renderer path.
- Imported data and saves are browser-origin local. Players may need to
  reimport after origin changes or browser site-data deletion.

## Handoff

All PMO phases 0 through 9 now have final summaries, paired story evidence, and
release-readiness evidence for the current scoped Serfbound browser slice.
