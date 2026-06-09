import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  directionCycleClockwise,
  directionCycleClockwiseWithout,
  directionCycleCounterClockwise,
  directionValues,
  directions,
  MapGeometry,
  reverseDirection,
  turnDirection,
} from "@serfbound/engine";
import { assertOracleFixtureHeader } from "@serfbound/test-support";

const workspaceRoot = new URL("../../", import.meta.url);
const repositoryRoot = new URL("../", workspaceRoot);
const mapFixturePath = new URL(
  "pm/roadmap/serfbound/reference-fixtures/ci/map-geometry-facts.json",
  repositoryRoot,
);

async function readMapFixture() {
  const raw = await readFile(mapFixturePath, "utf8");
  assert.doesNotMatch(raw, /serfbound-local-data|SERF\.EXE|SOUNDS\.PA|\.adf/i);
  const parsed = JSON.parse(raw);
  assertOracleFixtureHeader(parsed, {
    label: fileURLToPath(mapFixturePath),
    targetId: "map.geometry-facts",
    dataRequirement: "data-free / CI-safe",
  });

  return parsed;
}

function syntheticHeight(size) {
  return (tile) => (tile.column * 3 + tile.row * 5 + size) % 32;
}

function assertTile(actualPosition, geometry, expected, label) {
  assert.deepEqual(geometry.tileFromPosition(actualPosition), expected, label);
}

test("direction helpers match the Phase 1 map geometry oracle facts", async () => {
  const fixture = await readMapFixture();
  const facts = fixture.directionFacts;

  assert.deepEqual(directionValues, facts.values);
  assert.deepEqual(directions, facts.cycleCWDefault);
  assert.deepEqual(directionCycleClockwise(), facts.cycleCWDefault);
  assert.deepEqual(directionCycleCounterClockwise(), facts.cycleCCWDefault);
  assert.deepEqual(directionCycleClockwiseWithout("Down"), facts.cycleCWWithoutDown);

  for (const [direction, reversed] of Object.entries(facts.reverse)) {
    assert.equal(reverseDirection(direction), reversed, `${direction} reverse`);
  }

  for (const sample of facts.turnSamples) {
    assert.equal(
      turnDirection(sample.direction, sample.times),
      sample.result,
      `${sample.direction} turn ${sample.times}`,
    );
  }
});

test("MapGeometry dimensions, positions, movement, and distances match oracle cases", async () => {
  const fixture = await readMapFixture();

  for (const candidate of fixture.cases) {
    const geometry = new MapGeometry(candidate.size);

    assert.deepEqual(geometry.dimensions, candidate.dimensions, `size ${candidate.size} dimensions`);
    assert.deepEqual(
      geometry.directionOffsets,
      candidate.directionOffsets,
      `size ${candidate.size} direction offsets`,
    );

    for (const sample of candidate.positionSamples) {
      assert.equal(
        geometry.position(sample.column, sample.row),
        sample.position,
        `size ${candidate.size} position ${sample.column},${sample.row}`,
      );
      assert.equal(
        geometry.positionColumn(sample.position),
        sample.column,
        `size ${candidate.size} position column ${sample.position}`,
      );
      assert.equal(
        geometry.positionRow(sample.position),
        sample.row,
        `size ${candidate.size} position row ${sample.position}`,
      );
      assert.deepEqual(
        geometry.tileFromPosition(sample.position),
        sample,
        `size ${candidate.size} tile ${sample.position}`,
      );
    }

    for (const sample of candidate.movementSamples) {
      for (const [direction, expected] of Object.entries(sample.moves)) {
        assertTile(
          geometry.move(sample.start.position, direction),
          geometry,
          expected,
          `size ${candidate.size} ${sample.start.position} move ${direction}`,
        );
        assert.equal(
          geometry.directionTo(sample.start.position, expected.position),
          direction,
          `size ${candidate.size} directionTo ${sample.start.position}->${expected.position}`,
        );
      }

      assertTile(
        geometry.moveRightN(sample.start.position, 3),
        geometry,
        sample.moveRightN3,
        `size ${candidate.size} ${sample.start.position} move right 3`,
      );
      assertTile(
        geometry.moveDownN(sample.start.position, 3),
        geometry,
        sample.moveDownN3,
        `size ${candidate.size} ${sample.start.position} move down 3`,
      );
    }

    for (const sample of candidate.distanceSamples) {
      assert.equal(
        geometry.distanceX(sample.left.position, sample.right.position),
        sample.distanceX,
        `size ${candidate.size} distanceX ${sample.left.position}->${sample.right.position}`,
      );
      assert.equal(
        geometry.distanceY(sample.left.position, sample.right.position),
        sample.distanceY,
        `size ${candidate.size} distanceY ${sample.left.position}->${sample.right.position}`,
      );
    }
  }
});

test("MapGeometry projection helpers match oracle tile, map, and view samples", async () => {
  const fixture = await readMapFixture();
  const renderConstants = {
    tileWidth: fixture.renderConstants.tileWidth,
    tileHeight: fixture.renderConstants.tileHeight,
  };

  for (const candidate of fixture.cases) {
    const geometry = new MapGeometry(candidate.size);
    const heightProvider = syntheticHeight(candidate.size);

    for (const sample of candidate.projectionSamples) {
      assert.equal(
        heightProvider(sample.tile),
        sample.syntheticHeight,
        `size ${candidate.size} synthetic height ${sample.tile.position}`,
      );
      assert.deepEqual(
        geometry.tileSpaceToMapSpace(sample.tile.position, heightProvider, renderConstants),
        sample.tileToMap,
        `size ${candidate.size} tileToMap ${sample.tile.position}`,
      );
      assert.deepEqual(
        geometry.mapSpaceToViewSpace(sample.tileToMap, {
          ...renderConstants,
          scrollX: 1,
          scrollY: 2,
        }),
        sample.mapToViewScroll1x2,
        `size ${candidate.size} mapToView ${sample.tile.position}`,
      );
      assert.deepEqual(
        geometry.viewSpaceToMapSpace(sample.mapToViewScroll1x2, {
          ...renderConstants,
          scrollX: 1,
          scrollY: 2,
        }),
        sample.viewToMapScroll1x2,
        `size ${candidate.size} viewToMap ${sample.tile.position}`,
      );
    }

    for (const sample of candidate.viewToTileSamples) {
      assert.deepEqual(
        geometry.viewSpaceToMapSpace(sample.viewInput, {
          ...renderConstants,
          scrollY: sample.viewInput.scrollY,
        }),
        sample.mapSpace,
        `size ${candidate.size} view input to map space`,
      );
      assertTile(
        geometry.viewSpaceToTileSpace(
          sample.viewInput,
          heightProvider,
          {
            ...renderConstants,
            scrollY: sample.viewInput.scrollY,
          },
        ),
        geometry,
        sample.tile,
        `size ${candidate.size} view input to tile`,
      );
    }
  }
});
