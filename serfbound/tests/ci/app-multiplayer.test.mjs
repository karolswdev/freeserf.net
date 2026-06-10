import assert from "node:assert/strict";
import { test } from "node:test";

import { SerfboundLoopbackMultiplayer } from "@serfbound/app";
import { SerfboundCommandRouter, startSerfboundLocalGame } from "@serfbound/engine";

// SB-22-04: the loopback multiplayer orchestrator — handshake with
// settings adoption, lockstep pumping over a channel pair, and the
// command-router queue path.

const dataSource = {
  kind: "imported-dos-pa-catalog",
  archiveName: "SPAU.PA",
  byteLength: 1_282_805,
  entryCount: 4000,
  definedArchiveEntries: 3805,
  fixupCount: 252,
};

// An in-process channel pair delivering synchronously (loopback is
// reliable and ordered; so is BroadcastChannel on one origin).
function channelPair() {
  const a = { onmessage: null, postMessage: (text) => b.onmessage?.({ data: text }), close() {} };
  const b = { onmessage: null, postMessage: (text) => a.onmessage?.({ data: text }), close() {} };
  return [a, b];
}

const hostSettings = {
  seedString: "1234567812345678",
  mapSize: 3,
  playerCount: 2,
  initialSupplies: 20,
  playerSupplies: null,
};

function createPair() {
  const [hostChannel, joinChannel] = channelPair();
  const ready = [];
  const host = new SerfboundLoopbackMultiplayer({
    role: "host",
    appVersion: "0.1.0",
    settings: hostSettings,
    channel: hostChannel,
    onReady: (settings, player) => ready.push({ side: "host", settings, player }),
  });
  const join = new SerfboundLoopbackMultiplayer({
    role: "join",
    appVersion: "0.1.0",
    // The joiner starts with different local settings and must adopt
    // the host's.
    settings: { ...hostSettings, seedString: "8888888888888888", initialSupplies: 35 },
    channel: joinChannel,
    onReady: (settings, player) => ready.push({ side: "join", settings, player }),
  });
  return { host, join, ready };
}

test("host and join handshake; the joiner adopts the host's settings", () => {
  const { host, join, ready } = createPair();

  assert.equal(host.status.phase, "running");
  assert.equal(join.status.phase, "running");
  assert.equal(ready.length, 2);
  const joinReady = ready.find((entry) => entry.side === "join");
  assert.equal(joinReady.player, 1);
  assert.equal(joinReady.settings.seedString, hostSettings.seedString);
  assert.equal(joinReady.settings.initialSupplies, hostSettings.initialSupplies);
});

test("a version mismatch rejects the session recoverably", () => {
  const [hostChannel, joinChannel] = channelPair();
  const host = new SerfboundLoopbackMultiplayer({
    role: "host",
    appVersion: "0.1.0",
    settings: hostSettings,
    channel: hostChannel,
  });
  const join = new SerfboundLoopbackMultiplayer({
    role: "join",
    appVersion: "0.2.0",
    settings: hostSettings,
    channel: joinChannel,
  });

  assert.equal(host.status.phase, "rejected");
  assert.equal(host.status.rejectReason, "app-version-mismatch");
  assert.notEqual(join.status.phase, "running");
});

test("two pumped peers play one game: castles land on both, checksums agree", () => {
  const { host, join } = createPair();

  // Each side runs its own full simulation from the agreed settings.
  const sides = [
    { mp: host, player: 0 },
    { mp: join, player: 1 },
  ].map(({ mp, player }) => {
    const started = startSerfboundLocalGame({
      data: dataSource,
      seedString: mp.settings.seedString,
      mapSize: mp.settings.mapSize,
      playerCount: mp.settings.playerCount,
      initialSupplies: mp.settings.initialSupplies,
    });
    const router = new SerfboundCommandRouter(started.game.state, started.game.world());
    router.localPlayer = player;
    router.onWorldAction = (action) => mp.submitAction(action);
    return {
      mp,
      router,
      world: started.game.world(),
      engine: started.game.serfEngine(),
      state: started.game.state,
    };
  });

  // Discover castle sites on a probe world (player order = execution
  // order).
  const probe = startSerfboundLocalGame({
    data: dataSource,
    seedString: hostSettings.seedString,
    mapSize: 3,
    playerCount: 2,
    initialSupplies: 20,
  }).game.world();
  let first = null;
  let second = null;
  for (let position = 0; position < probe.tileCount; position += 1) {
    if (first === null) {
      if (probe.buildCastle(position, 0) !== null) {
        first = position;
      }
    } else if (probe.buildCastle(position, 1) !== null) {
      second = position;
      break;
    }
  }

  // Local commands go through the router's lockstep queue path.
  const hostResult = sides[0].router.dispatch({
    type: "game.build-castle",
    source: "pointer",
    tile: { column: first % sides[0].world.columns, row: Math.trunc(first / sides[0].world.columns), position: first },
  });
  assert.equal(hostResult.status, "accepted");
  assert.equal(hostResult.effect, "queued-for-lockstep");
  const joinResult = sides[1].router.dispatch({
    type: "game.build-castle",
    source: "pointer",
    tile: { column: second % sides[1].world.columns, row: Math.trunc(second / sides[1].world.columns), position: second },
  });
  assert.equal(joinResult.effect, "queued-for-lockstep");

  // Neither world mutated yet — the actions wait for their turn.
  assert.equal(sides[0].world.players[0].hasCastle, false);
  assert.equal(sides[1].world.players[1].hasCastle, false);

  // Pump both sides past two checksum cadences.
  for (let step = 0; step < 192; step += 1) {
    for (const side of sides) {
      side.mp.pump({
        state: side.state,
        world: side.world,
        engine: side.engine,
        deltaTicks: 8,
      });
    }
  }

  for (const side of sides) {
    assert.equal(side.world.players[0].hasCastle, true, "host castle on both worlds");
    assert.equal(side.world.players[1].hasCastle, true, "join castle on both worlds");
    assert.equal(side.mp.status.stalled, false);
    assert.equal(side.mp.status.checksumAgreed, true, "checksum streams agree");
    assert.equal(side.mp.status.desyncTick, null);
  }

  // The executed actions recorded into both states (saves keep working).
  assert.equal(sides[0].state.worldActions.length >= 2, true);
  assert.equal(sides[1].state.worldActions.length >= 2, true);
});
