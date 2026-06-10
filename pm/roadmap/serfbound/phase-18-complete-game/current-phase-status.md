# Phase 18 — The Complete Game

**Last updated:** 2026-06-10.
**Status:** in progress.

## Goal

Everything that makes it a finished game rather than a sandbox: the original
campaign missions, classic AI opponents, original savegame loading, and game
speed/long-session robustness.

## Scope

- **In:** Mission definitions and selection (`Mission.cs`), the classic AI
  (`AI.cs` + `AIStates/` — staged like Serf.cs was), original DOS `.SAV`
  loading (`Savegame.cs` + `GameStore`), game speed controls, autosave, and
  long-session stability.
- **Out:** Multiplayer (post-launch track), new game modes, difficulty
  rebalancing.

## Non-negotiable constraints

- AI behavior is checked against recorded reference runs (decision fixtures),
  not "seems reasonable".
- Original savegame parity: a reference `.SAV` must load to the same game
  state facts as the reference implementation reports.

## Exit criteria (evidence required)

- [x] Campaign missions select and start with correct maps, players, and
  supplies. (SB-18-01)
- [ ] AI opponents found settlements, build economies, and act militarily,
  matching decision fixtures on seeded runs. (SB-18-02, SB-18-03)
- [ ] Original DOS savegames load and continue. (SB-18-04)
- [ ] Game speeds, autosave, and multi-hour sessions hold up, with a played
  mission as capture evidence. (SB-18-05)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-18-01 | Missions and game setup variants | done | story-01-missions-and-setup.md | evidence-story-01.md |
| SB-18-02 | Classic AI foundation | done | story-02-classic-ai-foundation.md | evidence-story-02.md |
| SB-18-03 | Classic AI economy and military behaviors | backlog | story-03-classic-ai-behaviors.md | — |
| SB-18-04 | Load original DOS savegames | backlog | story-04-original-savegames.md | — |
| SB-18-05 | Speed, autosave, and the played-mission gate | backlog | story-05-speed-autosave-gate.md | — |

## Where we are

SB-18-02 is done: AI opponents found castles deterministically, establish
the reference opening build order over their own pathfinder roads, and
their buildings complete through serf labor — every decision recorded as
a replayable world action and fixtured on seeded runs. SB-18-03 (economy
and military behaviors) is next.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| AI port quietly diverges (it touches every system) | high | Decision fixtures from seeded reference runs per AI state | Fixture mismatches accumulating |
| Original save format edge cases | medium | Corpus of reference saves incl. mid-fight/mid-build states | Loads that desync after N ticks |
| Long sessions expose leaks | medium | Soak test in SB-18-05 with memory/tick metrics | Degradation over hours |

## Decisions made (this phase)

- none yet.

## Decisions deferred

- Tutorial mission flow if the reference scope review finds one.
