import assert from "node:assert/strict";
import { test } from "node:test";

import {
  SerfboundGameWorld,
  buildingType,
  generateClassicMap,
  mapObject,
  mapTerrain,
  roadLengthCategory,
} from "@serfbound/engine";

// A flat all-grass landscape isolates graph semantics from terrain noise.
function flatWorld() {
  const size = 3;
  const landscape = generateClassicMap(size, [1, 2, 3]);
  const flat = {
    ...landscape,
    heights: new Uint8Array(landscape.tileCount).fill(4),
    typesUp: new Uint8Array(landscape.tileCount).fill(mapTerrain.grass1),
    typesDown: new Uint8Array(landscape.tileCount).fill(mapTerrain.grass1),
    objects: new Uint8Array(landscape.tileCount),
    minerals: new Uint8Array(landscape.tileCount),
    resourceAmounts: new Uint8Array(landscape.tileCount),
  };
  const world = new SerfboundGameWorld(flat);
  // Claim a region for player 0 so flag/road owner checks pass without a
  // castle (castle flows are covered separately).
  for (let position = 0; position < world.owners.length; position += 1) {
    world.owners[position] = 0;
  }

  return world;
}

const pos = (world, column, row) => world.geometry.position(column, row);

test("flag placement follows reference validity rules", () => {
  const world = flatWorld();
  const center = pos(world, 10, 10);

  assert.notEqual(world.buildFlag(center, 0), null, "flag builds on open owned grass");

  // No flags allowed on the six adjacent positions.
  assert.equal(world.canBuildFlag(world.move(center, "Right"), 0), false);
  assert.equal(world.canBuildFlag(world.move(center, "UpLeft"), 0), false);
  // Two steps away is fine.
  assert.equal(world.canBuildFlag(world.geometry.positionAdd(center, 2, 0), 0), true);

  // Unowned land rejects flags.
  const unowned = pos(world, 40, 40);
  world.owners[unowned] = -1;
  assert.equal(world.canBuildFlag(unowned, 0), false);
});

test("roads connect flags with reference link data on both endpoints", () => {
  const world = flatWorld();
  const a = pos(world, 10, 10);
  const b = pos(world, 14, 10); // four steps right
  const flagA = world.buildFlag(a, 0);
  const flagB = world.buildFlag(b, 0);

  const road = { start: a, directions: ["Right", "Right", "Right", "Right"] };
  assert.equal(world.buildRoad(road, 0), true);

  // Path bits on every segment, both directions.
  for (let step = 0; step < 4; step += 1) {
    const at = world.geometry.positionAdd(a, step, 0);
    assert.equal(world.hasPath(at, "Right"), true, `segment ${step} forward`);
    assert.equal(world.hasPath(world.move(at, "Right"), "Left"), true, `segment ${step} back`);
  }

  // Flag link data per Flag.LinkWithFlag.
  assert.equal(flagA.paths.Right.hasPath, true);
  assert.equal(flagA.paths.Right.otherFlagIndex, flagB.index);
  assert.equal(flagA.paths.Right.otherEndDirection, "Left");
  assert.equal(flagA.paths.Right.lengthCategory, roadLengthCategory(4));
  assert.equal(flagB.paths.Left.hasPath, true);
  assert.equal(flagB.paths.Left.otherFlagIndex, flagA.index);
  assert.equal(flagB.paths.Left.otherEndDirection, "Right");

  // A road over an existing path is rejected.
  assert.equal(world.buildRoad(road, 0), false);
});

test("placing a flag on a road splits it; removing the flag merges it back", () => {
  const world = flatWorld();
  const a = pos(world, 10, 20);
  const b = pos(world, 18, 20); // eight steps right
  const flagA = world.buildFlag(a, 0);
  const flagB = world.buildFlag(b, 0);
  assert.equal(
    world.buildRoad({ start: a, directions: Array(8).fill("Right") }, 0),
    true,
  );
  assert.equal(flagA.paths.Right.lengthCategory, roadLengthCategory(8));

  // Split in the middle.
  const middle = pos(world, 14, 20);
  const flagC = world.buildFlag(middle, 0);
  assert.notEqual(flagC, null, "flag builds on the road");

  assert.equal(flagA.paths.Right.otherFlagIndex, flagC.index);
  assert.equal(flagA.paths.Right.lengthCategory, roadLengthCategory(4));
  assert.equal(flagC.paths.Left.otherFlagIndex, flagA.index);
  assert.equal(flagC.paths.Right.otherFlagIndex, flagB.index);
  assert.equal(flagB.paths.Left.otherFlagIndex, flagC.index);

  // Merge back by demolishing the middle flag (two distinct endpoints).
  assert.equal(world.canDemolishFlag(middle, 0), true);
  assert.equal(world.demolishFlag(middle, 0), true);
  assert.equal(world.hasFlag(middle), false);
  assert.equal(flagA.paths.Right.otherFlagIndex, flagB.index);
  assert.equal(flagB.paths.Left.otherFlagIndex, flagA.index);
  assert.equal(flagA.paths.Right.lengthCategory, roadLengthCategory(8));
  // The road segments themselves stay on the map.
  assert.equal(world.hasPath(middle, "Right"), true);
  assert.equal(world.hasPath(middle, "Left"), true);
});

test("flags carrying buildings or non-mergeable paths refuse demolition", () => {
  const world = flatWorld();
  world.players[0].hasCastle = true;

  const site = pos(world, 30, 30);
  const building = world.buildBuilding(site, buildingType.lumberjack, 0);
  assert.notEqual(building, null, "lumberjack builds on grass");

  const flagPosition = world.move(site, "DownRight");
  assert.equal(world.hasFlag(flagPosition), true, "building creates its flag");
  assert.equal(world.canDemolishFlag(flagPosition, 0), false, "building flag stays");
  assert.equal(world.hasPath(site, "DownRight"), true, "building links to its flag");
});

test("road validity respects water, ownership, and blocked terrain", () => {
  const world = flatWorld();
  const a = pos(world, 10, 30);
  world.buildFlag(a, 0);

  // Foreign land along the way blocks the road.
  const foreign = world.geometry.positionAdd(a, 2, 0);
  world.owners[foreign] = -1;
  const blocked = world.canBuildRoad(
    { start: a, directions: ["Right", "Right", "Right"] },
    0,
  );
  assert.equal(blocked.valid, false);

  world.owners[foreign] = 0;
  const ok = world.canBuildRoad({ start: a, directions: ["Right", "Right", "Right"] }, 0);
  assert.equal(ok.valid, true);
  assert.equal(ok.water, false);
  assert.equal(ok.destination, world.geometry.positionAdd(a, 3, 0));
});

test("world flags and objects expose reference object encodings", () => {
  const world = flatWorld();
  const at = pos(world, 5, 5);
  const flag = world.buildFlag(at, 0);
  assert.equal(world.objectAt(at), mapObject.flag);
  assert.equal(world.objectIndexes[at], flag.index);
});
