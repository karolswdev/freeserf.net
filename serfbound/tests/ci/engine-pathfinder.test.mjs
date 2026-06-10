import assert from "node:assert/strict";
import { test } from "node:test";

import {
  SerfboundGameWorld,
  findShortestRoad,
  generateClassicMap,
  mapTerrain,
} from "@serfbound/engine";

function flatWorld() {
  const landscape = generateClassicMap(3, [1, 2, 3]);
  const world = new SerfboundGameWorld({
    ...landscape,
    heights: new Uint8Array(landscape.tileCount).fill(4),
    typesUp: new Uint8Array(landscape.tileCount).fill(mapTerrain.grass1),
    typesDown: new Uint8Array(landscape.tileCount).fill(mapTerrain.grass1),
    objects: new Uint8Array(landscape.tileCount),
    minerals: new Uint8Array(landscape.tileCount),
    resourceAmounts: new Uint8Array(landscape.tileCount),
  });
  for (let position = 0; position < world.owners.length; position += 1) {
    world.owners[position] = 0;
  }

  return world;
}

test("the pathfinder finds straight flat roads at reference walk cost", () => {
  const world = flatWorld();
  const a = world.geometry.position(10, 10);
  const b = world.geometry.position(15, 10);
  world.buildFlag(a, 0);
  world.buildFlag(b, 0);

  const road = findShortestRoad(world, a, b);
  assert.notEqual(road, null);
  assert.equal(road.start, a);
  assert.equal(road.directions.length, 5);
  assert.deepEqual(road.directions, ["Right", "Right", "Right", "Right", "Right"]);
  // Flat ground costs walkCost[0] = 255 per segment.
  assert.equal(road.cost, 5 * 255);

  // The found road builds successfully.
  assert.equal(world.buildRoad(road, 0), true);
});

test("the pathfinder avoids obstacles and foreign land", () => {
  const world = flatWorld();
  const a = world.geometry.position(20, 20);
  const b = world.geometry.position(24, 20);
  world.buildFlag(a, 0);
  world.buildFlag(b, 0);

  // Block the straight line with foreign land.
  for (const offset of [1, 2, 3]) {
    world.owners[world.geometry.positionAdd(a, offset, 0)] = -1;
  }

  const road = findShortestRoad(world, a, b);
  assert.notEqual(road, null, "a detour exists");
  assert.equal(road.directions.length > 4, true, "the detour is longer than the straight line");

  let position = road.start;
  for (const direction of road.directions) {
    assert.equal(world.isRoadSegmentValid(position, direction), true);
    position = world.move(position, direction);
  }
  assert.equal(position, b, "the road ends at the target flag");
});

test("slopes cost more than flat ground", () => {
  const world = flatWorld();
  const a = world.geometry.position(30, 30);
  const b = world.geometry.position(33, 30);
  world.buildFlag(a, 0);
  world.buildFlag(b, 0);

  // Raise a bump on the straight line.
  world.heights[world.geometry.positionAdd(a, 1, 0)] = 6;
  world.heights[world.geometry.positionAdd(a, 2, 0)] = 6;

  const road = findShortestRoad(world, a, b);
  assert.notEqual(road, null);
  assert.equal(road.cost > 3 * 255, true, "slope segments cost more than walkCost[0]");
});

test("unreachable targets return null", () => {
  const world = flatWorld();
  const a = world.geometry.position(40, 40);
  const b = world.geometry.position(44, 40);
  world.buildFlag(a, 0);
  world.buildFlag(b, 0);

  // Surround b with foreign land.
  for (const direction of ["Right", "DownRight", "Down", "Left", "UpLeft", "Up"]) {
    world.owners[world.move(b, direction)] = -1;
  }

  assert.equal(findShortestRoad(world, a, b), null);
});
