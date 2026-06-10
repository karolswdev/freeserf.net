# SB-22-04 — Two-Tab Loopback Gate

- **Project:** serfbound
- **Phase:** 22
- **Status:** done
- **Depends on:** SB-22-03
- **Unblocks:** SB-23-01
- **Owner:** Claude

## Problem

The phase gates on something playable: two real browser contexts playing
one game through the full stack (UI → protocol → lockstep → engine) over
a serverless loopback transport, proving multiplayer needs nothing but
the browser before any networking lands.

## Scope

- **In:** A loopback transport (BroadcastChannel or equivalent), minimal
  host/join UI behind the init screen, two-context Playwright e2e where
  both players act and final checksums match, phase final summary.
- **Out:** Internet transports (Phase 23), spectators, >2 players if the
  evidence says defer.

## Acceptance criteria

- [x] Two browser contexts on one origin start and play one game; both
  render the same world.
- [x] Actions from both players execute on both peers; final checksums
  match in e2e.
- [x] Single-player flows are untouched (full suite reruns green).

## Test plan

- **Unit:** Transport adapter contract tests in CI.
- **Integration / e2e:** Two-context Playwright lockstep game.
- **Manual / device:** Two-tab session captured via the visual gate.
- **Design handoff:** Screenshots under phase artifacts.

## Notes / open questions

- Preserves: pure-browser constraint — multiplayer with zero servers.
- Browser boundary: cross-context messaging.
- .NET reference use: none.
- Phase gate advanced: exit criterion 4 (phase close).
