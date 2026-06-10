# Phase 19 — First-Class Browser Experience

**Last updated:** 2026-06-10.
**Status:** in progress.

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
- [ ] Worker offload implemented or explicitly rejected with measurements.
  (SB-19-02)
- [ ] The game is playable on a tablet/phone: touch controls, responsive
  authentic UI, device-tested. (SB-19-03)
- [ ] Installable PWA with offline shell; imported data and saves work
  offline. (SB-19-04)
- [ ] First-run onboarding guides asset import; keyboard/contrast/motion
  accessibility audited and fixed. (SB-19-05)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-19-01 | Performance at scale | done | story-01-performance-at-scale.md | evidence-story-01.md |
| SB-19-02 | Worker offload decision and implementation | backlog | story-02-worker-offload.md | — |
| SB-19-03 | Touch and mobile play | backlog | story-03-touch-mobile-play.md | — |
| SB-19-04 | PWA install and offline shell | backlog | story-04-pwa-offline-shell.md | — |
| SB-19-05 | Onboarding, accessibility, and settings | backlog | story-05-onboarding-accessibility.md | — |

## Where we are

SB-19-01 is done: the scale baseline is measured (size-6 maps with full
economy + AI sustain ~2M ticks/s; scene builds in ~3ms against the 175ms
frame) and CI-guarded; no optimization was warranted. SB-19-02 (the
worker-offload decision) consumes these numbers next.

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
