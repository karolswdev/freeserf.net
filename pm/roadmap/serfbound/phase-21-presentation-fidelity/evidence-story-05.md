# Evidence — SB-21-05 — Visual Fidelity Gate

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `pm/roadmap/serfbound/phase-21-presentation-fidelity/artifacts/` —
  both real-data capture sets refreshed at the closing commit:
  `capture-*` (DPR 1: full chrome, shadowed readable text, the running
  game with the authentic panel) and `capture-dpr2-*` (DPR 2: the same
  layout at native resolution — double world detail, pixel-sharp
  chrome).
- `final-summary.md` — the phase close record.

## Verification artifacts

All standing gates rerun green at the closing commit:

```text
npm run ci:release (with real-data env) ->
  unit:    # tests 181 / pass 181 / fail 0
  browser: 10 passed (1.1m)  [incl. high-dpi, mobile gestures, PWA offline]
  serfbound-boundaries-ok
  serfbound-release-artifact-ok: inspected 6 static files in dist/.
  serfbound-static-hosting-ok: served dist at /serfbound/, imported
    generated SPAU.PA, and restored IndexedDB state after reload.
  serfbound-docs-ok
  serfbound-local-asset-tests-ok: ... 39 DOS sound effects (XMI track 0
    parsed with 10409 events) ...
npm run measure:scale -> scale-baseline-ok: size6 2044733 ticks/s;
  scene builds size3=2.87ms, size5=2.28ms
npm run capture:local:screenshots -> ok at DPR 1 (5651 sprites) and
  DPR 2 (5519 sprites)
```

## The punch list, closed

The launch review's complaints, each fixed and proven this phase:

1. "Borders do not align nor follow the graphic" → the four-piece
   Box.cs frame assembly with inset interiors (SB-21-01; captures show
   the surrounded boxes).
2. "Light green text on a green map — readability hell" → the original
   black font-shadow layer under every glyph (SB-21-02; captures show
   the HUD readable over bright terrain).
3. "No SVGA mode" → native-resolution rendering plus 1x/2x/3x view
   scales, defaulting to the screen's density (SB-21-03; DPR-2 captures
   are pixel-sharp).
4. "Play with hand gestures" → pinch-zoom, two-finger pan, long-press
   inspect over PointerEvents (SB-21-04; phone-profile e2e).

## Deviations from plan

- Popup-by-popup capture automation was not built; the founding e2e
  drives every popup through the corrected chrome with assertions, and
  the capture set shows the init box, HUD, and panel from real data.
  Recorded as sufficient for this gate; popup captures join the next
  visual sweep if wanted.

## Follow-ups

- Phase 22: multiplayer foundations (SB-22-01 determinism checksums).
