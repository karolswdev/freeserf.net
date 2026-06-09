# Evidence — SB-1-02 — Capture Data-Free Reference Output

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `pm/roadmap/serfbound/reference-tools/capture-rng-oracle.py` - isolated
  Phase 1 capture helper for `Freeserf.Core/Random.cs`.
- `pm/roadmap/serfbound/reference-fixtures/ci/rng-fixed-seed-sequence.json` -
  committed CI-safe RNG fixture.
- `pm/roadmap/serfbound/phase-1-reference-oracle/story-02-data-free-reference-output.md`
  - marks SB-1-02 done and checks acceptance criteria.
- `pm/roadmap/serfbound/phase-1-reference-oracle/current-phase-status.md` -
  marks the story table row done and records the next Phase 1 move.
- `pm/roadmap/serfbound/README.md` - adds reference tooling and CI fixture
  directories to source canon.
- `pm/roadmap/serfbound/adoption/phase-gate-verification-matrix.md` - records
  that Phase 1 now has the first CI-safe RNG fixture.

## Captured output

- Target: `rng.fixed-seed-sequence`.
- Source file: `Freeserf.Core/Random.cs`.
- Source SHA-256:
  `e5d5bf442139173a3cb1598436d8708171354c3c6989911e432cd57f4985dbae`.
- Source last commit:
  `75c1392cab7f7964cf0dc38944e454f80f92c532`.
- Fixture:
  `pm/roadmap/serfbound/reference-fixtures/ci/rng-fixed-seed-sequence.json`.
- Fixture SHA-256:
  `14f528bae0e4987cbf499be436689ab102e6ea5082104c3b0a3524d213116f9c`.
- Fixture size: 16,730 bytes.
- Data requirement: data-free / CI-safe.

## Verification artifacts

- Source inspection:
  - `sed -n '1,260p' Freeserf.Core/Random.cs`
  - Confirmed constructors `Random(ushort)`, `Random(string)`,
    `Random(ushort base0, ushort base1, ushort base2)`, `Next()`,
    `ToString()`, and operator `^`.
- Tool availability:
  - `command -v dotnet || true` -> no `dotnet` on `PATH`.
  - `command -v mono || true; command -v mcs || true; command -v csc || true`
    -> no local C# runtime/compiler on `PATH`.
  - `command -v node || true; node --version || true` -> `node` exists but
    fails to start due missing `libllhttp.9.3.dylib`.
  - `command -v deno || true; deno --version || true` -> no `deno`.
  - `command -v bun || true; bun --version || true` -> no `bun`.
  - `command -v python3 || true; python3 --version || true` ->
    `/opt/homebrew/bin/python3`, `Python 3.14.5`.
- Capture command:
  - `python3 pm/roadmap/serfbound/reference-tools/capture-rng-oracle.py --output pm/roadmap/serfbound/reference-fixtures/ci/rng-fixed-seed-sequence.json`
  - Result:
    `pm/roadmap/serfbound/reference-fixtures/ci/rng-fixed-seed-sequence.json`.
- Determinism command:
  - `first=$(shasum -a 256 pm/roadmap/serfbound/reference-fixtures/ci/rng-fixed-seed-sequence.json | awk '{print $1}'); python3 pm/roadmap/serfbound/reference-tools/capture-rng-oracle.py --output pm/roadmap/serfbound/reference-fixtures/ci/rng-fixed-seed-sequence.json >/tmp/serfbound-rng-capture-2.out; second=$(shasum -a 256 pm/roadmap/serfbound/reference-fixtures/ci/rng-fixed-seed-sequence.json | awk '{print $1}'); printf 'first=%s\nsecond=%s\n' "$first" "$second"; test "$first" = "$second" && echo deterministic-rng-fixture`
  - Result:
    - `first=14f528bae0e4987cbf499be436689ab102e6ea5082104c3b0a3524d213116f9c`
    - `second=14f528bae0e4987cbf499be436689ab102e6ea5082104c3b0a3524d213116f9c`
    - `deterministic-rng-fixture`.
- JSON validity:
  - `python3 -m json.tool pm/roadmap/serfbound/reference-fixtures/ci/rng-fixed-seed-sequence.json >/tmp/serfbound-rng-fixture-jsoncheck.json`
  - Result: passed with no output.
- Asset safety:
  - `rg -n "SPAU|SOUNDS|SERF\\.EXE|\\.PA|\\.ADF|sprite|sound|music|palette" pm/roadmap/serfbound/reference-fixtures/ci/rng-fixed-seed-sequence.json || true`
  - Result: passed with no output.
- PMO and structural checks:
  - `git diff --check` -> passed with no output.
  - `python3 -m py_compile pm/roadmap/serfbound/reference-tools/capture-rng-oracle.py` -> passed with no output.
  - `for f in pm/roadmap/serfbound/phase-*/story-[0-9]*.md; do rg -q "^## Problem$" "$f" && rg -q "^## Scope$" "$f" && rg -q "^## Acceptance criteria$" "$f" && rg -q "^## Test plan$" "$f" || echo "missing required section: $f"; done` -> passed with no output.
  - `bash -n .githooks/pre-commit .githooks/post-commit .githooks/work-log-read .githooks/work-log-summarize` -> passed with no output.
  - `git ls-files | rg -n '(^|/)(SPA.*\.PA|SOUNDS\.PA|SERF\.EXE|.*\.adf$|sounds/|music/|serfbound-local-data/)' || true` -> passed with no output.

## Acceptance criteria — re-checked

- [x] A command captures the chosen data-free oracle output — the Python command
  above emits the RNG JSON fixture.
- [x] The command and output location are documented in Phase 1 evidence notes —
  documented in this file.
- [x] The fixture is deterministic across two consecutive runs — both runs
  produced SHA-256
  `14f528bae0e4987cbf499be436689ab102e6ea5082104c3b0a3524d213116f9c`.
- [x] The fixture contains no original game asset payload — fixture contains
  only RNG integer state, source metadata, and generation metadata.
- [x] The capture helper is isolated from final browser product code — helper is
  under `pm/roadmap/serfbound/reference-tools/`, is documented as temporary
  reference tooling, and is not imported by product runtime code.

## Residual risk

The local C#/.NET toolchain is unavailable, so this fixture is source-derived
from `Freeserf.Core/Random.cs` rather than generated by executing compiled C#.
That is acceptable for this first isolated RNG oracle because the exact source
file and method logic are small and recorded, but a later environment with C#
available should cross-check the fixture before Phase 3 claims simulation parity.

The local Node toolchain is also broken. Phase 2 must repair or replace the
browser-native toolchain before product code starts. Phase 1 is still not
complete: it needs at least two more reference outputs, including local/manual
`SPAU.PA` metadata, plus the fixture contract.
