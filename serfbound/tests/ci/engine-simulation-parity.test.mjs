import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  directions,
  FreeserfRandom,
  SerfboundGameState,
} from "@serfbound/engine";
import { assertOracleFixtureHeader } from "@serfbound/test-support";

const workspaceRoot = new URL("../../", import.meta.url);
const repositoryRoot = new URL("../", workspaceRoot);
const fixtureRoot = new URL(
  "pm/roadmap/serfbound/reference-fixtures/ci/",
  repositoryRoot,
);
const rngFixturePath = new URL("rng-fixed-seed-sequence.json", fixtureRoot);
const mapFixturePath = new URL("map-geometry-facts.json", fixtureRoot);

async function readFixture(path, targetId) {
  const raw = await readFile(path, "utf8");
  assert.doesNotMatch(raw, /serfbound-local-data|SERF\.EXE|SOUNDS\.PA|\.adf/i);
  const parsed = JSON.parse(raw);
  assertOracleFixtureHeader(parsed, {
    label: fileURLToPath(path),
    targetId,
    dataRequirement: "data-free / CI-safe",
  });

  return parsed;
}

test("combined engine slice consumes Phase 1 RNG and map geometry fixtures", async () => {
  const [rngFixture, mapFixture] = await Promise.all([
    readFixture(rngFixturePath, "rng.fixed-seed-sequence"),
    readFixture(mapFixturePath, "map.geometry-facts"),
  ]);
  const rngCase = rngFixture.cases.find((candidate) => candidate.id === "word-seed-0001");
  const mapCase = mapFixture.cases.find((candidate) => candidate.size === 3);
  assert.ok(rngCase, "expected rng fixture case word-seed-0001");
  assert.ok(mapCase, "expected map geometry fixture size 3");

  const state = new SerfboundGameState({
    mapSize: mapCase.size,
    random: FreeserfRandom.fromWord(rngCase.constructor.value),
  });
  const geometry = state.mapGeometry;
  const path = [];

  assert.deepEqual(state.snapshot().map, {
    size: mapCase.size,
    columns: mapCase.dimensions.columns,
    rows: mapCase.dimensions.rows,
    tileCount: mapCase.dimensions.tileCount,
  });
  assert.deepEqual(state.snapshot().random.state, rngCase.initialState);
  assert.equal(state.snapshot().random.seedString, rngCase.initialToString);

  for (const [index, step] of rngCase.steps.slice(0, directions.length).entries()) {
    assert.deepEqual(state.snapshot().random.state, step.before, `rng step ${step.step} before`);
    assert.equal(state.nextRandomInt(), step.next, `rng step ${step.step} next`);
    assert.deepEqual(state.snapshot().random.state, step.after, `rng step ${step.step} after`);
    assert.equal(
      state.snapshot().random.seedString,
      step.toStringAfter,
      `rng step ${step.step} string`,
    );

    const direction = directions[index];
    const movementSample = mapCase.movementSamples[index];
    assert.ok(movementSample, `expected fixture movement sample ${step.step}`);
    const expected = movementSample.moves[direction];
    assert.ok(
      expected,
      `expected fixture movement from ${movementSample.start.position} via ${direction}`,
    );

    const position = geometry.move(movementSample.start.position, direction);
    const tile = geometry.tileFromPosition(position);
    assert.deepEqual(tile, expected, `map move ${step.step} ${direction}`);
    path.push({
      direction,
      random: step.next,
      start: movementSample.start,
      tile,
      tickEvents: state.advanceTick(),
    });
  }

  assert.deepEqual(path, [
    {
      direction: "Right",
      random: 3,
      start: { column: 0, row: 0, position: 0 },
      tile: { column: 1, row: 0, position: 1 },
      tickEvents: ["knight-morale-scheduled", "inventory-scheduled"],
    },
    {
      direction: "DownRight",
      random: 32773,
      start: { column: 1, row: 1, position: 65 },
      tile: { column: 2, row: 2, position: 130 },
      tickEvents: [],
    },
    {
      direction: "Down",
      random: 16391,
      start: { column: 63, row: 63, position: 4095 },
      tile: { column: 63, row: 0, position: 63 },
      tickEvents: [],
    },
    {
      direction: "Left",
      random: 32777,
      start: { column: 62, row: 0, position: 62 },
      tile: { column: 61, row: 0, position: 61 },
      tickEvents: [],
    },
    {
      direction: "UpLeft",
      random: 20491,
      start: { column: 0, row: 62, position: 3968 },
      tile: { column: 63, row: 61, position: 3967 },
      tickEvents: [],
    },
    {
      direction: "Up",
      random: 47117,
      start: { column: 32, row: 32, position: 2080 },
      tile: { column: 32, row: 31, position: 2016 },
      tickEvents: [],
    },
  ]);
  assert.deepEqual(state.snapshot().clock, {
    tick: 12,
    constTick: 6,
    gameTimeTicksOfSecond: 12,
    gameTime: 0,
    gameSpeed: 2,
    nextGameTime: 0,
    tickDifference: 2,
  });
  assert.deepEqual(state.snapshot().counters, {
    knightMoraleCounter: 244,
    inventoryScheduleCounter: 52,
  });
});
