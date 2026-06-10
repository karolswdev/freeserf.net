# SB-27-03 — Reconnect, Resync, and Desync Recovery

- **Project:** serfbound
- **Phase:** 27
- **Status:** backlog
- **Depends on:** SB-27-02
- **Unblocks:** SB-27-04
- **Owner:** unassigned

## Problem

Real networks drop. A dropped peer must rejoin and resync — by replaying
the action log to the current tick, never by merging state — and a
detected desync must surface honestly with recovery options instead of
silently diverging worlds.

## Scope

- **In:** Session pause/hold on peer loss, rejoin handshake with
  action-log catch-up replay, checksum re-verification after rejoin,
  desync surfacing UX (save-and-end honestly; rehost from a shared
  save), timeouts and abandon semantics.
- **Out:** Host migration beyond 2 players; spectator catch-up.

## Acceptance criteria

- [ ] A killed-and-reopened peer rejoins and reaches checksum agreement.
- [ ] Forced desync (injected) surfaces to both players with the
  recovery options; no silent divergence.
- [ ] Abandoned sessions end cleanly into a local save.

## Test plan

- **Unit:** Rejoin/catch-up scheduler semantics in CI.
- **Integration / e2e:** Playwright kill-and-rejoin scenario over local
  WebRTC.
- **Manual / device:** Real-network drop test recorded in evidence.
- **Design handoff:** Recovery UX screenshots under phase artifacts.

## Notes / open questions

- Preserves: determinism — resync is replay, state never merges.
- Browser boundary: network lifecycle.
- .NET reference use: none.
- Phase gate advanced: exit criterion 3.
