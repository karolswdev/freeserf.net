# SB-20-02 — Error Reporting and Issue Intake

- **Project:** serfbound
- **Phase:** 20
- **Status:** done
- **Depends on:** SB-20-01
- **Unblocks:** SB-20-03
- **Owner:** unassigned

## Problem

Live players hit bugs the suite never saw. They need an opt-in way to report errors with actionable context - without telemetry creep and without ever shipping their game data.

## Scope

- **In:** Opt-in error report generation (app version, browser, sanitized state summary, recent command log) surfaced in the error UI, GitHub issue templates and triage doc, privacy review of report contents.
- **Out:** Automatic crash uploads, analytics of any kind.

## Acceptance criteria

- [x] Error reports contain actionable, privacy-reviewed context only.
- [x] Issue templates and a triage flow are documented.
- [x] A simulated failure produces a usable report end-to-end.

## Test plan

- **Unit:** n/a unless story logic demands it.
- **Integration / Cypress:** Release-path checks where applicable.
- **Manual / device:** Production verification recorded as evidence.
- **Design handoff:** n/a — operational evidence.

## Notes / open questions

- Preserves: the asset/legal boundary and GPL obligations at launch.
- Browser boundary: production hosting, caching, error surfaces.
- .NET reference use: none.
- Phase gate advanced: see phase exit criteria.
