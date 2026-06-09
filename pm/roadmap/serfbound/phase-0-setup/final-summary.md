# Phase 0 Final Summary — Rewrite Discovery And Architecture

**Completed:** 2026-06-09.
**Status:** complete; Phase 1 ready.

## Result

Phase 0 turned the browser rewrite from an intent into an evidence-backed PMO
plan. Serfbound now has a project name, source-grounded architecture inventory,
runtime decision, parity-harness design, asset/legal boundary, strict phase
gates, and ready Phase 1 oracle stories.

This does not mean Serfbound is implemented. It means the discovery and
architecture gate is complete enough to start reference-oracle capture without
pretending that .NET, desktop runtime, or bundled original assets are product
options.

## Shipped Stories

| Story | Commit | Evidence | Result |
|---|---|---|---|
| SB-0-01 Name and charter Serfbound | `be2a041` | [evidence-story-01](./evidence-story-01.md) | Named Serfbound, installed PMO roadmap, captured user direction, and created the 0-9 phase spine. |
| SB-0-02 Inventory reference architecture | `2607837` | [evidence-story-02](./evidence-story-02.md) | Mapped `freeserf.net` subsystems to browser rewrite concerns and first oracle candidates. |
| SB-0-03 Decide browser runtime strategy | `35c453a` | [evidence-story-03](./evidence-story-03.md) | Chose TypeScript-first pure-browser product code with a narrow WASM escape hatch. |
| SB-0-04 Design deterministic parity harness | `c25fb14` | [evidence-story-04](./evidence-story-04.md) | Defined RNG, map geometry/projection, serializer, and local/manual `SPAU.PA` metadata parity targets. |
| SB-0-05 Define asset and legal boundary | `8bdcf04` | [evidence-story-05](./evidence-story-05.md) | Defined browser import/storage/test-data policy and forbidden redistribution boundaries. |

## Exit Criteria Audit

| Exit criterion | Evidence | Status |
|---|---|---|
| Roadmap names Serfbound and lists all phases with explicit goals | [README](../README.md), SB-0-01 evidence | passed |
| Session intake captures user direction, constraints, and open questions | [session-intake](../adoption/session-intake.md), SB-0-01/SB-0-03/SB-0-05 evidence | passed |
| Source inventory maps core/renderer/audio/network/shell/data loading | [reference-architecture-inventory](../adoption/reference-architecture-inventory.md), SB-0-02 evidence | passed |
| Runtime architecture decision records strategy and stop signal | [runtime-architecture-decision](../adoption/runtime-architecture-decision.md), SB-0-03 evidence | passed |
| Parity-harness design identifies first deterministic outputs | [parity-harness-design](../adoption/parity-harness-design.md), SB-0-04 evidence | passed |
| Asset/legal boundary defines browser import, repo exclusions, and `SPAU.PA` verification source | [asset-and-legal-boundary](../adoption/asset-and-legal-boundary.md), SB-0-05 evidence | passed |
| Every phase records pure-browser/no-.NET/no-desktop as non-negotiable | `current-phase-status.md` files for Phases 0 through 9 | passed |
| Phase 1 has ready reference-oracle stories | Phase 1 status and story files show SB-1-01 through SB-1-04 as `ready` | passed |
| Roadmap explains the separate gates | README Delivery Gates and phase-gate verification matrix | passed |

## Decisions

- Final Serfbound product code is pure browser.
- No final .NET runtime, Blazor/WebAssembly-.NET, desktop wrapper, native
  launcher, local companion process, or browser shell around a desktop service.
- `freeserf.net` is the behavioral reference, not the desired runtime.
- TypeScript-first is the starting product stack; Rust/WASM is only a measured
  escape hatch if Phase 1 or Phase 2 stop signals trip.
- Reference `.NET` work may exist only as isolated oracle tooling.
- Original DOS/Amiga assets are user-provided local data only.
- `SPAU.PA` under ignored `serfbound-local-data/` is the current local
  verification source.
- Direct `.PA` file selection is the initial browser import baseline; drag/drop
  shares the same boundary, IndexedDB is the default persistence target, and
  directory picker is optional progressive enhancement.
- "Abandonware" is not redistribution permission.

## Verification Commands

These commands were used during the completion audit:

```bash
git status --short --branch
find pm/roadmap/serfbound -maxdepth 2 -name 'current-phase-status.md' -print | sort
for f in pm/roadmap/serfbound/phase-*/current-phase-status.md; do rg -n "Non-negotiable constraints|Final product code is pure browser|No .NET product runtime|Original DOS/Amiga data is user-provided" "$f"; done
for f in pm/roadmap/serfbound/phase-0-setup/story-*.md; do n=$(basename "$f" | sed -E 's/story-0*([0-9]+)-.*/\1/'); e="$(dirname "$f")/evidence-story-$(printf '%02d' "$n").md"; test -f "$e" && echo "ok $(basename "$f") -> $(basename "$e")" || echo "missing $e"; done
find pm/roadmap/serfbound/phase-0-setup -maxdepth 1 -type f -name 'evidence-story-*.md' -print | sort
rg -n "\| SB-1-0[1-4] .* \| ready \|" pm/roadmap/serfbound/phase-1-reference-oracle/current-phase-status.md
rg -n "\*\*Status:\*\* ready" pm/roadmap/serfbound/phase-1-reference-oracle/story-*.md
git ls-files | rg -n '(^|/)(SPA.*\.PA|SOUNDS\.PA|SERF\.EXE|.*\.adf$|sounds/|music/|serfbound-local-data/)' || true
git diff --check
```

## Known Limitations

- No browser workspace exists yet.
- No reference oracle output has been captured yet.
- No Serfbound runtime, renderer, asset parser, UI shell, playable slice, or
  release artifact exists yet.
- Local Node exists but was observed during SB-0-03 to fail because of a missing
  Homebrew `libllhttp.9.3.dylib`; Phase 2 must repair web tooling before it can
  prove build/test commands.
- `dotnet` is not on `PATH` in this environment; Phase 1 reference capture needs
  a repaired SDK path or another environment.

## Deferred Work

- Phase 1 starts with SB-1-01, selecting concrete oracle targets from the Phase
  0 parity baseline.
- Phase 1 must capture at least one data-free output and one local/manual
  `SPAU.PA` metadata output.
- Phase 2 must scaffold the TypeScript-first browser workspace and CI-safe test
  spine.
- Phases 3 through 9 remain unimplemented and must each ship evidence before
  being marked complete.
