# Evidence — SB-22-03 — Session Wire Protocol

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/engine/src/session-protocol.ts` — the versioned
  wire form: `hello` (protocol/app version, player, deterministic game
  settings, lockstep config), `turn` (bundles), `checksum`, `leave`;
  `encodeSessionMessage`/`decodeSessionMessage` with strict structural
  validation throwing recoverable `SessionProtocolError`s (stable
  reasons; world actions validate through the same guard the save
  replay uses); `verifySessionHandshake` rejecting protocol, app
  version, player-collision, lockstep-config, and settings mismatches;
  bundle↔message bridges to the SB-22-02 session.
- `serfbound/packages/engine/src/index.ts` — exports.
- `pm/roadmap/serfbound/phase-22-multiplayer-foundations/session-protocol.md`
  — the protocol record (design handoff).
- `serfbound/tests/ci/engine-session-protocol.test.mjs` — round-trip,
  rejection, malformed-input, and wire-driven lockstep fixtures.

## Verification artifacts

```text
npm run test:ci -> # tests 193 / pass 193 / fail 0; 10 passed (1.7m)
node --test tests/ci/engine-session-protocol.test.mjs ->
  ok 1 - every session message kind round-trips byte-exactly
  ok 2 - handshake rejects version, config, and settings mismatches
  ok 3 - malformed messages throw recoverable protocol errors
  ok 4 - the lockstep peers agree when every bundle crosses the wire encoded
```

- Round-trip: all four message kinds decode to deep-equal values and
  re-encode byte-identically.
- Rejection matrix: six mismatch cases each return ok=false with the
  expected stable reason and a human message.
- Malformed inputs (broken JSON, wrong shapes, unknown types, bad
  field types, unrecognized world actions, invalid seeds) all throw
  `SessionProtocolError` — never an engine crash.
- The SB-22-02 two-peer game re-driven with every bundle passing
  through encode→string→decode finishes with identical full-state
  fingerprints and the castle standing on both worlds.

## Deviations from plan

- The handshake requires identical app versions, stricter than
  "compatible": lockstep correctness depends on identical simulation
  builds, so version compatibility windows are deliberately not
  attempted.
- JSON texts (not a binary format): bundle payloads are tiny and
  WebRTC data channels carry strings natively; a binary encoding is a
  measurable optimization left unbuilt.

## Follow-ups

- SB-22-04: the two-tab loopback gate wires session + protocol into
  the shell.
