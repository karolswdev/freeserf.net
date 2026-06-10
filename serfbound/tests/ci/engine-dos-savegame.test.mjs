import assert from "node:assert/strict";
import { test } from "node:test";

import {
  continueFromDosSavegame,
  mapColumnsForSize,
  mapRowsForSize,
  parseDosSavegame,
} from "@serfbound/engine";

// Build a synthetic original-format .SAV per the reference binary layout
// (Game.ReadFrom / Map.ReadFrom / Building.ReadFrom).
function buildFixtureSave() {
  const mapSize = 3;
  const columns = mapColumnsForSize(mapSize);
  const rows = mapRowsForSize(mapSize);
  const tileCount = columns * rows;
  const maxFlagIndex = 2;
  const maxBuildingIndex = 3;
  const maxSerfIndex = 2;

  const headerSize = 250;
  const playersSize = 4 * (8628 + 1);
  const mapBytes = tileCount * 8;
  const serfsSize = 4 * Math.floor((maxSerfIndex + 31) / 32) + maxSerfIndex * 16;
  const flagsSize = 4 * Math.floor((maxFlagIndex + 31) / 32) + maxFlagIndex * 70;
  const buildingsSize = 4 * Math.floor((maxBuildingIndex + 31) / 32) + maxBuildingIndex * 18;
  const bytes = new Uint8Array(headerSize + playersSize + mapBytes + serfsSize + flagsSize + buildingsSize);
  const view = new DataView(bytes.buffer);

  view.setUint16(74, 0, true); // game type
  view.setUint16(78, 4242, true); // tick
  view.setUint16(84, 111, true);
  view.setUint16(86, 222, true);
  view.setUint16(88, 333, true);
  view.setUint16(90, maxFlagIndex, true);
  view.setUint16(92, maxBuildingIndex, true);
  view.setUint16(94, maxSerfIndex, true);
  view.setUint16(174, 1, true); // max inventory index
  view.setUint16(190, mapSize, true);
  view.setUint16(200, 20480, true); // gold morale factor

  // Players 0 and 1 are active (bit 6 of the trailing flags byte).
  const playerBase = headerSize;
  bytes[playerBase + 8628] = 1 << 6;
  bytes[playerBase + 2 * 8628 + 1] = 1 << 6;

  // Map: grass everywhere at height 4; player 0 owns a patch; a coal
  // deposit at one tile.
  const mapBase = headerSize + playersSize;
  let cursor = mapBase;
  const castlePosition = 10 * columns + 20;
  const lumberjackPosition = 10 * columns + 24;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const position = row * columns + column;
      bytes[cursor] = 0; // paths
      const owned = row >= 5 && row <= 15 && column >= 15 && column <= 29;
      bytes[cursor + 1] = (owned ? 0x80 : 0) | 4; // owner 0 + height 4
      bytes[cursor + 2] = (5 << 4) | 5; // grass1 both triangles
      let objectValue = 0;
      if (position === castlePosition) objectValue = 4; // castle object
      if (position === lumberjackPosition) objectValue = 2; // small building
      if (position === 8 * columns + 40) objectValue = 16; // a tree
      bytes[cursor + 3] = objectValue;
      cursor += 4;
    }

    for (let column = 0; column < columns; column += 1) {
      const position = row * columns + column;
      const objectValue = bytes[mapBase + (position * 4) + 3];
      if (objectValue >= 1 && objectValue <= 4) {
        view.setUint16(cursor, 1, true); // object index
        cursor += 2;
      } else {
        bytes[cursor] = position === 9 * columns + 22 ? (3 << 5) | 12 : 0; // coal 12
        bytes[cursor + 1] = 0;
        cursor += 2;
      }

      view.setUint16(cursor, 0, true); // serf index
      cursor += 2;
    }
  }

  // Buildings: bitmap marks records 1 and 2 (castle + lumberjack).
  const buildingsBase = mapBase + mapBytes + serfsSize + flagsSize;
  bytes[buildingsBase] = 0b11000000;
  const record = (index, position, type, player, constructing) => {
    const base = buildingsBase + 4 + index * 18;
    // PositionFromSavedValue inverse: column << 2 | row << (rowShift + 1 + 2).
    const column = position % columns;
    const row = Math.floor(position / columns);
    const rowShift = Math.log2(columns);
    view.setUint32(base, (column << 2) | (row << (rowShift + 1 + 2)), true);
    bytes[base + 4] = (constructing ? 0x80 : 0) | (type << 2) | player;
    bytes[base + 5] = 0;
    view.setUint16(base + 6, 1, true); // flag index
  };
  record(0, castlePosition, 24, 0, false); // castle
  record(1, lumberjackPosition, 2, 0, false); // lumberjack, done

  return { bytes, mapSize, columns, rows, castlePosition, lumberjackPosition };
}

test("the DOS save header, players, and map parse to reference facts", () => {
  const fixture = buildFixtureSave();
  const save = parseDosSavegame(fixture.bytes);
  assert.notEqual(save, null, "the save parses");

  assert.equal(save.tick, 4242);
  assert.deepEqual(save.randomState, [111, 222, 333]);
  assert.equal(save.mapSize, 3);
  assert.equal(save.goldMoraleFactor, 20480);
  assert.deepEqual(save.activePlayers, [0, 1]);
  assert.equal(save.map.columns, fixture.columns);
  assert.equal(save.map.rows, fixture.rows);

  // Map facts: heights, terrain, ownership, minerals, and objects.
  assert.equal(save.map.heights[0], 4);
  assert.equal(save.map.typesUp[0], 5);
  assert.equal(save.map.owners[10 * fixture.columns + 20], 0, "owned patch");
  assert.equal(save.map.owners[0], -1, "unowned elsewhere");
  assert.equal(save.map.minerals[9 * fixture.columns + 22], 3, "coal deposit");
  assert.equal(save.map.resourceAmounts[9 * fixture.columns + 22], 12);
  assert.equal(save.map.objects[8 * fixture.columns + 40], 16, "the tree survived");

  // Buildings: the bitmap-marked records decode with reference packing.
  assert.equal(save.buildings.length, 2);
  assert.deepEqual(save.buildings[0], {
    index: 0,
    position: fixture.castlePosition,
    type: 24,
    player: 0,
    constructing: false,
    threatLevel: 0,
  });
  assert.equal(save.buildings[1].type, 2);
  assert.equal(save.buildings[1].position, fixture.lumberjackPosition);
});

test("a parsed DOS save continues as a playable world", () => {
  const fixture = buildFixtureSave();
  const save = parseDosSavegame(fixture.bytes);
  const { world } = continueFromDosSavegame(save);

  assert.equal(world.players.length, 2, "both active players exist");
  assert.equal(world.players[0].hasCastle, true, "the castle re-founded");
  assert.equal(world.players[0].castlePosition, fixture.castlePosition);
  assert.notEqual(world.inventoryForPlayer(0), null, "the castle inventory exists");

  const lumberjack = [...world.buildings.values()].find((building) => building.type === 2);
  assert.notEqual(lumberjack, undefined, "the lumberjack restored");
  assert.equal(lumberjack.isDone, true, "completed buildings stay complete");

  // The world continues: territory recomputes and the map stays intact.
  assert.equal(world.owner(fixture.castlePosition), 0);
  assert.equal(world.typesUp[0], 5);
});

test("malformed saves parse to null, never a crash", () => {
  assert.equal(parseDosSavegame(new Uint8Array(10)), null);
  const garbage = new Uint8Array(300).fill(0xff);
  assert.equal(parseDosSavegame(garbage), null);
});
