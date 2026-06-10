# Evidence — SB-17-01 — Decode and Fire DOS Sound Effects

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/assets/src/audio-sfx.ts` — the `Audio/SFX.cs` port:
  `convertSfxToPcm16` is the exact `ConvertToWav` ((byte + level) * 0xFF
  with the C# short wrap), DOS sounds at level -32 and 8000 Hz per the
  reference wave player; the full `Audio.TypeSfx` clip-id table; sound
  entries decode from archive index 3900 + id.
- `serfbound/packages/app/src/audio.ts` — `SerfboundAudioService`:
  decoded clips load with the render assets, the AudioContext is created
  and resumed only from a user gesture (autoplay policy) and degrades to
  `unavailable` where WebAudio is missing (CI stays silent-but-tested),
  playback facts (`lastSfx`, `playedCount`) stay observable everywhere,
  and clips render into 8000 Hz AudioBuffers scaled by the SFX volume.
- `serfbound/packages/app/src/render-layer-scene.ts` — every reference
  clip the archive defines decodes into `rawSfx`.
- `serfbound/packages/app/src/main.ts` — the event mapping: accepted
  commands play `Accepted`, rejected ones `NotAccepted`, popup opens
  `Click`, completed buildings `HammerBlow`, defeat `Ahhh`; the first
  canvas gesture unlocks the context; `data-serfbound-audio` /
  `data-serfbound-last-sfx` expose the service state.
- `serfbound/packages/test-support/src/decodable-pa-fixture.ts` — seven
  synthetic sound entries (raw 8-bit PCM) in the CI fixture.
- `serfbound/tests/ci/app-audio-sfx.test.mjs` — ConvertToWav parity
  (level shift, scaling, the 16-bit wrap on high bytes), fixture decode
  into the render assets, and the service's gesture gate, observable
  mapping, unknown-clip and mute behavior.
- `serfbound/tests/browser/decoded-scene.spec.ts` — the founding e2e
  asserts WebAudio unlocked on the first gesture and the mapping fired.
- `serfbound/scripts/test-local-assets.mjs` — opt-in real-data checks:
  the reference clips decode from `SPAU.PA` with non-silent samples.

## Verification artifacts

```text
node --test tests/ci/app-audio-sfx.test.mjs -> # tests 3 / pass 3
npm run test:unit -> # tests 149 / pass 149 / fail 0
npm run test:browser -> 6 passed (2.3m)
SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 ... npm run test:local:assets ->
  serfbound-local-asset-tests-ok: ... and 39 DOS sound effects ...
```

Manual listening note: with real `SPAU.PA`, panel clicks tick, accepted
builds chime, and the completed-building hammer plays — the clips are the
original 8-bit effects at their DOS pitch.

## Deviations from plan

- The event mapping covers the browser-visible events (commands, popups,
  construction, defeat); per-serf work loops (sawing, mining rhythms) hook
  in with SB-17-03's polish pass where the reference ties them to
  animation frames.

## Follow-ups

- SB-17-02: XMI music parsing and the browser playback decision.
