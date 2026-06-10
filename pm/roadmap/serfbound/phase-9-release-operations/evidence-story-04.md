# Evidence - SB-9-04 - Run Release Readiness Review

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `pm/roadmap/serfbound/phase-9-release-operations/release-readiness-report.md`
  - records checklist, phase gate audit, browser matrix, performance snapshot,
  asset-boundary audit, known limitations, and go/no-go decision.
- `pm/roadmap/serfbound/phase-9-release-operations/final-summary.md` - closes
  Phase 9.
- `.github/ISSUE_TEMPLATE/serfbound-bug.yml` - adds browser bug intake with an
  explicit no-original-assets-upload warning.
- PMO status/story files and `pm/roadmap/serfbound/README.md` - mark SB-9-04
  and Phase 9 complete.
- Older phase final summaries - replace stale `pending` commit placeholders
  with actual story commit ids found during the release audit.

## Baseline command

Command:

```bash
cd serfbound
source ~/.nvm/nvm.sh
nvm use
env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm run ci:release
npm run test:compatibility
SERFBOUND_PERF_OUTPUT="../.tmp/release-readiness-performance.json" npm run measure:performance
SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 SERFBOUND_SPAU_PA="../serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA" npm run test:local:assets
cd ..
git ls-files serfbound pm/roadmap/serfbound .github/workflows/serfbound-ci.yml | rg '(^|/)(serfbound-local-data|SPA[A-Z]?\.PA|SOUNDS\.PA|SERF\.EXE|.*\.adf|.*\.exe|.*\.dll|.*\.dylib|.*\.so|.*\.dmg|.*\.app)(/|$)' || true
git diff --check
```

Output summary:

```text
Node v22.21.0 / npm v11.6.2 selected from serfbound/.nvmrc.
46 CI-safe unit/parity tests passed.
5 Chromium browser smoke/recovery tests passed.
serfbound-boundaries-ok
serfbound-release-artifact-ok: inspected 3 static files in dist/.
serfbound-static-hosting-ok: served dist at /serfbound/, imported generated SPAU.PA, and restored IndexedDB state after reload.
serfbound-docs-ok: player, developer, and static hosting docs cover required release topics.
serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
5 compatibility tests passed across desktop-chromium, desktop-firefox, desktop-webkit, mobile-chrome, and mobile-safari.
serfbound-performance-summary: tickAvg=0.000067ms frameP95=9.600ms import=186.047ms save=86.117ms reloadLoad=218.397ms
serfbound-local-asset-tests-ok: parsed SPAU.PA catalog and matched Phase 1 oracle metadata plus typed catalog and render-layer scene facts.
Tracked Serfbound forbidden-asset/native-artifact scan produced no output.
git diff --check produced no output.
```

## GitHub Actions baseline

Most recent remote release CI before this SB-9-04 commit:

```text
Run: 27248495556
Commit: 05ff8378d3c3a9a7e11e46614f67e43d35f272e0
Conclusion: success
URL: https://github.com/karolswdev/freeserf.net/actions/runs/27248495556
```

The SB-9-04 commit must be pushed and checked again before the release branch
tip is considered ready.

## Result

Release readiness passed for the first Serfbound browser-slice release
candidate, with the limitations recorded in `release-readiness-report.md`.
