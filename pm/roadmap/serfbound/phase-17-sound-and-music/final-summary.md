# Phase 17 — Final Summary

**Closed:** 2026-06-10.

## Goal — was it met?

Yes. The game sounds like Settlers from the player's own data: all 39
reference DOS clips decode with the exact `ConvertToWav` math and fire on
the reference event moments (commands, popups, construction, defeat, and
the production work loops), the original XMI tracks parse with the exact
chunk walk (10,409 events in real track 0) and play through WebAudio
after the first gesture, and the audio settings persist with
tab-visibility pause/resume. No audio asset is committed or bundled.

## Exit criteria — final state

- [x] DOS SFX decode to playable WebAudio buffers with the reference
  event mapping (SB-17-01).
- [x] XMI parses and the recorded playback decision (WebAudio oscillator
  synth) plays the classic tracks (SB-17-02).
- [x] Volume/mute persist; autoplay rules and tab visibility respected
  (SB-17-03).

## Stories shipped

| ID | Story | Evidence |
|---|---|---|
| SB-17-01 | Decode and fire DOS sound effects | evidence-story-01.md |
| SB-17-02 | Play XMI music in the browser | evidence-story-02.md |
| SB-17-03 | Audio settings, hooks, and polish | evidence-story-03.md |

## Decisions made

- Music playback: WebAudio oscillator synthesis (square lead, triangle
  percussion) — browser-native, zero bundled audio. Rejected: bundled
  soundfonts and pre-rendered audio (no-redistribution boundary), WebMIDI
  (no output guarantee). Sampled-synth upgrade recorded for Phase 19.

## What the phase intentionally did not do

- Music looping and volume stepper UI (Phase 19 polish).
- Amiga audio formats (recorded later evaluation, per scope).
- Positional audio beyond the original model.

## Carry-forward recommendations

1. Phase 19's polish pass: music looping, volume steppers, and the
   sampled-synth evaluation.
2. Phase 18's mission events should reuse the notification + SFX pairing
   (`Message` clip for the message icon).
