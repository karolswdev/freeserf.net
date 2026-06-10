import assert from "node:assert/strict";
import { test } from "node:test";

import {
  SerfboundCommandRouter,
  SerfboundGameState,
} from "@serfbound/engine";

test("SerfboundCommandRouter accepts deterministic debug tile inspection commands", () => {
  const state = new SerfboundGameState({ mapSize: 3, tick: 12, constTick: 34 });
  const router = new SerfboundCommandRouter(state);
  const tile = state.mapGeometry.tileAt(26, 16);

  const result = router.dispatch({
    type: "debug.inspect-map-tile",
    source: "pointer",
    map: { x: 576, y: 310 },
    tile,
  });

  assert.deepEqual(result, {
    status: "accepted",
    commandId: 1,
    command: {
      type: "debug.inspect-map-tile",
      source: "pointer",
      map: { x: 576, y: 310 },
      tile,
    },
    effect: "debug-inspection-recorded",
    snapshot: {
      schemaVersion: 1,
      kind: "serfbound.command-router",
      commandLogLength: 1,
      game: {
        tick: 12,
        constTick: 34,
        gameTime: 0,
      },
      map: {
        size: 3,
        columns: 64,
        rows: 64,
        tileCount: 4096,
      },
      debug: {
        lastInspectedTile: tile,
      },
    },
  });
  assert.deepEqual(router.log, [
    {
      commandId: 1,
      status: "accepted",
      commandType: "debug.inspect-map-tile",
      source: "pointer",
      tile,
    },
  ]);
  assert.deepEqual(state.snapshot().clock, {
    tick: 12,
    constTick: 34,
    gameTimeTicksOfSecond: 0,
    gameTime: 0,
    gameSpeed: 2,
    nextGameTime: 0,
    tickDifference: 0,
  });
});

test("SerfboundCommandRouter rejects invalid commands with structured errors", () => {
  const state = new SerfboundGameState({ mapSize: 3 });
  const router = new SerfboundCommandRouter(state);

  const invalidTile = router.dispatch({
    type: "debug.inspect-map-tile",
    source: "pointer",
    tile: { column: 26, row: 16, position: 7 },
  });
  const unsupported = router.dispatch({ type: "debug.fly-to-moon" });
  const invalidSource = router.dispatch({
    type: "debug.inspect-map-tile",
    source: "dom-click",
    tile: state.mapGeometry.tileAt(1, 1),
  });

  assert.equal(invalidTile.status, "rejected");
  assert.equal(invalidTile.commandId, 1);
  assert.equal(invalidTile.reason, "invalid-tile");
  assert.match(invalidTile.message, /does not match column 26, row 16/);
  assert.equal(invalidTile.snapshot.commandLogLength, 1);

  assert.equal(unsupported.status, "rejected");
  assert.equal(unsupported.commandId, 2);
  assert.equal(unsupported.reason, "unsupported-command");
  assert.equal(unsupported.commandType, "debug.fly-to-moon");
  assert.equal(unsupported.snapshot.commandLogLength, 2);

  assert.equal(invalidSource.status, "rejected");
  assert.equal(invalidSource.commandId, 3);
  assert.equal(invalidSource.reason, "invalid-command-source");
  assert.equal(invalidSource.snapshot.commandLogLength, 3);

  assert.deepEqual(router.log.map((entry) => entry.status), [
    "rejected",
    "rejected",
    "rejected",
  ]);
  assert.deepEqual(router.log.map((entry) => entry.reason), [
    "invalid-tile",
    "unsupported-command",
    "invalid-command-source",
  ]);
});

test("SerfboundCommandRouter exposes a deferred Phase 7 build route", () => {
  const state = new SerfboundGameState({ mapSize: 3 });
  const router = new SerfboundCommandRouter(state);
  const tile = state.mapGeometry.tileAt(3, 4);

  const result = router.dispatch({
    type: "game.build",
    source: "keyboard",
    building: "flag",
    tile,
  });

  assert.deepEqual(result, {
    status: "rejected",
    commandId: 1,
    reason: "build-command-deferred",
    message: "Build command route is reserved for Phase 7 build-action semantics.",
    commandType: "game.build",
    command: {
      type: "game.build",
      source: "keyboard",
      building: "flag",
      tile,
    },
    snapshot: {
      schemaVersion: 1,
      kind: "serfbound.command-router",
      commandLogLength: 1,
      game: {
        tick: 0,
        constTick: 0,
        gameTime: 0,
      },
      map: {
        size: 3,
        columns: 64,
        rows: 64,
        tileCount: 4096,
      },
      debug: {},
    },
  });
  assert.deepEqual(router.log, [
    {
      commandId: 1,
      status: "rejected",
      commandType: "game.build",
      reason: "build-command-deferred",
      source: "keyboard",
      tile,
    },
  ]);
});
