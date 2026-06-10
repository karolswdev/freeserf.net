# Serfbound Post-Launch Roadmap — decision record

**Recorded:** 2026-06-10.

## Multiplayer (the headline track) — transport decision

**Decision: WebRTC data channels with a minimal signaling relay,
deterministic lockstep over the existing world-action log.**

- The engine is already deterministic and replays world actions — the
  exact payload lockstep needs. Two peers exchanging world actions with
  tick stamps replay identical games (the AI already proves the
  replay-equivalence property).
- WebRTC keeps gameplay traffic peer-to-peer (no hosted game servers, no
  data custody); the only hosted piece is a tiny signaling endpoint
  (or manual copy-paste signaling for a zero-server start).
- Rejected: a relay game server (hosting cost + custody of game traffic
  for a GPL community project) and raw WebSockets-only (needs the same
  server, without the P2P payoff).
- Stop signal: if NAT traversal failure rates exceed ~15% in the field,
  add a TURN relay option.

## Amiga data support

Evaluate after launch against a real Amiga corpus: the decode layer is
isolated in `@serfbound/assets`, so Amiga formats land as parallel
decoders behind the same typed catalog. No commitment until corpus
parity tests exist (the same standard the DOS path met).

## Localization

The original glyph set covers A–Z plus umlauts; string extraction comes
first (UI strings already concentrate in the chrome modules), then
per-language string tables. Original-data fonts limit the alphabet;
extended scripts would need a recorded font decision.

## Polish backlog (from phase records)

Pinch-zoom, mission-list popup, volume steppers, music looping, autosave
slots, raster PWA icons, sampled-synth evaluation, war UI with the
reference attack rings, real-.SAV corpus parity, PYRDACOR seed ctor.
