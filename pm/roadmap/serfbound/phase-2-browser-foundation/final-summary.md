# Phase 2 Final Summary — Browser Foundation

**Completed:** 2026-06-09.
**Status:** complete; Phase 3 ready.

## Result

Phase 2 produced the first real browser-native Serfbound foundation. The repo
now has a TypeScript/npm workspace, package boundaries, CI-safe fixture tests,
runtime module boundary documentation, a static browser shell, and a Playwright
browser smoke test with screenshot evidence.

This does not mean Serfbound is playable yet. It means the browser product path
is now concrete enough for Phase 3 simulation work to begin without .NET,
desktop wrappers, native launchers, original asset bundles, or hidden local
companion processes.

## Shipped Stories

| Story | Commit | Evidence | Result |
|---|---|---|---|
| SB-2-01 Scaffold pure-browser workspace | `21596b4` | [evidence-story-01](./evidence-story-01.md) | Created the `serfbound/` npm/TypeScript workspace with app, engine, assets, and test-support packages. |
| SB-2-02 Add CI-safe test spine | `d39b82d` | [evidence-story-02](./evidence-story-02.md) | Added default tests that consume Phase 1 RNG and map fixtures without local assets. |
| SB-2-03 Define runtime module boundaries | `18b03d7` | [evidence-story-03](./evidence-story-03.md) | Documented runtime boundaries and kept `@serfbound/test-support` out of product dependencies. |
| SB-2-04 Prove static browser app shell | `df8bf70` | [evidence-story-04](./evidence-story-04.md) | Added the static Vite shell, Playwright Chromium smoke test, and screenshot artifact. |

## Browser Workspace

| Artifact | Path | Proof |
|---|---|---|
| Workspace root | `serfbound/` | `npm test` passes with nvm Node `22.21.0`. |
| Static browser entry | `serfbound/index.html` | `vite build` emits `serfbound/dist/index.html`. |
| Browser smoke test | `serfbound/tests/browser/static-shell.spec.ts` | Playwright opens `vite preview`, checks visible shell state, and asserts nonblank canvas pixels. |
| Screenshot proof | `artifacts/story-04-app-shell-desktop.png` | PNG, 1280 x 720, generated non-original terrain preview and missing-data state. |
| Runtime boundaries | `../adoption/runtime-module-boundaries.md` | Engine, assets, renderer, UI/input, audio, persistence, worker, oracle/test, and app shell boundaries documented. |

## Exit Criteria Audit

| Exit criterion | Evidence | Status |
|---|---|---|
| `npm`/web-tooling commands build and test the browser workspace | `npm test` runs TypeScript build, Node fixture tests, Vite static build, and Playwright browser smoke test | passed |
| CI can run without local assets | Validation unset `SERFBOUND_RUN_LOCAL_ASSET_TESTS`, `SERFBOUND_LOCAL_DATA`, and `SERFBOUND_SPAU_PA`; local asset command skips cleanly | passed |
| The app shell opens in a browser and proves the deployment model is static or otherwise pure browser | `vite build`, `vite preview`, Playwright Chromium smoke, and screenshot artifact | passed |
| Runtime boundaries are documented: engine, assets, rendering, UI, audio, persistence, worker boundary | `runtime-module-boundaries.md` plus SB-2-03 evidence | passed |
| No desktop wrapper or .NET runtime appears in product dependencies | `npm run check:boundaries` and manifest inspection show app depends only on `@serfbound/assets` and `@serfbound/engine` | passed |

## Verification Commands

These commands were used during the completion audit:

```bash
git status --short --branch
git log --oneline --decorate -8
for n in 01 02 03 04; do test -f pm/roadmap/serfbound/phase-2-browser-foundation/evidence-story-$n.md && echo evidence-ok-$n || echo missing-evidence-$n; rg -q "\*\*Status:\*\* done" pm/roadmap/serfbound/phase-2-browser-foundation/story-$n-*.md && echo story-done-$n || echo story-not-done-$n; done
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm test && npm run check:boundaries && npm run test:local:assets'
zsh -lc 'source ~/.nvm/nvm.sh && nvm use 22.21.0 >/tmp/serfbound-nvm-use.out && node << "JS"
const { readFileSync } = require("node:fs");
const manifests = [
  "serfbound/package.json",
  "serfbound/packages/app/package.json",
  "serfbound/packages/assets/package.json",
  "serfbound/packages/engine/package.json",
  "serfbound/packages/test-support/package.json",
];
for (const path of manifests) {
  const json = JSON.parse(readFileSync(path, "utf8"));
  const deps = Object.keys(json.dependencies ?? {});
  const devDeps = Object.keys(json.devDependencies ?? {});
  console.log(`${path}: dependencies=[${deps.join(",")}] devDependencies=[${devDeps.join(",")}]`);
}
JS'
file pm/roadmap/serfbound/phase-2-browser-foundation/artifacts/story-04-app-shell-desktop.png
find serfbound/dist -maxdepth 3 -type f | sort
rg -n 'dotnet|mono|blazor|electron|tauri|nativefier|SERF\.EXE|SOUNDS\.PA|SPA[A-Z]?\.PA|serfbound-local-data|reference-tools' serfbound/dist || true
git ls-files | rg -n '(^|/)(SPA.*\.PA|SOUNDS\.PA|SERF\.EXE|.*\.adf$|sounds/|music/|serfbound-local-data/)' || true
git diff --check
for f in pm/roadmap/serfbound/phase-*/story-[0-9]*.md; do rg -q "^## Problem$" "$f" && rg -q "^## Scope$" "$f" && rg -q "^## Acceptance criteria$" "$f" && rg -q "^## Test plan$" "$f" || echo "missing required section: $f"; done
bash -n .githooks/pre-commit .githooks/post-commit .githooks/work-log-read .githooks/work-log-summarize
```

Representative output:

```text
evidence-ok-01
story-done-01
evidence-ok-02
story-done-02
evidence-ok-03
story-done-03
evidence-ok-04
story-done-04

1..5
# tests 5
# pass 5

✓  1 [chromium] › tests/browser/static-shell.spec.ts:8:1 › static app shell renders without original data or a desktop companion
1 passed

serfbound-boundaries-ok
serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.

serfbound/package.json: dependencies=[] devDependencies=[@playwright/test,typescript,vite]
serfbound/packages/app/package.json: dependencies=[@serfbound/assets,@serfbound/engine] devDependencies=[]
serfbound/packages/assets/package.json: dependencies=[] devDependencies=[]
serfbound/packages/engine/package.json: dependencies=[] devDependencies=[]
serfbound/packages/test-support/package.json: dependencies=[] devDependencies=[]

pm/roadmap/serfbound/phase-2-browser-foundation/artifacts/story-04-app-shell-desktop.png: PNG image data, 1280 x 720, 8-bit/color RGB, non-interlaced
serfbound/dist/assets/index-8eb-UuOo.css
serfbound/dist/assets/index-DfrWoI1q.js
serfbound/dist/index.html
```

## Decisions

- Use npm workspaces under `serfbound/` for the browser implementation track.
- Use nvm Node `22.21.0` as the working toolchain until Homebrew Node is
  repaired or retired.
- Use Node's built-in test runner for CI-safe fixture tests.
- Use Vite for the static browser shell and Playwright Chromium for browser
  smoke/screenshot proof.
- Keep `@serfbound/test-support` test-only.
- Treat local/manual asset checks as explicitly named opt-in commands.

## Known Limitations

- The shell is not gameplay. It renders generated terrain only and proves
  deployment/smoke-test shape.
- No real asset import exists yet; Phase 4 owns direct local `SPAU.PA` import
  and parser work.
- No deterministic RNG/map implementation exists yet; Phase 3 owns parity
  implementation against Phase 1 fixtures.
- No renderer API decision or real render-layer scene exists yet; Phase 5 owns
  map rendering proof.
- Homebrew Node/npm remain broken in this environment because Homebrew `node`
  still references missing `libllhttp.9.3.dylib`; nvm Node is the documented
  path for Serfbound commands.
- Playwright browser binaries are installed in the user cache, not committed.

## Deferred Work

- Phase 3 starts with SB-3-01: port deterministic numeric/random rules against
  the RNG oracle fixture.
- Phase 3 must keep engine code platform-free under
  `runtime-module-boundaries.md`.
- Phase 4 must add real local file import and keep CI data-free.
- Phase 5 must replace generated shell visuals with a tested browser renderer
  scene.
- Phase 6 must route player input into semantic engine commands.
