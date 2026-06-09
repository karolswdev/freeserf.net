# Phase 1 Final Summary — Reference Oracle

**Completed:** 2026-06-09.
**Status:** complete; Phase 2 ready.

## Result

Phase 1 produced the first trustworthy reference-oracle layer for Serfbound.
The project now has selected oracle targets, three captured reference outputs,
an ignored local/manual `SPAU.PA` metadata path, and a v1 fixture contract that
keeps reference tooling isolated from browser product code.

This does not mean Serfbound is implemented. It means later browser-native
phases can start from concrete reference facts without carrying .NET, desktop
runtime, original DOS assets, or local helper processes into the product.

## Shipped Stories

| Story | Commit | Evidence | Result |
|---|---|---|---|
| SB-1-01 Select first oracle targets | `a0d2b9b` | [evidence-story-01](./evidence-story-01.md) | Selected RNG, map geometry, serializer, and local/manual DOS catalog targets with exact source files and protected future phases. |
| SB-1-02 Capture data-free reference output | `7997a07` | [evidence-story-02](./evidence-story-02.md) | Captured CI-safe `rng.fixed-seed-sequence` JSON fixture. |
| SB-1-03 Capture local SPAU.PA resource output | `d34ebc2` | [evidence-story-03](./evidence-story-03.md) | Captured ignored local/manual `SPAU.PA` metadata output and proved clean skip behavior. |
| SB-1-04 Define oracle fixture contract | `a2feb3d` | [evidence-story-04](./evidence-story-04.md) | Defined v1 fixture schema, directory policy, checksums, local/manual rules, and product-code boundary. |
| SB-1-05 Capture map geometry reference output | `ca9b419` | [evidence-story-05](./evidence-story-05.md) | Captured CI-safe `map.geometry-facts` fixture for map dimensions, movement, wraparound, directions, and projection facts. |

## Reference Outputs

| Output | Class | Path | SHA-256 / metadata proof |
|---|---|---|---|
| RNG fixed-seed sequence | CI-safe, tracked | `pm/roadmap/serfbound/reference-fixtures/ci/rng-fixed-seed-sequence.json` | `14f528bae0e4987cbf499be436689ab102e6ea5082104c3b0a3524d213116f9c` |
| Map geometry facts | CI-safe, tracked | `pm/roadmap/serfbound/reference-fixtures/ci/map-geometry-facts.json` | `c5de3e91fe53c5bfedbb7cf3bc030261478dfa63f770499d72306bfe8edde27d` |
| DOS `SPAU.PA` catalog metadata | local/manual, ignored | `serfbound-local-data/reference-output/spau-catalog-metadata.json` | source `SPAU.PA` SHA-256 `4a652471c4185d324b16fadd736f2464210df5d8938136aaa0ccc4a43c790ca2`; entries metadata SHA-256 `004f8c2872e8710aff02364949b8ec8e65382a60c86e24df6def5a5377d2d3d9`; resources metadata SHA-256 `94147aca6d0d030a3daf116a3f8ce0c6c454b3ba2d74989cffce8707c12f5aab` |

## Exit Criteria Audit

| Exit criterion | Evidence | Status |
|---|---|---|
| At least three reference outputs are captured from real source files and documented with commands | SB-1-02, SB-1-03, SB-1-05 evidence and fixture/output checks | passed |
| At least one output is data-free and can run in CI | RNG and map geometry fixtures under `reference-fixtures/ci/` | passed |
| At least one output uses the ignored local `SPAU.PA` source and is marked local/manual | SB-1-03 evidence and ignored `serfbound-local-data/reference-output/` output | passed |
| Reference outputs have stable, reviewable formats such as JSON/text/binary snapshots with checksums | SHA-256 checks for RNG/map fixtures and local metadata output; JSON conformance checks | passed |
| Any C# capture helper is explicitly isolated from product code and has a deletion or quarantine rule | No C# helper exists; Python helpers are quarantined under `reference-tools/`; contract forbids product imports/execution | passed |
| Every Phase 1 story marked done has paired evidence | `story-01` through `story-05` and `evidence-story-01` through `evidence-story-05` | passed |
| No original assets are tracked or bundled by Phase 1 | tracked-asset scan passed; `serfbound-local-data/` remains ignored | passed |

## Decisions

- CI-safe oracle fixtures live under
  `pm/roadmap/serfbound/reference-fixtures/ci/`.
- Local/manual outputs live under ignored `serfbound-local-data/reference-output/`.
- Reference helpers live under `pm/roadmap/serfbound/reference-tools/` and are
  not product code.
- Phase 2 and later product/tests may read fixture data, but must not import or
  execute reference helpers during normal browser CI.
- Local `SPAU.PA` is metadata-only in committed evidence. Raw `.PA` bytes and
  extracted assets remain forbidden in Git.
- Source-derived Python fixtures are acceptable for Phase 1 because no C#/.NET
  toolchain is available locally, but C# cross-checks remain prudent before
  Phase 3 claims full simulation parity.

## Verification Commands

These commands were used during the completion audit:

```bash
git status --short --branch
for n in 01 02 03 04 05; do test -f pm/roadmap/serfbound/phase-1-reference-oracle/evidence-story-$n.md || echo missing evidence $n; done
for n in 01 02 03 04 05; do rg -q "\*\*Status:\*\* done" pm/roadmap/serfbound/phase-1-reference-oracle/story-$n-*.md || echo story $n not done; done
python3 - <<'PY'
import json
from pathlib import Path
required={'schemaVersion','targetId','dataRequirement','source','generation'}
for path in sorted(Path('pm/roadmap/serfbound/reference-fixtures/ci').glob('*.json')):
    data=json.loads(path.read_text())
    missing=sorted(required-set(data))
    assert not missing, (path, missing)
    assert data['schemaVersion']==1, path
    assert data['dataRequirement']=='data-free / CI-safe', path
    assert data['targetId'] in {'rng.fixed-seed-sequence','map.geometry-facts'}, path
    assert 'command' in data['generation'] and 'tool' in data['generation'], path
    print(f'ci-fixture-ok {path} {data["targetId"]}')
PY
shasum -a 256 pm/roadmap/serfbound/reference-fixtures/ci/rng-fixed-seed-sequence.json pm/roadmap/serfbound/reference-fixtures/ci/map-geometry-facts.json
python3 - <<'PY'
import json
from pathlib import Path
path=Path('serfbound-local-data/reference-output/spau-catalog-metadata.json')
if not path.exists():
    print('local-output-missing-ok-for-ci')
else:
    data=json.loads(path.read_text())
    assert data['schemaVersion']==1
    assert data['targetId']=='dos.spau-catalog-metadata'
    assert data['dataRequirement']=='local/manual SPAU.PA'
    assert data['status'] in {'present','skipped'}
    assert data['safety']['containsRawPayload'] is False
    print(f'local-output-ok {path} {data["status"]}')
PY
git status --short --ignored serfbound-local-data/reference-output serfbound-local-data/sources
git ls-files | rg -n '(^|/)(SPA.*\.PA|SOUNDS\.PA|SERF\.EXE|.*\.adf$|sounds/|music/|serfbound-local-data/)' || true
git diff --check
```

## Known Limitations

- The browser workspace still does not exist.
- Local Node/npm are broken in this environment because Homebrew `node` cannot
  load `libllhttp.9.3.dylib`; Phase 2 must repair or replace web tooling before
  product build/test evidence can exist.
- `dotnet`, `mono`, `mcs`, and `csc` are not on `PATH`; Phase 1 fixtures were
  source-derived rather than generated by executing compiled C#.
- Serializer fixtures remain selected but uncaptured. They are not required for
  Phase 1 exit because Phase 1 already has three reference outputs, but they may
  be valuable before browser save/load work in Phase 7.
- No browser implementation, asset parser, renderer, UI shell, playable slice,
  hardening, or release artifact exists yet.

## Deferred Work

- Phase 2 starts with SB-2-01, scaffolding the pure-browser workspace.
- Phase 2 must consume at least one CI-safe oracle fixture through browser-native
  test tooling.
- Phase 2 must enforce the fixture contract in tests, including `schemaVersion`,
  `targetId`, and `dataRequirement` assertions.
- Phase 2 must keep CI useful without `serfbound-local-data/`.
- Phase 3 should use RNG and map geometry fixtures as its first simulation
  parity gates.
- Phase 4 should use the local/manual `SPAU.PA` metadata output as its first
  resource-catalog parser target.
