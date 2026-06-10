# Phase 24 — Community and Identity

**Last updated:** 2026-06-10.
**Status:** not started.

## Goal

Let players be someone and find each other: local-first profiles, an
optional account service with a hard privacy boundary, lobby listing and
matchmaking on top of the Phase 23 relay, and a ladder — all while the
game itself stays fully playable with zero accounts and zero servers.

## Scope

- **In:** Local profiles (name, colors, match history) with no server,
  the identity decision record (what an account is for, what is stored,
  what is never stored), an optional minimal account service, lobby
  listing/matchmaking over the signaling relay, opponent-verified match
  results feeding a ladder, abuse/operations posture for the hosted
  pieces.
- **Out:** Monetization (none — GPL project, standing rule), social
  graphs/chat platforms, federation.

## Non-negotiable constraints

- Accountless play is first-class forever: identity is optional
  convenience, never a gate on playing.
- Data minimization: the service stores what the decision record
  enumerates and nothing else; no emails-for-the-sake-of-it, no
  tracking, nothing sellable.
- Original game data never touches any hosted service.

## Exit criteria (evidence required)

- [ ] Local profiles persist and travel into multiplayer sessions with
  no hosted dependency. (SB-24-01)
- [ ] The identity decision record ships and the optional account
  service implements exactly it. (SB-24-02)
- [ ] Players can list/join open games and be matched through the relay.
  (SB-24-03)
- [ ] Verified match results produce a ladder with an honest
  abuse/operations posture; phase gate reruns green. (SB-24-04)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-24-01 | Local-first profiles | backlog | story-01-local-first-profiles.md | — |
| SB-24-02 | Identity decision and account service | backlog | story-02-identity-account-service.md | — |
| SB-24-03 | Lobby and matchmaking | backlog | story-03-lobby-matchmaking.md | — |
| SB-24-04 | Ladder and operations gate | backlog | story-04-ladder-operations-gate.md | — |

## Where we are

Scaffolded; starts after Phase 23 closes. This phase deliberately
front-loads decision records: hosted identity is a posture change for a
zero-telemetry project and ships only as written.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Hosted identity erodes the privacy posture | medium | Decision record first; data-minimization contract tests | Any field stored beyond the record |
| Matchmaking centralizes a P2P game | medium | Relay-level listing only; gameplay stays P2P | Gameplay traffic on hosted pieces |
| Ladder gaming/abuse | high | Opponent-verified results; modest stakes (no rewards) | Result forgery without detection |

## Decisions made (this phase)

- none yet.

## Decisions deferred

- Auth mechanism (passkeys vs OAuth vs magic links) — decided in
  SB-24-02's record.
- Ranked seasons/resets.
