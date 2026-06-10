import assert from "node:assert/strict";
import { test } from "node:test";

import {
  defaultGameSpeed,
  FreeserfRandom,
  SerfboundGameState,
  ticksPerSecond,
} from "@serfbound/engine";

test("SerfboundGameState exposes a stable initial snapshot", () => {
  const state = new SerfboundGameState({
    mapSize: 3,
    random: FreeserfRandom.fromWord(1),
  });

  assert.equal(defaultGameSpeed, 2);
  assert.equal(ticksPerSecond, 50);
  assert.deepEqual(state.snapshot(), {
    schemaVersion: 1,
    kind: "serfbound.game-state-skeleton",
    map: {
      size: 3,
      columns: 64,
      rows: 64,
      tileCount: 4096,
    },
    clock: {
      tick: 0,
      constTick: 0,
      gameTimeTicksOfSecond: 0,
      gameTime: 0,
      gameSpeed: 2,
      nextGameTime: 0,
      tickDifference: 0,
    },
    random: {
      state: [1, 1, 1],
      seedString: "2111131111511111",
    },
    counters: {
      knightMoraleCounter: 0,
      inventoryScheduleCounter: 0,
    },
    builtStructures: [],
    worldActions: [],
  });
});

test("SerfboundGameState advances source-derived tick and schedule counters deterministically", () => {
  const state = new SerfboundGameState({
    mapSize: 4,
    random: FreeserfRandom.fromStringSeed("1234567812345678"),
  });

  const events = state.advanceTicks(25);
  assert.deepEqual(events, [
    "knight-morale-scheduled",
    "inventory-scheduled",
  ]);
  assert.deepEqual(state.snapshot(), {
    schemaVersion: 1,
    kind: "serfbound.game-state-skeleton",
    map: {
      size: 4,
      columns: 128,
      rows: 64,
      tileCount: 8192,
    },
    clock: {
      tick: 50,
      constTick: 25,
      gameTimeTicksOfSecond: 0,
      gameTime: 1,
      gameSpeed: 2,
      nextGameTime: 1,
      tickDifference: 2,
    },
    random: {
      state: [50824, 35066, 64198],
      seedString: "1234567812345678",
    },
    counters: {
      knightMoraleCounter: 206,
      inventoryScheduleCounter: 14,
    },
    builtStructures: [],
    worldActions: [],
  });
});

test("SerfboundGameState preserves the reference tick overflow formula", () => {
  const state = new SerfboundGameState({
    tick: 0xfffe,
    constTick: 0xffffffff,
    gameSpeed: 2,
  });

  assert.deepEqual(state.advanceTick(), [
    "knight-morale-scheduled",
    "inventory-scheduled",
  ]);
  assert.equal(state.snapshot().clock.constTick, 0);
  assert.equal(state.snapshot().clock.tick, 0);
  assert.equal(state.snapshot().clock.tickDifference, 1);
  assert.equal(state.snapshot().counters.knightMoraleCounter, 255);
  assert.equal(state.snapshot().counters.inventoryScheduleCounter, 63);
});

test("SerfboundGameState snapshots round-trip and continue deterministically", () => {
  const original = new SerfboundGameState({
    mapSize: 4,
    tick: 48,
    gameTimeTicksOfSecond: 48,
    gameSpeed: 2,
    random: FreeserfRandom.fromState(3, 4, 5),
    knightMoraleCounter: 10,
    inventoryScheduleCounter: 10,
  });
  original.advanceTick();

  const restored = SerfboundGameState.fromSnapshot(original.snapshot());
  assert.deepEqual(restored.snapshot(), original.snapshot());

  original.advanceTicks(4);
  restored.advanceTicks(4);
  assert.deepEqual(restored.snapshot(), original.snapshot());
});
