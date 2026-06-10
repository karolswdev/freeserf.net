# SB-26-02 — Amiga Decoders Behind the Typed Catalog

- **Project:** serfbound
- **Phase:** 26
- **Status:** backlog
- **Depends on:** SB-26-01
- **Unblocks:** SB-26-03
- **Owner:** unassigned

## Problem

If SB-26-01 records go: Amiga archives must import, decode, and play
through the same typed asset catalog the DOS path uses — parallel
decoders behind the interface, invisible to the engine and renderer.

## Scope

- **In:** Amiga import/detection in the existing import flow, format
  decoders ported read-only from the reference Amiga data sources,
  catalog mapping to the same typed groups, opt-in real-corpus parity
  tests plus CI-safe synthetic fixtures, IndexedDB persistence parity.
- **Out:** Amiga-specific UI; music-engine changes beyond what the
  corpus demands (recorded if any).

## Acceptance criteria

- [ ] A user-selected Amiga archive imports, persists, and starts a
  playable decoded game.
- [ ] Opt-in parity tests over the real corpus meet the DOS standard.
- [ ] The engine and renderer compile untouched — decode stays behind
  the catalog.

## Test plan

- **Unit:** Synthetic Amiga fixture decode in CI.
- **Integration / e2e:** Import-to-play flow on the synthetic fixture.
- **Manual / device:** Opt-in real-corpus suite + visual-gate captures.
- **Design handoff:** Screenshots under phase artifacts.

## Notes / open questions

- Preserves: the typed-catalog boundary from Phase 4.
- Browser boundary: file import (new format), persistence.
- .NET reference use: read-only porting reference.
- Phase gate advanced: exit criterion 2.
