# Phase 17 — Sound and Music

**Last updated:** 2026-06-10.
**Status:** complete — see final-summary.md.

## Goal

The game sounds like Settlers: decoded DOS sound effects fire on the right
events through WebAudio, and the original XMI music plays in the browser,
with persistent volume/mute controls.

## Scope

- **In:** SFX decoding from `SPAU.PA` sound entries (`Audio/SFX.cs` reference)
  into WebAudio buffers; XMI parsing (`Audio/XMI.cs`) and a recorded decision
  story for browser playback (WebAudio synth vs. soundfont vs. pre-rendered);
  event-driven audio hooks across sim and UI; audio settings persistence.
- **Out:** New/remastered audio assets; Amiga audio formats (recorded as a
  later evaluation); spatial/positional audio beyond the original model.

## Non-negotiable constraints

- Audio derives from the user's imported data at runtime; no audio assets are
  committed or bundled.
- Autoplay policies: audio starts only after user gesture, gracefully.
- CI stays silent-but-tested: decode and event-hook logic test data-free with
  synthetic fixtures; actual sound is opt-in/manual evidence.

## Exit criteria (evidence required)

- [x] DOS SFX entries decode to playable WebAudio buffers; reference event
  mapping fires the right clip (build thud, sawing, fights…). (SB-17-01;
  per-serf work-loop hooks land with SB-17-03)
- [x] XMI music parses and a chosen playback path plays the classic tracks in
  the browser, with the decision recorded. (SB-17-02: WebAudio oscillator
  synth, no bundled audio)
- [x] Volume/mute for SFX and music persist; audio respects autoplay rules
  and tab visibility. (SB-17-03)

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-17-01 | Decode and fire DOS sound effects | done | story-01-dos-sound-effects.md | evidence-story-01.md |
| SB-17-02 | Play XMI music in the browser | done | story-02-xmi-music-playback.md | evidence-story-02.md |
| SB-17-03 | Audio settings, hooks, and polish | done | story-03-audio-settings-polish.md | evidence-story-03.md |

## Where we are

The phase is closed. The game sounds like Settlers: all 39 original
clips decode and fire on commands, popups, construction, defeat, and the
work loops; the XMI tracks parse exactly and play through the recorded
WebAudio-oscillator decision after the first gesture; mute settings
persist and the tab's visibility pauses and resumes the audio. See
final-summary.md.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| XMI→browser playback is novel (no port to lean on) | high | Decision story with prototypes before committing | Music story exceeding two prototype rounds |
| Demo data may lack some audio entries | medium | Treat missing entries as importable-partial, like sprites | Hard failures on partial archives |
| Audio timing drifts from sim events | low | Hook on sim events, not render frames | Audible desync |

## Decisions made (this phase)

- none yet.

## Decisions deferred

- Amiga sound/music data support.
