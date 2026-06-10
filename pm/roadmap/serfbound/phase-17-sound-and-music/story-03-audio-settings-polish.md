# SB-17-03 — Audio Settings, Hooks, and Polish

- **Project:** serfbound
- **Phase:** 17
- **Status:** done
- **Depends on:** SB-17-02
- **Unblocks:** SB-18-01
- **Owner:** unassigned

## Problem

Sound needs to behave like a polished product - persistent volume/mute per channel, sensible behavior on tab switch and game pause, and complete event coverage review.

## Scope

- **In:** Volume/mute controls in the authentic settings popup, persistence with existing storage, tab-visibility and pause handling, event coverage audit vs reference mapping, performance check (no main-thread jank from audio).
- **Out:** New audio features beyond the original.

## Acceptance criteria

- [x] Settings persist and apply across reloads.
- [x] Hidden-tab and paused-game behavior is defined and tested.
- [x] Event coverage audit recorded
- [x]  gaps listed explicitly.

## Test plan

- **Unit:** Decode/parse and event-mapping tests on synthetic fixtures.
- **Integration / Cypress:** Browser tests assert audio service state.
- **Manual / device:** Listen with real local data; record findings.
- **Design handoff:** n/a — audio evidence is the manual listening note.

## Notes / open questions

- Preserves: reference audio data formats and event mapping.
- Browser boundary: WebAudio, autoplay policy, page visibility.
- .NET reference use: Audio/ read as format/mapping reference.
- Phase gate advanced: see phase exit criteria.
