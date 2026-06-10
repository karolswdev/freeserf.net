# Phase 19 — First-Class Browser Experience

**Last updated:** 2026-06-10.
**Status:** complete — see final-summary.md.

## Goal

Make it feel like a premium browser product, not a port: fast on big maps,
genuinely playable on touch devices, installable and offline-capable, with a
polished first-run experience and real accessibility.

## Scope

- **In:** Performance at scale (profiling on large maps with full economy +
  AI; render batching/dirty updates; the deferred worker-offload decision
  with measured stop signals), zoom, touch/mobile controls and responsive
  layout, PWA install + offline app shell, first-run asset-import onboarding,
  accessibility (keyboard play, contrast, reduced motion), and settings.
- **Out:** Gameplay changes; multiplayer; marketing site.

## Non-negotiable constraints

- Performance work follows measurements, not hunches — extend the Phase 8
  measurement harness first, optimize second.
- The PWA never caches or bundles original game data; offline means the app
  shell plus the user's own IndexedDB-imported data.
- Worker adoption only behind the Phase 8 contract: message contracts,
  deterministic equivalence, and failure recovery proven.

## Exit criteria (evidence required)

- [x] Measured baselines on large maps with full simulation; optimizations hit
  recorded targets (e.g. steady frame cadence on mid hardware). (SB-19-01:
  budgets met with 10-100x headroom; no optimization warranted, recorded)
- [x] Worker offload implemented or explicitly rejected with measurements.
  (SB-19-02: rejected — see worker-offload-decision.md)
- [x] The game is playable on a tablet/phone: touch controls, responsive
  authentic UI, device-tested. (SB-19-03; emulated device positions —
  physical-device notes join the launch checklist)
- [x] Installable PWA with offline shell; imported data and saves work
  offline. (SB-19-04)
- [x] First-run onboarding guides asset import; keyboard/contrast/motion
  accessibility audited and fixed. (SB-19-05)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-19-01 | Performance at scale | done | story-01-performance-at-scale.md | evidence-story-01.md |
| SB-19-02 | Worker offload decision and implementation | done | story-02-worker-offload.md | evidence-story-02.md |
| SB-19-03 | Touch and mobile play | done | story-03-touch-mobile-play.md | evidence-story-03.md |
| SB-19-04 | PWA install and offline shell | done | story-04-pwa-offline-shell.md | evidence-story-04.md |
| SB-19-05 | Onboarding, accessibility, and settings | done | story-05-onboarding-accessibility.md | evidence-story-05.md |

## Where we are

The phase is closed. It is a first-class browser product: measured scale
headroom (no optimization warranted, worker offload rejected on
evidence), touch play on phone viewports through the responsive
authentic UI, an installable offline-capable PWA that never caches
original data, first-run onboarding, live-region accessibility, and
keyboard play. See final-summary.md.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Optimizing without a target wastes the phase | medium | Baseline + budget per scenario before changes | PRs without before/after numbers |
| Touch ergonomics fight the original UI | high | Device testing per story, not at the end | Unusable popup interactions on phones |
| Worker determinism breaks sim parity | medium | Phase 8 worker contract enforced; parity fixtures rerun | Any fixture divergence under workers |

## Decisions made (this phase)

- none yet.

## Decisions deferred

- Gamepad support; cloud save sync.
