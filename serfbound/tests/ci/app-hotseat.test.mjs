import assert from "node:assert/strict";
import { test } from "node:test";

import { HotseatController } from "@serfbound/app";
import { startSerfboundLocalGame } from "@serfbound/engine";

// SB-23-03: the hot-seat turn flow — your-window → handover (countdown)
// → recap (trustless verify) → the next player's window.

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

const windowTicks = 512;

function castleSite() {
  const probe = startSerfboundLocalGame(gameOptions).game.world();
  for (let position = 0; position < probe.tileCount; position += 1) {
    if (probe.buildCastle(position, 0) !== null) {
      return position;
    }
  }

  throw new Error("no castle site");
}

test("the turn flow walks your-window, handover, recap, next window", () => {
  let clock = 0;
  const controller = new HotseatController({
    game: gameOptions,
    windowTicks,
    pickupSeconds: 30,
    now: () => clock,
  });

  assert.equal(controller.mode, "your-window");
  assert.equal(controller.activePlayer, 0);

  // Player 1 founds a castle and plays out the window.
  controller.queue({ kind: "build-castle", position: castleSite(), player: 0 });
  for (let step = 0; step < windowTicks / 16; step += 1) {
    controller.tick(16);
  }

  assert.equal(controller.mode, "handover", "the window boundary hands the seat over");
  assert.equal(controller.activePlayer, 1, "the seat belongs to player 2 now");

  // The countdown runs on the injected clock; ticking the controller in
  // handover does not advance the game.
  assert.equal(controller.countdownSeconds, 30);
  clock += 12_000;
  controller.tick(16);
  assert.equal(controller.countdownSeconds, 18);
  assert.equal(controller.pickupExpired, false);

  // Commands cannot leak in while waiting.
  controller.queue({ kind: "build-flag", position: 0, player: 1 });
  assert.equal(controller.mode, "handover");

  // Pickup starts the recap: the verify match re-simulates the window
  // chunk by chunk while the shell renders it.
  controller.pickup();
  assert.equal(controller.mode, "recap");
  assert.equal(controller.renderMatch, controller.verify, "the recap renders the verifier");
  let recapFrames = 0;
  while (controller.mode === "recap") {
    controller.tick(16);
    recapFrames += 1;
    assert.equal(recapFrames < 100, true, "the recap terminates");
  }

  assert.equal(recapFrames >= 2, true, "the recap spans frames");
  assert.equal(controller.mode, "your-window");
  assert.equal(controller.failureReason, null);
  assert.equal(controller.renderMatch, controller.live);
  assert.equal(controller.verify.checksum(), controller.live.checksum(), "verified in lockstep");

  // The digest reflects the watched window.
  const digest = controller.lastDigest;
  assert.notEqual(digest, null);
  assert.equal(digest.window, 0);
  assert.equal(digest.players[0].buildingsStarted >= 1, true);

  // Player 2's window plays the same way.
  for (let step = 0; step < windowTicks / 16; step += 1) {
    controller.tick(16);
  }

  assert.equal(controller.mode, "handover");
  assert.equal(controller.activePlayer, 0, "back to player 1");
});

test("the pickup countdown expires to zero and flags it", () => {
  let clock = 0;
  const controller = new HotseatController({
    game: gameOptions,
    windowTicks,
    pickupSeconds: 5,
    now: () => clock,
  });
  for (let step = 0; step < windowTicks / 16; step += 1) {
    controller.tick(16);
  }

  assert.equal(controller.mode, "handover");
  clock += 60_000;
  assert.equal(controller.countdownSeconds, 0);
  assert.equal(controller.pickupExpired, true);
  // Expiry surfaces only — enforcement (forfeit) is the Phase 24
  // mailbox's job; pickup still works.
  controller.pickup();
  assert.equal(controller.mode, "recap");
});
