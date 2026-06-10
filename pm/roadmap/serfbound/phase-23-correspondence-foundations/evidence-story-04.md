# Evidence — SB-23-04 — Async Play Gate

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/app/src/async-match.ts` —
  `SerfboundAsyncLoopbackMatch`: each tab runs its own full
  CorrespondenceMatch; window moves cross the loopback channel (the
  Phase 24 mailbox's stand-in) as `window-move` protocol messages;
  modes waiting-peer → your-window/awaiting-move → move-arrived →
  recap → your-window; tampered moves fail verification recoverably;
  the handshake reuses the session hellos (the joiner adopts the host's
  settings; state flips before the confirming hello — synchronous
  transports re-enter handlers, a real bug the in-process tests
  caught).
- `serfbound/packages/app/src/main.ts` — "Async 2P host/join" controls,
  the async timer branch (whose-turn notices, Enter pickup), and the
  `data-serfbound-cor-*` attributes including the verified
  window-boundary checksum (`cor-boundary`) — the stable cross-tab
  comparison while live ticks advance independently.
- `serfbound/packages/app/src/styles.css` — the shell caps at viewport
  height with the status panel scrolling its own overflow: the growing
  action list had pushed the map below the fold, which broke real-mouse
  hover in e2e and would have annoyed every player with a small screen.
- `serfbound/scripts/capture-local-screenshots.mjs` — the visual gate
  captures the hot-seat window and hand-over screens from real data.
- Tests: `tests/ci/app-async-match.test.mjs` (alternating verified
  windows over a channel pair; tampered move fails with
  checksum-mismatch); `tests/browser/hotseat-play.spec.ts` (the
  hot-seat gate: window → handover+countdown → Enter → recap → next
  player, both players found castles, digests shown, no verification
  failures, window index 2 reached); `tests/browser/async-play.spec.ts`
  (the two-tab gate: handshake, host plays window 0, joiner picks up at
  its own pace, recap+verify, joiner plays window 1, host recaps,
  identical boundary checksums, no failures).

## Verification artifacts

```text
npm run test:unit -> # tests 208 / pass 208 / fail 0
npx playwright test -> 13 passed — three consecutive full-suite runs
npm run test:local:assets -> serfbound-local-asset-tests-ok
npm run check:boundaries -> serfbound-boundaries-ok
npm run test:docs -> serfbound-docs-ok
npm run test:release:static -> serfbound-static-hosting-ok
npm run capture:local:screenshots -> ok; phase artifacts include
  capture-hotseat-window.png and capture-hotseat-handover.png
  ("PLAYER 2 PRESS ENTER - 60" in the shadowed game font over the
  live world)
```

The gate specs run in ~16 seconds together: a hot-seat match and a
two-tab async match each play multiple alternating windows with every
move crossing the trustless verify path.

## Deviations from plan

- "Several windows each" reads as multiple alternating windows per
  match (two full cycles asserted per spec; window index 2 reached) —
  the per-window mechanics are identical thereafter and the CI fixtures
  run four windows.
- The shell-height layout fix surfaced here (the e2e hover regression
  was the symptom); recorded as part of this story rather than a
  separate one.

## Follow-ups

- Phase 24: registration, challenges, and the real turn mailbox with
  deadlines give this exact flow its online home.
