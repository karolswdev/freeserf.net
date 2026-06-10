import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { assertOracleFixtureHeader } from "@serfbound/test-support";

const workspaceRoot = new URL("../../", import.meta.url);
const repositoryRoot = new URL("../", workspaceRoot);
const ciFixtureRoot = new URL(
  "pm/roadmap/serfbound/reference-fixtures/ci/",
  repositoryRoot,
);

const fixtures = [
  {
    label: "rng-fixed-seed-sequence.json",
    path: new URL("rng-fixed-seed-sequence.json", ciFixtureRoot),
    targetId: "rng.fixed-seed-sequence",
  },
  {
    label: "map-geometry-facts.json",
    path: new URL("map-geometry-facts.json", ciFixtureRoot),
    targetId: "map.geometry-facts",
  },
  {
    label: "map-generator-classic.json",
    path: new URL("map-generator-classic.json", ciFixtureRoot),
    targetId: "map.generator-classic",
  },
];

async function readFixture(fixture) {
  const raw = await readFile(fixture.path, "utf8");
  assert.doesNotMatch(raw, /serfbound-local-data|SERF\.EXE|SOUNDS\.PA|\.adf/i);

  return JSON.parse(raw);
}

for (const fixture of fixtures) {
  test(`${fixture.label} satisfies the oracle fixture header contract`, async () => {
    const parsed = await readFixture(fixture);
    const header = assertOracleFixtureHeader(parsed, {
      label: fileURLToPath(fixture.path),
      targetId: fixture.targetId,
      dataRequirement: "data-free / CI-safe",
    });

    assert.equal(header.schemaVersion, 1);
    assert.equal(header.targetId, fixture.targetId);
    assert.equal(header.dataRequirement, "data-free / CI-safe");
  });
}

test("fixture validator fails unsupported schema versions with an actionable error", () => {
  assert.throws(
    () =>
      assertOracleFixtureHeader(
        {
          schemaVersion: 999,
          targetId: "rng.fixed-seed-sequence",
          dataRequirement: "data-free / CI-safe",
          source: {},
          generation: {},
        },
        {
          label: "synthetic bad fixture",
          targetId: "rng.fixed-seed-sequence",
          dataRequirement: "data-free / CI-safe",
        },
      ),
    /synthetic bad fixture: Unsupported oracle fixture schemaVersion 999\./,
  );
});

test("rng fixture is consumed as data by CI-safe tests", async () => {
  const parsed = await readFixture(fixtures[0]);
  assertOracleFixtureHeader(parsed, {
    label: fixtures[0].label,
    targetId: "rng.fixed-seed-sequence",
    dataRequirement: "data-free / CI-safe",
  });

  const seedOne = parsed.cases.find(
    (candidate) => candidate.id === "word-seed-0001",
  );
  assert.ok(seedOne, "expected rng fixture case word-seed-0001");
  assert.equal(seedOne.initialToString, "2111131111511111");
  assert.equal(seedOne.steps[0].next, 3);
  assert.deepEqual(seedOne.steps[0].after, [3, 32769, 1]);
});

test("map geometry fixture is consumed as data by CI-safe tests", async () => {
  const parsed = await readFixture(fixtures[1]);
  assertOracleFixtureHeader(parsed, {
    label: fixtures[1].label,
    targetId: "map.geometry-facts",
    dataRequirement: "data-free / CI-safe",
  });

  const firstCase = parsed.cases[0];
  assert.equal(firstCase.dimensions.tileCount, 4096);
  assert.equal(firstCase.directionOffsets.UpLeft, 4095);
  assert.deepEqual(firstCase.movementSamples[0].moves.DownRight, {
    column: 1,
    position: 65,
    row: 1,
  });
});

test("map generator fixture carries complete landscape arrays per case", async () => {
  const parsed = await readFixture(fixtures[2]);
  assertOracleFixtureHeader(parsed, {
    label: fixtures[2].label,
    targetId: "map.generator-classic",
    dataRequirement: "data-free / CI-safe",
  });

  assert.equal(parsed.cases.length >= 2, true, "at least two seeds captured");
  for (const generatorCase of parsed.cases) {
    const tileCount = generatorCase.columns * generatorCase.rows;
    assert.equal(generatorCase.parameters.heightGenerator, "Midpoints");
    assert.equal(generatorCase.parameters.preserveBugs, true);
    for (const key of [
      "heights",
      "typesUp",
      "typesDown",
      "objects",
      "minerals",
      "resourceAmounts",
    ]) {
      assert.equal(
        generatorCase[key].length,
        tileCount,
        `${key} covers every map position`,
      );
      assert.equal(typeof generatorCase.digests[key], "string");
    }

    assert.equal(generatorCase.heights.every((h) => h >= 0 && h <= 31), true);
    assert.equal(generatorCase.typesUp.every((t) => t >= 0 && t <= 15), true);
    assert.equal(generatorCase.typesUp.some((t) => t <= 3), true, "water exists");
    assert.equal(generatorCase.typesUp.some((t) => t >= 4 && t <= 7), true, "grass exists");
    assert.equal(generatorCase.objects.some((o) => o >= 8 && o <= 15), true, "trees exist");
    assert.equal(generatorCase.minerals.some((m) => m !== 0), true, "minerals exist");
  }
});
