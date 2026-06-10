# Evidence — SB-18-05 — Speed, Autosave, and the Played-Mission Gate

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/app/src/main.ts` — game speed (keys 0/1/2/4 pause
  or scale the sim ticks per frame; `data-serfbound-game-speed`) and
  autosave (the running session snapshots to the save store every 512
  sim ticks; `data-serfbound-autosave-count`).
- `serfbound/tests/browser/decoded-scene.spec.ts` — the e2e proves the
  session autosaved during construction, the speed keys change the
  multiplier, pause freezes the game tick, and play resumes.

## Verification artifacts

```text
npm run test:unit -> # tests 169 / pass 169 / fail 0
npm run test:browser -> 6 passed (1.8m)
mission soak (ACORN, human + AI, headless):
  soak-ok: 2,000,000 ticks in 0.5s; heap 5.6MB -> 5.5MB;
  AI buildings 18; serfs 11; decisions 17
played mission (real SPAU.PA, 90s live):
  played-mission-ok: {"tick":"8288","autosaves":"16","serfs":"10","ai":"1"}
  saved artifacts/sb-18-05-played-mission-desktop.png,
        artifacts/sb-18-05-played-mission-minimap.png
```

Long-session facts: 2M ticks (a multi-hour session at game speed)
simulate in 0.5 s with FLAT heap (5.6 → 5.5 MB) — no leak signal; the AI
finished 18 buildings and the serf population stayed bounded. The live
90-second mission autosaved 16 times while the AI drove its settlement.

## Deviations from plan

- Speed control is keyboard-driven (0/1/2/4); the panel's tiny speed
  buttons join the Phase 19 ergonomics pass with the volume steppers.
- The autosave writes to the standard save slot (the original's behavior
  of rotating autosave slots is recorded for the Phase 19 persistence
  polish).

## Follow-ups

- Phase 19: browser experience (performance, mobile, PWA).
