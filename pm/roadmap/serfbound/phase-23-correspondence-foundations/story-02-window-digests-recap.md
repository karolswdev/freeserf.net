# SB-23-02 — Window Digests and Recap Replay

- **Project:** serfbound
- **Phase:** 23
- **Status:** done
- **Depends on:** SB-23-01
- **Unblocks:** SB-23-03
- **Owner:** Claude

## Problem

"While you waited, your opponent did X." The waiting player needs an
honest summary of a window — and better, to watch it: the received
segment plus determinism means the opponent's ten minutes can replay
before their eyes at high speed.

## Scope

- **In:** Deterministic window digests computed from state before/after
  re-simulation (per player: buildings completed, roads built, resource
  deltas, land area, military/combat events), and the shell's recap
  mode: replay the received window accelerated, then hand over.
- **Out:** Turn flow/countdown (SB-23-03); notification delivery
  (Phase 24).

## Acceptance criteria

- [x] Digest numbers match independently computed state deltas in
  fixtures (both peers compute identical digests).
- [x] The shell replays a received window at high speed and lands on
  the verified end state. (The frame-chunked driver is proven headless;
  its visible turn-flow surface lands with SB-23-03 — recorded.)
- [x] Digest text renders through the game font (shadowed, readable).

## Test plan

- **Unit:** Digest fixtures against scripted windows in CI.
- **Integration / e2e:** Recap replay assertions join the SB-23-04
  gate spec.
- **Manual / device:** Real-data capture of a recap via the visual
  gate.
- **Design handoff:** Recap screenshots under phase artifacts.

## Notes / open questions

- Preserves: the decoded-font text path (SB-21-02) for digest display.
- Browser boundary: none new.
- .NET reference use: none.
- Phase gate advanced: exit criterion 2.
