# Evidence — SB-1-03 — Capture Local SPAU.PA Resource Output

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `pm/roadmap/serfbound/reference-tools/capture-spau-catalog-metadata.py` -
  isolated local/manual metadata capture helper.
- `pm/roadmap/serfbound/phase-1-reference-oracle/story-03-local-spau-resource-output.md`
  - marks SB-1-03 done and checks acceptance criteria.
- `pm/roadmap/serfbound/phase-1-reference-oracle/current-phase-status.md` -
  marks the story table row done, updates Phase 1 exit criteria, and records
  the remaining third-output gap.
- `pm/roadmap/serfbound/README.md` - records the ignored local reference-output
  convention.
- `pm/roadmap/serfbound/adoption/phase-gate-verification-matrix.md` - records
  that Phase 1 has local/manual `SPAU.PA` metadata, but is still incomplete.

## Local output

- Target: `dos.spau-catalog-metadata`.
- Output path:
  `serfbound-local-data/reference-output/spau-catalog-metadata.json`.
- Git policy: ignored by `.gitignore`; not committed.
- Output SHA-256:
  `92e2cd3a5dfa5fca0b4d99192b8f5d0eb913f572b9da544a4cb5e2fac3462d64`.
- Output size: 21,694 bytes.
- Data requirement: local/manual `SPAU.PA`.

## Captured metadata summary

- Local source path:
  `serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA`.
- Local source SHA-256:
  `4a652471c4185d324b16fadd736f2464210df5d8938136aaa0ccc4a43c790ca2`.
- Inventory checksum match: `true`.
- File size: 1,282,805 bytes.
- Archive header:
  - declared size: 1,282,805.
  - entry count: 4,000.
  - table start: 8.
  - table end: 32,008.
- Entry summary:
  - defined entries after reference-loader fixups: 2,749.
  - invalid bounds: 0.
  - overlap count: 255, expected from loader fixups that alias archive entries.
- Metadata checksums:
  - entries:
    `004f8c2872e8710aff02364949b8ec8e65382a60c86e24df6def5a5377d2d3d9`.
  - resources:
    `94147aca6d0d030a3daf116a3f8ce0c6c454b3ba2d74989cffce8707c12f5aab`.
- Selected resource availability:
  - `art_landscape`: 1 of 1.
  - `animation`: 158 of 200.
  - `sound`: 39 of 90.
  - `music`: 4 of 7.
  - `cursor`: 1 of 1.

## Reference sources

- `Freeserf.Core/Data/DataSourceDos.cs`
  - last commit: `ea3a813628ac4451770463aa9db7b103d4374b7b`.
  - methods inspected: `Check()`, `Load()`, `GetSpriteParts()`,
    `GetSound()`, `GetMusic()`, `GetObject()`, `FixUp()`.
- `Freeserf.Core/Data/Data.cs`
  - last commit: `f6ec13c1fca9e867d9b3f19b030975dd8ae3f77c`.
  - methods inspected: `GetResourceName()`, `GetResourceCount()`,
    `GetResourceType()`, `dataResources`.
- `pm/roadmap/serfbound/adoption/local-asset-inventory.md`
  - last commit: `be2a041f22afe9a4ebe8e685ef230e6aee02baa4`.

## Verification artifacts

- Source/data inspection:
  - `sed -n '1,220p' pm/roadmap/serfbound/phase-1-reference-oracle/story-03-local-spau-resource-output.md`
  - `sed -n '1,220p' pm/roadmap/serfbound/adoption/local-asset-inventory.md`
  - `sed -n '280,760p' Freeserf.Core/Data/DataSourceDos.cs`
  - `sed -n '1,130p' Freeserf.Core/Data/Data.cs`
  - `xxd -l 64 serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA`
- Local source verification:
  - `ls -l serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA`
  - `shasum -a 256 serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA`
  - Result:
    `4a652471c4185d324b16fadd736f2464210df5d8938136aaa0ccc4a43c790ca2`.
  - `git check-ignore -v serfbound-local-data/sources/TheSettlersDemo/Serf-City-Life-is-Feudal_DOS_EN/SPAU.PA || true`
  - Result: `.gitignore:281:serfbound-local-data/`.
- Capture command:
  - `python3 pm/roadmap/serfbound/reference-tools/capture-spau-catalog-metadata.py`
  - Result: `present: serfbound-local-data/reference-output/spau-catalog-metadata.json`.
- JSON validity:
  - `python3 -m json.tool serfbound-local-data/reference-output/spau-catalog-metadata.json >/tmp/serfbound-spau-metadata-jsoncheck.json`
  - Result: passed with no output.
- Determinism command:
  - `first=$(shasum -a 256 serfbound-local-data/reference-output/spau-catalog-metadata.json | awk '{print $1}'); python3 pm/roadmap/serfbound/reference-tools/capture-spau-catalog-metadata.py >/tmp/serfbound-spau-capture-verify.out; second=$(shasum -a 256 serfbound-local-data/reference-output/spau-catalog-metadata.json | awk '{print $1}'); printf 'first=%s\nsecond=%s\n' "$first" "$second"; test "$first" = "$second" && echo deterministic-spau-metadata`
  - Result:
    - `first=92e2cd3a5dfa5fca0b4d99192b8f5d0eb913f572b9da544a4cb5e2fac3462d64`
    - `second=92e2cd3a5dfa5fca0b4d99192b8f5d0eb913f572b9da544a4cb5e2fac3462d64`
    - `deterministic-spau-metadata`.
- Missing-data skip command:
  - `python3 pm/roadmap/serfbound/reference-tools/capture-spau-catalog-metadata.py --path serfbound-local-data/sources/missing/SPAU.PA --output /tmp/serfbound-spau-skip.json`
  - Result: `skipped: /tmp/serfbound-spau-skip.json`.
  - Parsed skip output:
    - `status skipped`.
    - expected SHA-256
      `4a652471c4185d324b16fadd736f2464210df5d8938136aaa0ccc4a43c790ca2`.
    - `contains_raw_payload False`.
- Ignored output check:
  - `git status --short --ignored serfbound-local-data/reference-output serfbound-local-data/sources | sed -n '1,120p'`
  - Result: `!! serfbound-local-data/`.
- PMO and structural checks:
  - `python3 -m py_compile pm/roadmap/serfbound/reference-tools/capture-spau-catalog-metadata.py` -> passed with no output.
  - `git diff --check` -> passed with no output.
  - `for f in pm/roadmap/serfbound/phase-*/story-[0-9]*.md; do rg -q "^## Problem$" "$f" && rg -q "^## Scope$" "$f" && rg -q "^## Acceptance criteria$" "$f" && rg -q "^## Test plan$" "$f" || echo "missing required section: $f"; done` -> passed with no output.
  - `bash -n .githooks/pre-commit .githooks/post-commit .githooks/work-log-read .githooks/work-log-summarize` -> passed with no output.
  - `git ls-files | rg -n '(^|/)(SPA.*\.PA|SOUNDS\.PA|SERF\.EXE|.*\.adf$|sounds/|music/|serfbound-local-data/)' || true` -> passed with no output.

## Acceptance criteria — re-checked

- [x] The local source path is read from ignored `serfbound-local-data/` or an
  explicit environment variable — the default path is under ignored
  `serfbound-local-data/`, and the tool also accepts `SERFBOUND_SPAU_PATH` or
  `--path`.
- [x] Output contains metadata/checksums only, not raw original asset payloads —
  output records offsets, sizes, counts, source identity, and metadata
  checksums; it writes no entry bytes.
- [x] The output records the `SPAU.PA` checksum from
  `adoption/local-asset-inventory.md` — both expected and actual SHA-256 values
  are present and match.
- [x] Missing local data produces a clear skip message, not a failed CI path —
  the skip command exits successfully and writes `status: skipped`.
- [x] Phase 4 can use the output as a resource-catalog target — the output
  includes archive header facts, entry metadata checksums, resource names,
  resource counts, DOS archive index ranges, and selected availability counts.

## Residual risk

The parser captures metadata from the local file and source comments rather than
executing the unavailable .NET loader. It also records that the archive uses an
8-byte header: the first uint32 matches file size and the second is the 4,000
entry count. Phase 4 should preserve that behavior in browser-native parser
tests and should treat raw asset decoding as separate work.

Phase 1 is still not complete. It has two captured outputs, but the phase exit
criteria require at least three reference outputs plus a fixture contract.
