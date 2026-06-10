import assert from "node:assert/strict";
import { test } from "node:test";

import { SerfboundAsyncLoopbackMatch } from "@serfbound/app";
import { startSerfboundLocalGame } from "@serfbound/engine";

// SB-23-04: the two-tab async match — full matches on both sides,
// window moves crossing a channel, each side verifying trustlessly and
// acting at its own pace.

const dataSource = {
  kind: "imported-dos-pa-catalog",
  archiveName: "SPAU.PA",
  byteLength: 1_282_805,
  entryCount: 4000,
  definedArchiveEntries: 3805,
  fixupCount: 252,
};

const settings = {
  seedString: "1234567812345678",
  mapSize: 3,
  playerCount: 2,
  initialSupplies: 20,
  playerSupplies: null,
};

const windowTicks = 512;

function channelPair() {
  const a = { onmessage: null, postMessage: (text) => b.onmessage?.({ data: text }), close() {} };
  const b = { onmessage: null, postMessage: (text) => a.onmessage?.({ data: text }), close() {} };
  return [a, b];
}

function discoverCastleSites() {
  const probe = startSerfboundLocalGame({ data: dataSource, ...settings, playerSupplies: undefined }).game.world();
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

  return { first, second };
}

function playWindowOut(side) {
  for (let step = 0; step < windowTicks / 16 + 2; step += 1) {
    side.tick(16);
  }
}

function recapThrough(side) {
  let frames = 0;
  while (side.status.mode === "recap") {
    side.tick(16);
    frames += 1;
    assert.equal(frames < 200, true, "the recap terminates");
  }
}

test("two async tabs alternate windows with verified checksums", () => {
  const sites = discoverCastleSites();
  const [hostChannel, joinChannel] = channelPair();
  const host = new SerfboundAsyncLoopbackMatch({
    role: "host",
    appVersion: "0.1.0",
    data: dataSource,
    windowTicks,
    settings,
    channel: hostChannel,
  });
  const join = new SerfboundAsyncLoopbackMatch({
    role: "join",
    appVersion: "0.1.0",
    data: dataSource,
    windowTicks,
    // The joiner adopts the host's settings through the handshake.
    settings: { ...settings, seedString: "8888888888888888" },
    channel: joinChannel,
  });

  assert.equal(host.status.mode, "your-window", "window 0 belongs to the host");
  assert.equal(join.status.mode, "awaiting-move");

  // Host plays window 0 (founding its castle); the move crosses the
  // channel at the boundary.
  host.queue({ kind: "build-castle", position: sites.first, player: 0 });
  playWindowOut(host);
  assert.equal(host.status.mode, "awaiting-move");
  assert.equal(join.status.mode, "move-arrived");

  // The joiner picks it up whenever: recap, verify, then their window.
  join.pickup();
  assert.equal(join.status.mode, "recap");
  recapThrough(join);
  assert.equal(join.status.mode, "your-window");
  assert.equal(join.status.failureReason, null);
  assert.equal(join.status.checksum, host.status.checksum, "verified to the same state");
  assert.equal(join.status.digest.players[0].buildingsStarted >= 1, true);

  // The joiner plays window 1; the host recaps it.
  join.queue({ kind: "build-castle", position: sites.second, player: 1 });
  playWindowOut(join);
  assert.equal(host.status.mode, "move-arrived");
  host.pickup();
  recapThrough(host);
  assert.equal(host.status.mode, "your-window");
  assert.equal(host.status.checksum, join.status.checksum);

  // Both castles on both worlds.
  for (const side of [host, join]) {
    assert.equal(side.match.world.players[0].hasCastle, true);
    assert.equal(side.match.world.players[1].hasCastle, true);
  }
});

test("a tampered window move fails verification and surfaces", () => {
  const [hostChannel, joinChannel] = channelPair();
  const host = new SerfboundAsyncLoopbackMatch({
    role: "host",
    appVersion: "0.1.0",
    data: dataSource,
    windowTicks,
    settings,
    channel: hostChannel,
  });
  const join = new SerfboundAsyncLoopbackMatch({
    role: "join",
    appVersion: "0.1.0",
    data: dataSource,
    windowTicks,
    settings,
    channel: joinChannel,
  });

  // Intercept the host's outbound move and corrupt the checksum.
  const original = hostChannel.postMessage;
  hostChannel.postMessage = (text) => {
    if (text.includes("window-move")) {
      const message = JSON.parse(text);
      message.endChecksum = 1;
      original(JSON.stringify(message));
      return;
    }

    original(text);
  };

  playWindowOut(host);
  assert.equal(join.status.mode, "move-arrived");
  join.pickup();
  recapThrough(join);
  assert.equal(join.status.mode, "failed");
  assert.equal(join.status.failureReason, "checksum-mismatch");
});
