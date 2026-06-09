# SB-1-01 — Select First Oracle Targets

- **Project:** serfbound
- **Phase:** 1
- **Status:** done
- **Depends on:** SB-0-02, SB-0-04
- **Unblocks:** SB-1-02, SB-1-03, SB-1-04
- **Owner:** Codex

## Problem

Serfbound needs reference facts before it can safely rewrite behavior. The first
oracle targets must be small enough to capture and review, but broad enough to
cover simulation, resources, and serialization risk.

## Scope

- **In:** Choose initial oracle targets from `Freeserf.Core` files, define why
  each target matters, classify each as CI-safe or local-asset-only, and record
  expected output shapes.
- **Out:** Implementing capture tools, creating browser code, or changing
  `freeserf.net` gameplay behavior.

## Acceptance criteria

- [x] `pm/roadmap/serfbound/adoption/oracle-targets.md` exists.
- [x] At least one target is data-free and suitable for CI.
- [x] At least one target uses local `SPAU.PA` and is marked local/manual.
- [x] Every target names exact source files and methods/classes to inspect.
- [x] Every target states the future Serfbound phase it protects.

## Test plan

- **Unit:** n/a - planning artifact.
- **Integration / Cypress:** n/a.
- **Manual / device:** Verify each referenced source file exists with `test -f`
  or `rg`.
- **Design handoff:** n/a - non-visual.

## Notes / open questions

Default starting candidates: map/random behavior, DOS resource catalog facts,
and save/state serialization facts.
