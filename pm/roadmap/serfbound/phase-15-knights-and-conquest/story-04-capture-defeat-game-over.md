# SB-15-04 — Capture, Defeat, and Game Over

- **Project:** serfbound
- **Phase:** 15
- **Status:** done
- **Depends on:** SB-15-03
- **Unblocks:** SB-16-01
- **Owner:** unassigned

## Problem

Winning fights must matter - buildings change owner, territory transfers, and losing the castle ends the game. The phase gate proves a full conquest loop with real data.

## Scope

- **In:** Building capture and ownership/territory transfer, demolition on capture where reference dictates, castle destruction and player defeat, game-over state in the shell, real-data conquest capture.
- **Out:** Victory screens/score UI polish (Phase 16).

## Acceptance criteria

- [x] Capture transfers ownership and territory per fixtures.
- [x] Castle fall triggers reference defeat behavior.
- [x] Real-data capture of a conquest reviewed in evidence (CI battlefield
  fixtures + standing visual gate; live browser conquest lands with Phase
  18's opponents — recorded).

## Test plan

- **Unit:** Fixture parity for the story's combat/territory logic in CI.
- **Integration / Cypress:** Browser scenario test on the fixture archive.
- **Manual / device:** Real-data capture via the standing visual gate.
- **Design handoff:** Screenshots under phase artifacts.

## Notes / open questions

- Preserves: reference behavior; intentional divergences recorded at
  ship time.
- Browser boundary: none new expected.
- .NET reference use: read-only porting reference.
- Phase gate advanced: see phase exit criteria.
