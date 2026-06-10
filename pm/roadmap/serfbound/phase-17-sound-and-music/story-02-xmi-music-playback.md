# SB-17-02 — Play XMI Music in the Browser

- **Project:** serfbound
- **Phase:** 17
- **Status:** backlog
- **Depends on:** SB-17-01
- **Unblocks:** SB-17-03
- **Owner:** unassigned

## Problem

Original music ships as XMI (extended MIDI). The reference converts XMI to MIDI events for an OS synth - the browser has none, so this story prototypes and records the playback decision (WebAudio synth, soundfont, or pre-rendered-on-import), then ships it.

## Scope

- **In:** XMI parsing to timed MIDI events per Audio/XMI.cs, playback decision story with at least two prototypes, the chosen implementation with track switching, CI-safe parsing tests on synthetic XMI fixtures.
- **Out:** Audio settings UI (SB-17-03).

## Acceptance criteria

- [ ] XMI parsing matches reference event streams on fixtures.
- [ ] A decision record compares prototypes (quality, size, latency).
- [ ] Classic tracks play in-browser from imported data (manual evidence).

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
