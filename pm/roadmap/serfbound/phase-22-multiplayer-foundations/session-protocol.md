# Serfbound Session Protocol v1

**Recorded:** 2026-06-10 (SB-22-03). Source of truth:
`serfbound/packages/engine/src/session-protocol.ts`.

## Model

A lockstep session between peers who each run the full simulation.
Messages are JSON texts (one message per transport frame). The wire
carries **world actions and fingerprints only** — never original game
data; every player imports their own assets locally.

## Messages

| Type | Fields | Purpose |
|---|---|---|
| `hello` | `protocolVersion`, `appVersion`, `player`, `settings{seedString,mapSize,playerCount,initialSupplies,playerSupplies}`, `turnTicks`, `inputDelayTurns` | Handshake: peers exchange hellos before any turn executes. |
| `turn` | `player`, `turn`, `actions[]` (SerfboundWorldAction) | One player's complete input bundle for a lockstep turn. Sent every turn, empty or not. |
| `checksum` | `player`, `tick`, `checksum` | Periodic state fingerprint (SB-22-01) for desync detection. |
| `leave` | `player`, `reason` | Clean session end. |

## Handshake verdicts (`verifySessionHandshake`)

Reject reasons, all recoverable with actionable messages:
`protocol-version-mismatch`, `app-version-mismatch` (identical builds
required for determinism), `player-collision`,
`lockstep-config-mismatch`, `settings-mismatch`.

## Decode safety

`decodeSessionMessage` validates structurally and throws
`SessionProtocolError` with a stable `reason`
(`malformed-json`, `malformed-shape`, `malformed-field`,
`malformed-action`, `unknown-type`). Callers catch per message; a
malformed frame never reaches the engine loop. Turn actions validate
through the same `isSerfboundWorldAction` guard the save replay uses.

## Versioning

`sessionProtocolVersion` bumps on any breaking message change; the
handshake rejects across versions. The app version travels separately
because lockstep requires identical simulation builds, not just
compatible wire formats.

## Deferred to Phase 23

Transport framing (WebRTC data channels), reconnect/rejoin handshake,
and desync recovery flows.
