import assert from "node:assert/strict";
import { test } from "node:test";

import {
  CorrespondenceMatch,
  decodeSessionMessage,
  encodeSessionMessage,
  resumeCorrespondenceMatch,
  startSerfboundLocalGame,
} from "@serfbound/engine";

// SB-23-01: the turn-window match model — async play as lockstep with
// giant turns, trustlessly re-simulated and checksum-verified.

const dataSource = {
  kind: "imported-dos-pa-catalog",
  archiveName: "SPAU.PA",
  byteLength: 1_282_805,
  entryCount: 4000,
  definedArchiveEntries: 3805,
  fixupCount: 252,
};

const gameOptions = {
  data: dataSource,
  seedString: "1234567812345678",
  mapSize: 3,
  playerCount: 2,
  playerSupplies: [20, 20],
};

const windowTicks = 1024;

function discoverCastleSites() {
  const probe = startSerfboundLocalGame(gameOptions).game.world();
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

function createMatch() {
  return new CorrespondenceMatch({ game: gameOptions, windowTicks });
}

// Play one full window on `active` (issuing the scripted actions),
// transfer the move to `waiting`, and assert agreement.
function playWindow(active, waiting, actions = []) {
  for (const action of actions) {
    active.queue(action);
  }

  active.advance(windowTicks);
  assert.equal(active.windowComplete, true);
  const move = active.takeMove();
  const verdict = waiting.applyMove(move);
  assert.deepEqual(verdict, { ok: true });
  assert.equal(waiting.checksum(), active.checksum());
  return move;
}

test("a match advances window by window to identical checksums", () => {
  const sites = discoverCastleSites();
  const alice = createMatch();
  const bob = createMatch();

  // Window 0 (player 0, played on alice's instance): found the castle.
  playWindow(alice, bob, [{ kind: "build-castle", position: sites.first, player: 0 }]);
  // Window 1 (player 1, played on bob's instance).
  playWindow(bob, alice, [{ kind: "build-castle", position: sites.second, player: 1 }]);
  // Two quiet windows: economies simulate on autopilot.
  playWindow(alice, bob);
  playWindow(bob, alice);

  assert.equal(alice.tick, 4 * windowTicks);
  assert.equal(alice.world.players[0].hasCastle, true);
  assert.equal(alice.world.players[1].hasCastle, true);
  assert.equal(bob.world.players[0].hasCastle, true);
  assert.equal(bob.world.players[1].hasCastle, true);
  assert.equal(alice.activePlayer, 0, "window 4 belongs to player 0 again");
});

test("tampered and rules-invalid moves reject and restore the match", () => {
  const sites = discoverCastleSites();
  const alice = createMatch();
  const bob = createMatch();
  playWindow(alice, bob, [{ kind: "build-castle", position: sites.first, player: 0 }]);

  const checksumBefore = bob.checksum();
  bob.queue({ kind: "build-castle", position: sites.second, player: 1 });
  bob.advance(windowTicks);
  const honest = bob.takeMove();

  // 1. Checksum tampering: claim a different end state.
  const tamperedChecksum = { ...honest, endChecksum: (honest.endChecksum ^ 0xff) >>> 0 };
  const verdict1 = alice.applyMove(tamperedChecksum);
  assert.equal(verdict1.ok, false);
  assert.equal(verdict1.reason, "checksum-mismatch");
  assert.equal(alice.checksum(), checksumBefore, "alice restored to the window start");

  // 2. Commanding the opponent's units: actions must carry the active
  // player.
  const wrongPlayer = {
    ...honest,
    actions: [{ tick: honest.endTick - 8, action: { kind: "build-flag", position: 0, player: 0 } }],
  };
  const verdict2 = alice.applyMove(wrongPlayer);
  assert.equal(verdict2.ok, false);
  assert.equal(verdict2.reason, "invalid-action");

  // 3. A rules-violating action (a castle on an occupied site) rejects
  // as rules-rejected.
  const illegal = {
    ...honest,
    actions: [
      ...honest.actions,
      { tick: honest.endTick, action: { kind: "build-castle", position: sites.first, player: 1 } },
    ],
  };
  const verdict3 = alice.applyMove(illegal);
  assert.equal(verdict3.ok, false);
  assert.equal(verdict3.reason, "rules-rejected");

  // 4. The honest move still applies cleanly afterwards.
  const verdict4 = alice.applyMove(honest);
  assert.deepEqual(verdict4, { ok: true });
  assert.equal(alice.checksum(), bob.checksum());
});

test("out-of-turn and wrong-window moves reject without simulation", () => {
  const sites = discoverCastleSites();
  const alice = createMatch();
  const bob = createMatch();
  const move = playWindow(alice, bob, [
    { kind: "build-castle", position: sites.first, player: 0 },
  ]);

  // Replaying the same window again is wrong-window.
  const verdict = bob.applyMove(move);
  assert.equal(verdict.ok, false);
  assert.equal(verdict.reason, "wrong-window");

  // A move claiming the wrong player rejects.
  const wrongPlayer = { ...move, window: 1, endTick: 2 * windowTicks, player: 0 };
  const verdict2 = bob.applyMove(wrongPlayer);
  assert.equal(verdict2.ok, false);
  assert.equal(verdict2.reason, "wrong-player");
});

test("a match resumes anywhere by replaying the accepted history", () => {
  const sites = discoverCastleSites();
  const alice = createMatch();
  const bob = createMatch();
  playWindow(alice, bob, [{ kind: "build-castle", position: sites.first, player: 0 }]);
  playWindow(bob, alice, [{ kind: "build-castle", position: sites.second, player: 1 }]);
  playWindow(alice, bob);
  playWindow(bob, alice);

  const begin = performance.now();
  const { match: resumed, verdict } = resumeCorrespondenceMatch(
    { game: gameOptions, windowTicks },
    alice.moves,
  );
  const elapsedMs = performance.now() - begin;

  assert.deepEqual(verdict, { ok: true });
  assert.equal(resumed.tick, alice.tick);
  assert.equal(resumed.checksum(), alice.checksum());
  // Resume-by-replay stays well inside the interactive budget (the
  // engine replays hundreds of thousands of ticks per second).
  assert.equal(elapsedMs < 2000, true, `resume took ${elapsedMs.toFixed(0)}ms`);
});

test("the window-move message round-trips on the session protocol", () => {
  const message = {
    type: "window-move",
    player: 1,
    window: 3,
    endTick: 4096,
    endChecksum: 0x12345678,
    actions: [
      { tick: 3100, action: { kind: "build-flag", position: 777, player: 1 } },
      {
        tick: 3500,
        action: { kind: "build-road", start: 777, directions: ["Right", "Down"], player: 1 },
      },
    ],
  };
  const encoded = encodeSessionMessage(message);
  const decoded = decodeSessionMessage(encoded);
  assert.deepEqual(decoded, message);
  assert.equal(encodeSessionMessage(decoded), encoded);

  // A malformed stamped action rejects recoverably.
  assert.throws(() =>
    decodeSessionMessage(
      '{"type":"window-move","player":1,"window":0,"endTick":64,"endChecksum":1,"actions":[{"tick":1,"action":{"kind":"cast-fireball"}}]}',
    ),
  );
});
