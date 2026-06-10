import assert from "node:assert/strict";
import { test } from "node:test";

import { createRecapDriver, digestLines } from "@serfbound/app";
import { mapCharacterToGlyphIndex } from "@serfbound/assets";
import { CorrespondenceMatch, startSerfboundLocalGame } from "@serfbound/engine";

// SB-23-02: window digests and the frame-driven recap replay.

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

function castleSite() {
  const probe = startSerfboundLocalGame(gameOptions).game.world();
  for (let position = 0; position < probe.tileCount; position += 1) {
    if (probe.buildCastle(position, 0) !== null) {
      return position;
    }
  }

  throw new Error("no castle site");
}

test("the recap driver replays a window in frame chunks to the verified end", () => {
  const site = castleSite();
  const alice = new CorrespondenceMatch({ game: gameOptions, windowTicks });
  const bob = new CorrespondenceMatch({ game: gameOptions, windowTicks });

  alice.queue({ kind: "build-castle", position: site, player: 0 });
  alice.advance(windowTicks);
  const move = alice.takeMove();

  const start = createRecapDriver(bob, move, 128);
  assert.equal(start.ok, true);
  const driver = start.driver;

  // The replay progresses chunk by chunk — the shell renders between
  // these calls.
  let frames = 0;
  while (!driver.advanceFrame()) {
    frames += 1;
    assert.equal(driver.tick > 0 && driver.tick < windowTicks, true);
  }

  assert.equal(frames >= 6, true, "the recap spans multiple frames");
  const verdict = driver.finish();
  assert.deepEqual(verdict, { ok: true });
  assert.equal(bob.checksum(), alice.checksum());

  // Both sides derive the identical digest, and it reflects the window:
  // player 1 (index 0) founded a castle — buildings and land appear.
  assert.deepEqual(bob.lastWindowDigest, alice.lastWindowDigest);
  const digest = bob.lastWindowDigest;
  assert.equal(digest.window, 0);
  assert.equal(digest.activePlayer, 0);
  const founder = digest.players[0];
  assert.equal(founder.buildingsStarted >= 1, true, "the castle counts as started");
  assert.equal(founder.landAreaDelta > 0, true, "the castle claims land");
  const idle = digest.players[1];
  assert.deepEqual(
    [idle.buildingsStarted, idle.flagsBuilt, idle.landAreaDelta],
    [0, 0, 0],
    "the waiting player's empire is untouched",
  );
});

test("a tampered move fails at finish and the match restores", () => {
  const site = castleSite();
  const alice = new CorrespondenceMatch({ game: gameOptions, windowTicks });
  const bob = new CorrespondenceMatch({ game: gameOptions, windowTicks });
  alice.queue({ kind: "build-castle", position: site, player: 0 });
  alice.advance(windowTicks);
  const move = alice.takeMove();
  const checksumBefore = bob.checksum();

  const start = createRecapDriver(bob, { ...move, endChecksum: 0 }, 256);
  assert.equal(start.ok, true);
  while (!start.driver.advanceFrame()) {
    // drive to the end
  }

  const verdict = start.driver.finish();
  assert.equal(verdict.ok, false);
  assert.equal(verdict.reason, "checksum-mismatch");
  assert.equal(bob.checksum(), checksumBefore, "restored to the window start");
});

test("digest lines render inside the game font's alphabet", () => {
  const lines = digestLines({
    window: 2,
    activePlayer: 1,
    players: [
      {
        player: 0,
        buildingsCompleted: 1,
        buildingsStarted: 0,
        flagsBuilt: 0,
        landAreaDelta: 0,
        stockDelta: -12,
        serfsDelta: 2,
      },
      {
        player: 1,
        buildingsCompleted: 0,
        buildingsStarted: 2,
        flagsBuilt: 3,
        landAreaDelta: 40,
        stockDelta: 0,
        serfsDelta: 0,
      },
    ],
  });

  assert.equal(lines[0], "WINDOW 3 - PLAYER 2 MOVED");
  assert.equal(lines[1].includes("DONE 1"), true);
  assert.equal(lines[1].includes("STOCK -12"), true);
  assert.equal(lines[2].includes("FLAGS 3"), true);

  // Every non-space character maps to a real glyph (no silent '?'
  // fallbacks except a literal '?').
  for (const line of lines) {
    for (const character of line) {
      if (character === " ") {
        continue;
      }

      const glyph = mapCharacterToGlyphIndex(character);
      assert.equal(
        glyph !== 42 || character === "?",
        true,
        `'${character}' renders in the game font`,
      );
    }
  }

  // A quiet window says so.
  const quiet = digestLines({
    window: 0,
    activePlayer: 0,
    players: [
      {
        player: 0,
        buildingsCompleted: 0,
        buildingsStarted: 0,
        flagsBuilt: 0,
        landAreaDelta: 0,
        stockDelta: 0,
        serfsDelta: 0,
      },
    ],
  });
  assert.equal(quiet[1], "P1: QUIET");
});
