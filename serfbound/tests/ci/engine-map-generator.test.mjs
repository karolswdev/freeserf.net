import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import {
  classicSpiralPattern,
  generateClassicMap,
  mapObject,
  mapSpaceFromObject,
  mapTerrain,
} from "@serfbound/engine";

const fixtureUrl = new URL(
  "../../../pm/roadmap/serfbound/reference-fixtures/ci/map-generator-classic.json",
  import.meta.url,
);

const fixture = JSON.parse(await readFile(fixtureUrl, "utf8"));

test("the classic spiral pattern has 295 entries starting at the origin", () => {
  assert.equal(classicSpiralPattern.length, 295);
  assert.deepEqual(classicSpiralPattern[0], [0, 0]);
  // First ring: the six rotations of (1, 0) per the reference spiral matrix.
  assert.deepEqual(classicSpiralPattern.slice(1, 7), [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
  ]);
});

test("mapSpaceFromObject mirrors the reference impassability table", () => {
  assert.equal(mapSpaceFromObject.length, 128);
  assert.equal(mapSpaceFromObject[mapObject.castle], 3);
  assert.equal(mapSpaceFromObject[mapObject.tree0], 1);
  assert.equal(mapSpaceFromObject[mapObject.stone0], 3);
  assert.equal(mapSpaceFromObject[mapObject.stub], 0);
  assert.equal(mapSpaceFromObject[105], 2); // seeds are semipassable
});

for (const generatorCase of fixture.cases) {
  test(`classic generator matches the reference oracle for seed ${JSON.stringify(generatorCase.seedBases)}`, () => {
    const landscape = generateClassicMap(generatorCase.size, generatorCase.seedBases);

    assert.equal(landscape.columns, generatorCase.columns);
    assert.equal(landscape.rows, generatorCase.rows);

    const comparisons = [
      ["heights", landscape.heights],
      ["typesUp", landscape.typesUp],
      ["typesDown", landscape.typesDown],
      ["objects", landscape.objects],
      ["minerals", landscape.minerals],
      ["resourceAmounts", landscape.resourceAmounts],
    ];

    for (const [key, values] of comparisons) {
      const expected = generatorCase[key];
      assert.equal(values.length, expected.length, `${key} length`);
      for (let position = 0; position < expected.length; position += 1) {
        if (values[position] !== expected[position]) {
          assert.fail(
            `${key} diverges at position ${position}: ` +
              `expected ${expected[position]}, got ${values[position]}`,
          );
        }
      }
    }
  });
}

test("generated maps expose sane landscape facts", () => {
  const landscape = generateClassicMap(3, [0x1234, 0x5678, 0x9abc]);
  assert.equal(landscape.tileCount, 4096);
  assert.equal(
    landscape.typesUp.some((terrain) => terrain <= mapTerrain.water3),
    true,
    "water exists",
  );
  assert.equal(
    landscape.objects.some(
      (object) => object >= mapObject.tree0 && object < mapObject.tree0 + 8,
    ),
    true,
    "trees exist",
  );
});
