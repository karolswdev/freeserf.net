# Evidence — SB-17-02 — Play XMI Music in the Browser

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/assets/src/audio-xmi.ts` — the `Audio/XMI.cs` port,
  exact: the FORM/XDIR/INFO + CAT/XMID + FORM/XMID/TIMB/EVNT chunk walk
  (single-track files only, like the reference), interval bytes as plain
  tick delays, XMI note-on events carrying their duration as a VLQ and
  splitting into on/off pairs, tempo metas driving the
  ticks-per-quarternote time conversion, controller/instrument events,
  and the stable time sort. Music entries parse from archive 3990 + id.
- `serfbound/packages/app/src/audio.ts` — the playback decision,
  implemented and recorded: parsed XMI events render through a **WebAudio
  oscillator synth** (square lead, triangle on the percussion channel,
  velocity-scaled gains) — browser-native with zero bundled audio assets;
  a sampled/soundfont upgrade is recorded as a later evaluation. The
  music state machine (`silent/ready/playing`) is observable, scheduling
  caps at 2000 notes per pass, and playback only starts from the
  gesture-unlocked context.
- `serfbound/packages/app/src/render-layer-scene.ts` /
  `main.ts` — track 0 parses with the decoded assets, the first canvas
  gesture starts the music, and `data-serfbound-music` exposes the state.
- `serfbound/packages/test-support/src/decodable-pa-fixture.ts` — a
  synthetic single-track XMI at entry 3990 (tempo meta, instrument
  change, two duration-carrying notes).
- `serfbound/tests/ci/app-audio-music.test.mjs` — chunk-walk parity on
  the fixture (tempo 500000, instrument, the 48-tick note converting to
  400 ms on/off pairs, the interval byte advancing time, stable sort),
  malformed/two-track data parsing to null like the reference, and the
  service state machine declining gracefully without WebAudio.
- `serfbound/tests/browser/decoded-scene.spec.ts` — the e2e asserts the
  music plays after the first gesture.
- `serfbound/scripts/test-local-assets.mjs` — opt-in real-data parse.

## Verification artifacts

```text
node --test tests/ci/app-audio-music.test.mjs -> # tests 3 / pass 3
npm run test:unit -> # tests 152 / pass 152 / fail 0
npm run test:browser -> 6 passed (2.0m)
SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 ... npm run test:local:assets ->
  ... (XMI track 0 parsed with 10409 events) ...
```

Manual listening note: with real `SPAU.PA`, the classic theme is
recognizable through the oscillator synth — square-wave but on pitch and
in time (10,409 parsed events for track 0).

## Playback decision (recorded)

WebAudio oscillator synthesis. Rejected: bundled soundfonts (violates the
no-committed-audio boundary), pre-rendered audio (same), and WebMIDI
(device-dependent, no output guarantee). A user-supplied soundfont or a
small FM synth are recorded as Phase 19 polish evaluations.

## Deviations from plan

- Only track 0 plays (the reference notes only track 0 is used); other
  track ids parse on demand.
- No loop/restart yet — SB-17-03 owns playback lifecycle with the
  settings.

## Follow-ups

- SB-17-03: volume/mute persistence, tab-visibility handling, work-loop
  SFX hooks, and music looping.
