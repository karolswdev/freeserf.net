import assert from "node:assert/strict";
import { test } from "node:test";

import {
  LockstepSession,
  SessionProtocolError,
  bundleFromTurnMessage,
  computeGameChecksum,
  decodeSessionMessage,
  encodeSessionMessage,
  sessionProtocolVersion,
  startSerfboundLocalGame,
  turnMessageFromBundle,
  verifySessionHandshake,
} from "@serfbound/engine";

// SB-22-03: the session wire protocol — round-trip exactness, mismatch
// rejection, malformed-input safety, and the SB-22-02 peers re-driven
// over encoded strings.

const dataSource = {
  kind: "imported-dos-pa-catalog",
  archiveName: "SPAU.PA",
  byteLength: 1_282_805,
  entryCount: 4000,
  definedArchiveEntries: 3805,
  fixupCount: 252,
};

const settings = {
  data: dataSource,
  seedString: "1234567812345678",
  mapSize: 3,
  playerCount: 2,
  playerSupplies: [20, 20],
};

function helloFor(player) {
  return {
    type: "hello",
    protocolVersion: sessionProtocolVersion,
    appVersion: "0.1.0",
    player,
    settings: {
      seedString: settings.seedString,
      mapSize: settings.mapSize,
      playerCount: settings.playerCount,
      initialSupplies: 20,
      playerSupplies: settings.playerSupplies,
    },
    turnTicks: 64,
    inputDelayTurns: 2,
  };
}

test("every session message kind round-trips byte-exactly", () => {
  const messages = [
    helloFor(0),
    {
      type: "turn",
      player: 1,
      turn: 7,
      actions: [
        { kind: "build-castle", position: 1234, player: 1 },
        { kind: "build-road", start: 10, directions: ["Right", "DownRight"], player: 1 },
      ],
    },
    { type: "checksum", player: 0, tick: 4096, checksum: 0xdeadbeef },
    { type: "leave", player: 1, reason: "player-quit" },
  ];

  for (const message of messages) {
    const encoded = encodeSessionMessage(message);
    const decoded = decodeSessionMessage(encoded);
    assert.deepEqual(decoded, message);
    assert.equal(encodeSessionMessage(decoded), encoded, "re-encode is byte-identical");
  }
});

test("handshake rejects version, config, and settings mismatches", () => {
  const local = helloFor(0);
  assert.deepEqual(verifySessionHandshake(local, helloFor(1)), { ok: true });

  const cases = [
    [{ ...helloFor(1), protocolVersion: 2 }, "protocol-version-mismatch"],
    [{ ...helloFor(1), appVersion: "0.2.0" }, "app-version-mismatch"],
    [helloFor(0), "player-collision"],
    [{ ...helloFor(1), inputDelayTurns: 3 }, "lockstep-config-mismatch"],
    [
      { ...helloFor(1), settings: { ...helloFor(1).settings, seedString: "8888888888888888" } },
      "settings-mismatch",
    ],
    [
      { ...helloFor(1), settings: { ...helloFor(1).settings, playerSupplies: [20, 35] } },
      "settings-mismatch",
    ],
  ];
  for (const [remote, reason] of cases) {
    const verdict = verifySessionHandshake(local, remote);
    assert.equal(verdict.ok, false);
    assert.equal(verdict.reason, reason);
    assert.equal(typeof verdict.message, "string");
  }
});

test("malformed messages throw recoverable protocol errors", () => {
  const malformed = [
    "not json at all",
    "42",
    '{"type":"warp-drive"}',
    '{"type":"checksum","player":0,"tick":"soon","checksum":1}',
    '{"type":"turn","player":0,"turn":1,"actions":[{"kind":"summon-dragon"}]}',
    '{"type":"hello","protocolVersion":1,"appVersion":"0.1.0","player":0,"turnTicks":64,"inputDelayTurns":2,"settings":{"seedString":"9999","mapSize":3,"playerCount":2,"initialSupplies":20,"playerSupplies":null}}',
    '{"type":"leave","player":0,"reason":7}',
  ];
  for (const text of malformed) {
    assert.throws(
      () => decodeSessionMessage(text),
      (error) => error instanceof SessionProtocolError && typeof error.reason === "string",
      `rejects: ${text.slice(0, 40)}`,
    );
  }
});

test("the lockstep peers agree when every bundle crosses the wire encoded", () => {
  // Discover a valid castle site for player 0.
  const probe = startSerfboundLocalGame(settings).game.world();
  let site = null;
  for (let position = 0; position < probe.tileCount && site === null; position += 1) {
    if (probe.buildCastle(position, 0) !== null) {
      site = position;
    }
  }

  const peers = [0, 1].map((player) => {
    const started = startSerfboundLocalGame(settings);
    return {
      world: started.game.world(),
      engine: started.game.serfEngine(),
      session: new LockstepSession({
        localPlayer: player,
        players: [0, 1],
        turnTicks: 64,
        inputDelayTurns: 2,
      }),
    };
  });

  const totalTurns = 64;
  for (let step = 0; step < totalTurns; step += 1) {
    for (const peer of peers) {
      if (peer.session.localPlayer === 0 && peer.session.localTurn === 1) {
        peer.session.submit({ kind: "build-castle", position: site, player: 0 });
      }

      const bundle = peer.session.completeTurn();
      // The wire: encode -> string -> decode -> receive on the other peer.
      const wireText = encodeSessionMessage(turnMessageFromBundle(bundle));
      const received = decodeSessionMessage(wireText);
      assert.equal(received.type, "turn");
      for (const other of peers) {
        if (other !== peer) {
          other.session.receive(bundleFromTurnMessage(received));
        }
      }
    }

    for (const peer of peers) {
      while (
        peer.session.executedTurn < Math.min(step, totalTurns - 1) &&
        peer.session.readyThroughTurn() > peer.session.executedTurn
      ) {
        peer.session.executeNextTurn(peer.world);
        const startTick = peer.session.turnStartTick(peer.session.executedTurn);
        for (let tick = startTick + 16; tick <= startTick + 64; tick += 16) {
          peer.engine.update(tick);
        }
      }
    }
  }

  const fingerprints = peers.map((peer) =>
    computeGameChecksum({ world: peer.world, serfEngine: peer.engine }),
  );
  assert.equal(fingerprints[0], fingerprints[1]);
  assert.equal(peers[0].world.players[0].hasCastle, true);
  assert.equal(peers[1].world.players[0].hasCastle, true);
});
