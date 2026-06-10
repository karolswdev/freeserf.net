# Evidence — SB-19-05 — Onboarding, Accessibility, and Settings

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/app/src/main.ts` — first-run onboarding: a visible
  banner walks the import steps (locate your SPAU.PA → import locally →
  START) and steps aside once data is imported; an `aria-live` region
  announces game notifications to assistive tech; keyboard play gains
  Enter-to-start from the title screen (joining arrows-scroll and the
  0/1/2/4 speed keys); a status-text ownership fix the new layout
  surfaced (re-renders no longer clobber the running-game summary).
- `serfbound/packages/app/src/styles.css` — the standard visually-hidden
  utility for the live region.
- `serfbound/docs/player-guide.md` — the player guide now documents the
  original-interface controls (title screen, panel bar, popups), keyboard
  play, autosave, sound/music gesture + mute persistence, and
  PWA/offline behavior; `npm run test:docs` passes.
- `serfbound/tests/browser/decoded-scene.spec.ts` — the e2e proves the
  onboarding banner shows pre-import and hides post-import, and the
  live region announces "BUILDING COMPLETE" when construction finishes.

## Verification artifacts

```text
npm run test:browser -> 8 passed (1.9m)
npm run test:unit -> # tests 171 / pass 171 / fail 0
npm run test:docs -> serfbound-docs-ok
```

Accessibility audit summary (against the Phase 8 matrix):
- Keyboard: full pre-game flow (Enter starts), map scroll (arrows),
  speed/pause (0/1/2/4), shell controls tabbable with visible focus.
- Screen readers: canvas labeled, live notifications, onboarding as a
  `role=note`, status panel semantic text throughout.
- Contrast/reduced motion: the Phase 8 positions still hold (waves stop
  under prefers-reduced-motion; panel text on dark meets contrast).

## Deviations from plan

- Settings live where they act (audio in the sett popup, speed on keys);
  a unified settings popup is recorded for the post-launch backlog with
  the volume steppers and mission list UI.

## Follow-ups

- Phase 20: launch and operations.
