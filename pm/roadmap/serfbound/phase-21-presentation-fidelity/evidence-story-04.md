# Evidence — SB-21-04 — Touch Gestures

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/app/src/gestures.ts` — the gesture state machine
  as pure event-in/action-out logic: `PointerGestureTracker` tracks
  pointers, emits pinch steps (distance ratio past 1.25x/0.8x, rebasing
  so a long pinch steps repeatedly, with the gesture midpoint) and
  midpoint pan deltas, recognizes a secondary touch regardless of
  listener registration order, and manages click suppression so a
  gesture's trailing synthesized tap never acts while plain taps always
  do.
- `serfbound/packages/app/src/main.ts` — wiring: a second finger cancels
  single-finger drag and enters gesture mode; two-finger pan scrolls
  with the same tile-step math as drag (fractional remainder carried);
  pinch steps the world view scale keeping the map tile under the
  gesture midpoint stationary (`stepViewScaleAt`, wrap-normalized);
  touch defers actions to pointerup (tap = quick down/up within 12px
  slop) so a gesture's first finger no longer fires build actions — a
  real hazard before: pinching on a fresh game could place the castle;
  500ms press-and-hold runs the tile-inspect path (never a build) and
  exposes `data-serfbound-long-press`; mouse input keeps acting on
  pointerdown unchanged.
- `serfbound/docs/player-guide.md` — touch controls documented;
  `npm run test:docs` passes.
- Tests: `tests/ci/app-gestures.test.mjs` (pinch thresholds + rebase,
  midpoint pan deltas, click-suppression lifecycle, listener-order
  independence); `tests/browser/mobile-play.spec.ts` extends the phone
  e2e with synthetic touch PointerEvents: pinch steps the view scale
  3→2, two-finger pan changes the scroll, long-press sets the inspect
  state, and single-finger play still works after gestures.

## Verification artifacts

```text
npm run test:ci -> # tests 181 / pass 181 / fail 0; 10 passed (1.4m)
npm run test:docs -> serfbound-docs-ok
npm run test:local:assets -> serfbound-local-asset-tests-ok (real SPAU.PA)
```

## Deviations from plan

- Touch taps now act on pointerup (with slop), not pointerdown — the
  necessary change for gesture disambiguation, and it also stops a
  touch drag from selecting a tile at its start. Mouse behavior is
  untouched.
- Pinch zoom steps the integer view scales (no continuous zoom),
  matching the SB-21-03 scale model.
- Device evidence is the phone-profile e2e (deviceScaleFactor 3,
  synthetic touch pointers); the SB-21-05 gate captures the visual
  artifacts.

## Follow-ups

- SB-21-05: the visual fidelity gate closes the phase.
