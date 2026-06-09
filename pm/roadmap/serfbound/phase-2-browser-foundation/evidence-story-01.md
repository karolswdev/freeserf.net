# Evidence — SB-2-01 — Scaffold Pure-Browser Workspace

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `serfbound/` - new pure-browser TypeScript npm workspace.
- `serfbound/package.json` and `serfbound/package-lock.json` - workspace
  scripts, package manager, Node/npm engine range, and locked TypeScript
  dependency.
- `serfbound/.nvmrc` - working local Node version, `22.21.0`.
- `serfbound/packages/app/` - browser app integration package.
- `serfbound/packages/engine/` - deterministic engine package boundary.
- `serfbound/packages/assets/` - browser asset import boundary package.
- `serfbound/packages/test-support/` - oracle fixture validation helper package.
- `serfbound/scripts/check-boundaries.mjs` - dependency and forbidden-asset
  boundary check.
- `.gitignore` - ignores generated `serfbound/packages/*/dist/` output.
- `pm/roadmap/serfbound/phase-2-browser-foundation/story-01-scaffold-browser-workspace.md`
  - marks SB-2-01 done and checks acceptance criteria.
- `pm/roadmap/serfbound/phase-2-browser-foundation/current-phase-status.md` -
  marks the story row done and records SB-2-02 as the next move.
- `pm/roadmap/serfbound/README.md` and
  `pm/roadmap/serfbound/adoption/phase-gate-verification-matrix.md` - record
  Phase 2 in progress with a building workspace scaffold.

## Workspace shape

- Workspace root: `serfbound/`.
- Package manager: npm `11.6.2`.
- Working Node runtime: nvm Node `22.21.0`.
- Build command:
  `npm run build`.
- Boundary check command:
  `npm run check:boundaries`.
- Packages:
  - `@serfbound/app`
  - `@serfbound/engine`
  - `@serfbound/assets`
  - `@serfbound/test-support`

## Verification artifacts

- Toolchain inspection:
  - `command -v node || true; node --version || true; command -v npm || true; npm --version || true; command -v corepack || true; corepack --version || true`
  - Result: Homebrew `node` and `npm` exist but fail to start due missing
    `libllhttp.9.3.dylib`.
  - `/Users/karol/.nvm/versions/node/v22.21.0/bin/node --version` ->
    `v22.21.0`.
  - `zsh -lc 'source ~/.nvm/nvm.sh >/dev/null 2>&1 && nvm current && node --version && npm --version'`
  - Result:
    - `v22.21.0`
    - `v22.21.0`
    - `11.6.2`.
- Install command:
  - `zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && npm install'`
  - Result:
    - `Now using node v22.21.0 (npm v11.6.2)`.
    - `added 5 packages, and audited 10 packages`.
    - `found 0 vulnerabilities`.
- Build and boundary command:
  - `zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && npm run build && npm run check:boundaries'`
  - Result:
    - `tsc -b packages/engine packages/assets packages/test-support packages/app`
    - `serfbound-boundaries-ok`.
- Dependency tree:
  - `zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use >/tmp/serfbound-nvm-use.out && npm ls --all'`
  - Result:
    - `@serfbound/app@0.0.0 -> ./packages/app`
    - `@serfbound/assets@0.0.0 -> ./packages/assets`
    - `@serfbound/engine@0.0.0 -> ./packages/engine`
    - `@serfbound/test-support@0.0.0 -> ./packages/test-support`
    - `typescript@5.9.3`.
- Dependency manifest inspection:
  - `python3 - <<'PY' ...` over `serfbound/package.json` and package manifests.
  - Result: root has only `typescript` as a dev dependency; app depends only on
    internal `@serfbound/*` workspace packages; engine/assets/test-support have
    no dependencies.
- Generated output policy:
  - `git status --short --ignored serfbound | sed -n '1,120p'`
  - Result: `serfbound/node_modules/` and generated package output are ignored.
- PMO and structural checks:
  - `git diff --check` -> passed with no output.
  - `for f in pm/roadmap/serfbound/phase-*/story-[0-9]*.md; do rg -q "^## Problem$" "$f" && rg -q "^## Scope$" "$f" && rg -q "^## Acceptance criteria$" "$f" && rg -q "^## Test plan$" "$f" || echo "missing required section: $f"; done` -> passed with no output.
  - `bash -n .githooks/pre-commit .githooks/post-commit .githooks/work-log-read .githooks/work-log-summarize` -> passed with no output.
  - `git ls-files | rg -n '(^|/)(SPA.*\.PA|SOUNDS\.PA|SERF\.EXE|.*\.adf$|sounds/|music/|serfbound-local-data/)' || true` -> passed with no output.

## Acceptance criteria — re-checked

- [x] A browser workspace exists under the chosen repo path — `serfbound/`.
- [x] `package.json` scripts or equivalent commands build the workspace —
  `npm run build` passes with TypeScript project references.
- [x] Product dependencies contain no .NET, desktop wrapper, or native launcher
  runtime — `npm ls --all`, manifest inspection, and `check:boundaries` show
  only internal packages plus TypeScript dev dependency.
- [x] Workspace docs point back to the Serfbound PMO roadmap —
  `serfbound/README.md` points to `pm/roadmap/serfbound/`.
- [x] The scaffold has explicit package boundaries for app, engine, assets, and
  tests — packages exist and `serfbound/README.md` documents each boundary.

## Residual risk

Homebrew Node/npm remain broken because `/opt/homebrew/Cellar/node/25.9.0/bin/node`
references missing `libllhttp.9.3.dylib`. SB-2-01 proves the workspace with nvm
Node `22.21.0`; Phase 2 should either standardize on nvm for local development
or repair Homebrew Node before final Phase 2 audit.

SB-2-01 does not add a test spine or static browser shell. SB-2-02 owns
CI-safe tests and fixture consumption; SB-2-04 owns browser shell proof.
