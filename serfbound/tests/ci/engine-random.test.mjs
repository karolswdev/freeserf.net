import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  FreeserfRandom,
  int16,
  rotateRight16,
  uint16,
  uint32,
} from "@serfbound/engine";
import { assertOracleFixtureHeader } from "@serfbound/test-support";

const workspaceRoot = new URL("../../", import.meta.url);
const repositoryRoot = new URL("../", workspaceRoot);
const rngFixturePath = new URL(
  "pm/roadmap/serfbound/reference-fixtures/ci/rng-fixed-seed-sequence.json",
  repositoryRoot,
);

async function readRngFixture() {
  const raw = await readFile(rngFixturePath, "utf8");
  assert.doesNotMatch(raw, /serfbound-local-data|SERF\.EXE|SOUNDS\.PA|\.adf/i);
  const parsed = JSON.parse(raw);
  assertOracleFixtureHeader(parsed, {
    label: fileURLToPath(rngFixturePath),
    targetId: "rng.fixed-seed-sequence",
    dataRequirement: "data-free / CI-safe",
  });

  return parsed;
}

function randomFromCase(candidate) {
  switch (candidate.constructor.kind) {
    case "Random(ushort)":
      return FreeserfRandom.fromWord(candidate.constructor.value);
    case "Random(ushort, ushort, ushort)": {
      const values = candidate.constructor.values;
      return FreeserfRandom.fromState(values[0], values[1], values[2]);
    }
    case "Random(string)":
      return FreeserfRandom.fromStringSeed(candidate.constructor.value);
    case "Random.operator ^": {
      const left = FreeserfRandom.fromState(...candidate.constructor.leftState);
      const right = FreeserfRandom.fromState(...candidate.constructor.rightState);
      return FreeserfRandom.xor(left, right);
    }
    default:
      throw new Error(`Unsupported RNG fixture constructor: ${candidate.constructor.kind}`);
  }
}

test("numeric helpers document 16-bit and 32-bit wrapping behavior", () => {
  assert.equal(uint16(0xffff), 0xffff);
  assert.equal(uint16(0x10000), 0);
  assert.equal(uint16(0x1ffff), 0xffff);
  assert.equal(uint16(-1), 0xffff);

  assert.equal(int16(0x7fff), 32767);
  assert.equal(int16(0x8000), -32768);
  assert.equal(int16(0xffff), -1);
  assert.equal(int16(-2), -2);

  assert.equal(uint32(-1), 0xffffffff);
  assert.equal(uint32(0x1_0000_0000), 0);

  assert.equal(rotateRight16(0x0001, 1), 0x8000);
  assert.equal(rotateRight16(0x8001, 1), 0xc000);
  assert.equal(rotateRight16(0x10001, 1), 0x8000);
});

test("FreeserfRandom rejects unsupported string seeds explicitly", () => {
  assert.throws(
    () => FreeserfRandom.fromStringSeed("1234"),
    /16 digits from 1 to 8/,
  );
  assert.throws(
    () => FreeserfRandom.fromStringSeed("1234567812345679"),
    /16 digits from 1 to 8/,
  );
});

test("FreeserfRandom state copies do not expose mutable internal state", () => {
  const random = FreeserfRandom.fromState(1, 2, 3);
  const state = random.state;
  state[0] = 0xffff;

  assert.deepEqual(random.state, [1, 2, 3]);
  assert.deepEqual(random.clone().state, [1, 2, 3]);
});

test("FreeserfRandom matches the Phase 1 fixed-seed oracle fixture", async () => {
  const fixture = await readRngFixture();

  for (const candidate of fixture.cases) {
    const random = randomFromCase(candidate);
    assert.deepEqual(random.state, candidate.initialState, `${candidate.id} initial state`);
    assert.equal(random.toString(), candidate.initialToString, `${candidate.id} initial string`);

    for (const step of candidate.steps) {
      assert.deepEqual(random.state, step.before, `${candidate.id} step ${step.step} before`);
      assert.equal(random.next(), step.next, `${candidate.id} step ${step.step} next`);
      assert.deepEqual(random.state, step.after, `${candidate.id} step ${step.step} after`);
      assert.equal(
        random.toString(),
        step.toStringAfter,
        `${candidate.id} step ${step.step} string`,
      );
    }
  }
});
