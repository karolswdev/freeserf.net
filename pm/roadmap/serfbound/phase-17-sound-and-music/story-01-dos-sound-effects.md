# SB-17-01 — Decode and Fire DOS Sound Effects

- **Project:** serfbound
- **Phase:** 17
- **Status:** done
- **Depends on:** SB-16-05
- **Unblocks:** SB-17-02
- **Owner:** unassigned

## Problem

The DOS archive carries the original effect clips (entries 3900+). They must decode to WebAudio buffers and fire on the reference event mapping - construction thuds, sawing, mining, fights, clicks.

## Scope

- **In:** SFX entry decoding per Audio/SFX.cs into AudioBuffers, an audio service in the app (gesture-gated AudioContext), reference event-to-clip mapping wired into sim/UI events, data-free decode tests on synthetic fixtures.
- **Out:** Music (SB-17-02), volume UI persistence (SB-17-03).

## Acceptance criteria

- [x] SFX entries decode from real data in opt-in checks (format facts asserted).
- [x] Events fire mapped clips (observable via the audio service state in tests).
- [x] AudioContext unlocks on first gesture without console errors.

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
