# Serfbound Changelog

## serfbound-v0.1.0 — 2026-06-10

The first public release: the complete classic game, browser-native,
playing from the user's own original data.

- **World**: the classic map generator with tile-for-tile fixture parity;
  authentic decoded terrain, objects, borders, and waves.
- **Settlements**: castle founding, flags, pathfinder roads, serf-driven
  construction at reference material costs.
- **Serfs**: the reference state machine (tick/counter, walking
  animations, collision waiting, waiting-swap), transporters, builders,
  and the profession workers.
- **Economy**: every classic chain (wood, stone, food, meat, mining,
  metallurgy, tools, weapons) with demand-driven dispatch and lossless
  transport over the road network.
- **Conquest**: knight recruitment on gold morale, garrisons growing
  borders through the reference influence tables, exact SetFightOutcome
  combat parity, capture, defeat, and game over.
- **Interface**: the original UI rebuilt from decoded art — game font,
  icons, panel bar, build/stats/sett popups, minimap, notifications, and
  the start screen with the decoded logo.
- **Sound**: all 39 DOS clips with exact ConvertToWav parity and XMI
  music through a WebAudio synth, gesture-gated, with persistent mutes.
- **The complete game**: the 31-mission campaign, classic AI opponents
  (replayable world actions), original DOS savegame parsing, game
  speeds, and autosave.
- **Browser experience**: measured scale headroom, touch play, an
  installable offline-capable PWA, onboarding, and accessibility.

No original game data is bundled, hosted, or cached — players import
their own `SPAU.PA`, which never leaves their device.
