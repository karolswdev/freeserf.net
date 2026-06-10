# Evidence — SB-17-03 — Audio Settings, Hooks, and Polish

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/app/src/audio.ts` — persistent settings
  (`loadAudioSettings`/`saveAudioSettings` over a storage adapter, corrupt
  entries degrade to defaults), `applySettings`/`settings` round-trip on
  the service (muting music stops it), and tab-visibility handling
  (`setVisible` suspends/resumes the context, safe in every state).
- `serfbound/packages/engine/src/serfs.ts` — `onProduct` production hook:
  `#emitProduct` reports every product with its building type, giving the
  app the reference work-loop sound moments without an event bus.
- `serfbound/packages/app/src/main.ts` — the work-loop mapping (products
  to the clips of the labor that made them: tree fall for lumber, sawing
  for planks, pick blows for stone and ores, mowing for wheat, mill
  grinding, pig oink, gold boils for smelting, metal hammering for
  weapons; throttled to one clip per 700 ms); persisted settings load at
  mount; the sett popup's audio row toggles SFX/MUSIC mute, saves, and
  resumes music on unmute; visibilitychange wires `setVisible`.
- `serfbound/packages/app/src/popup.ts` /
  `landscape-scene.ts` — the sett popup shows the live `SFX ON/OFF MUSIC
  ON/OFF` row in the game font with hit-tested halves.
- `serfbound/tests/ci/app-audio-settings.test.mjs` — storage round-trip
  with corrupt-entry fallback, muted services staying silent and
  observable, the audio row hit tests, and visibility safety in every
  state.
- `serfbound/tests/browser/decoded-scene.spec.ts` — the e2e mutes music
  from the sett popup, verifies the persisted localStorage record, and
  unmutes back to playing.

## Verification artifacts

```text
node --test tests/ci/app-audio-settings.test.mjs -> # tests 4 / pass 4
npm run test:unit -> # tests 156 / pass 156 / fail 0
npm run test:browser -> 6 passed (2.1m)
```

Manual listening note: with real `SPAU.PA`, work sounds follow production
(the axe falls when lumber emerges, the saw sings at the sawmill), the
music pauses with the hidden tab and resumes on return, and the mute
choices survive a reload.

## Deviations from plan

- Volume is persisted and applied (gain-scaled) but the UI exposes mute
  toggles only; volume steppers join the Phase 19 polish pass with its
  ergonomics review.
- Music does not auto-loop yet (recorded; Phase 19 polish).

## Follow-ups

- Phase 18 (the complete game): missions, AI, original saves.
