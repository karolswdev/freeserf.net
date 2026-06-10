# Serfbound Phase Gate Verification Matrix

**Last updated:** 2026-06-09.
**Status:** complete for the current first Serfbound browser-slice release candidate.

## Purpose

Define the evidence required before anyone can honestly claim that Serfbound's
PMO phases are fully developed, tested, and end-to-end proven.

This matrix is intentionally strict. A phase is not complete because it has a
status file or because code exists. A phase is complete only when its stories
ship with paired evidence and its exit criteria are proven by commands,
artifacts, or manual verification notes.

## Global Invariants

- Final product code is pure browser: no .NET runtime, no desktop shell, no
  native launcher, no hidden companion process.
- Original DOS/Amiga assets may be used locally, but are not committed, hosted,
  bundled, or redistributed by Serfbound.
- CI must remain useful without `serfbound-local-data/`.
- Every story that flips to `done` must ship `evidence-story-{n}.md` in the same
  phase folder.
- Every phase exits with `final-summary.md` that links shipped stories,
  evidence, commands, known limitations, and deferred work.

## Gate Matrix

| Phase | Gate | Required proof | Current status |
|---|---|---|---|
| 0 | Rewrite discovery is credible | Roadmap, source inventory, runtime decision, parity design, asset boundary, and phase plan exist | Complete |
| 1 | Reference oracle is trustworthy | Data-free and local-asset oracle outputs captured, documented, and isolated from product code | Complete |
| 2 | Browser foundation is real | Pure-browser workspace builds, tests, and renders a static shell without original assets | Complete |
| 3 | Simulation parity starts | First deterministic engine tests pass against CI-safe oracle fixtures | Complete |
| 4 | Local data import works | Browser imports local `SPAU.PA`, parses catalog metadata, and keeps CI asset-free | Complete |
| 5 | Map rendering is proven | Browser renders a nonblank map scene with tested projection and viewport checks | Complete |
| 6 | Player intent reaches engine | Pointer/input/UI shell routes valid commands and rejects invalid ones recoverably | Complete |
| 7 | First playable loop works | Human can import, start, act, save, reload, and resume in browser with evidence | Complete |
| 8 | Browser constraints are handled | Performance, storage recovery, worker decision, and browser matrix are measured | Complete |
| 9 | Release is operational | CI, static packaging, docs, compatibility, and release audit pass without forbidden artifacts | Complete |

## Evidence Rules By Type

| Evidence type | Acceptable proof | Not enough |
|---|---|---|
| Command output | Actual command name and pass/fail output in evidence file | "Tests pass" without command |
| Browser behavior | Screenshot/video path, browser/version, viewport, and action script | A verbal claim that it looked fine |
| Local asset check | Metadata/checksum output, local path, skip behavior for CI | Raw original asset bytes in Git |
| Architecture decision | Alternatives, chosen path, rejection reasons, stop signal | Preference statement |
| Parity | Reference fixture, Serfbound output, comparison command, divergence notes | Similar-looking behavior |
| Release | CI link/output, artifact inspection, docs checklist, known limitations | Build exists locally |

## Completion Audit Procedure

Before marking any phase complete:

1. Read the phase `current-phase-status.md`.
2. Confirm every story table row marked `done` has a matching evidence file.
3. Confirm every exit criterion has direct evidence.
4. Run or inspect the named commands/artifacts.
5. Create `final-summary.md` with shipped stories, evidence links, decisions,
   limitations, and deferred work.
6. Update the project README phase index and current phase pointer.

Before marking the whole Serfbound goal complete:

1. Repeat the phase audit for Phases 0 through 9.
2. Verify the release artifact has no .NET or desktop runtime artifacts.
3. Verify no original assets are tracked or bundled.
4. Verify CI and browser/manual evidence cover the release gates.
5. Verify player and developer docs match the shipped behavior.

## Current Gap Summary

As of 2026-06-09, Phases 0 through 9 are complete for the current first
Serfbound browser-slice release candidate. Every phase has paired story
evidence and a final summary. The release readiness report records the scoped
go decision, known limitations, and stop signals.
