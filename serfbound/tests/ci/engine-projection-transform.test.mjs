import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { MapGeometry, MapProjectionTransform } from "@serfbound/engine";
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

function assertPointClose(actual, expected, label) {
  assert.equal(Math.round(actual.x * 1_000_000) / 1_000_000, expected.x, `${label} x`);
  assert.equal(Math.round(actual.y * 1_000_000) / 1_000_000, expected.y, `${label} y`);
}

test("MapProjectionTransform maps letterboxed screen pixels to virtual view coordinates", () => {
  const transform = MapProjectionTransform.create({
    geometry: new MapGeometry(3),
    virtualSize: { width: 800, height: 600 },
    screenSize: { width: 1600, height: 900 },
  });

  assert.deepEqual(transform.displayRect, {
    left: 200,
    top: 0,
    width: 1200,
    height: 900,
    right: 1400,
    bottom: 900,
  });
  assert.equal(transform.sizeFactorX, 2 / 3);
  assert.equal(transform.sizeFactorY, 2 / 3);

  assert.deepEqual(transform.screenToView({ x: 800, y: 450 }), { x: 400, y: 300 });
  assert.deepEqual(transform.screenToView({ x: 0, y: 450 }), { x: 0, y: 300 });
  assert.deepEqual(transform.screenToView({ x: 1600, y: 450 }), { x: 800, y: 300 });
  assertPointClose(transform.viewToScreen({ x: 400, y: 300 }), { x: 800, y: 450 }, "center");

  const resized = transform.resize({ width: 800, height: 600 });
  assert.deepEqual(resized.displayRect, {
    left: 0,
    top: 0,
    width: 800,
    height: 600,
    right: 800,
    bottom: 600,
  });
  assert.deepEqual(resized.screenToView({ x: 400, y: 300 }), { x: 400, y: 300 });
});

test("MapProjectionTransform applies source-style virtual screen rotation", () => {
  const transform = MapProjectionTransform.create({
    geometry: new MapGeometry(3),
    virtualSize: { width: 800, height: 600 },
    screenSize: { width: 600, height: 800 },
    rotation: "Deg90",
  });

  assert.deepEqual(transform.displayRect, {
    left: 0,
    top: 0,
    width: 600,
    height: 800,
    right: 600,
    bottom: 800,
  });
  assert.equal(transform.sizeFactorX, 1);
  assert.equal(transform.sizeFactorY, 1);
  assert.deepEqual(transform.screenToView({ x: 0, y: 0 }), { x: 0, y: 600 });
  assert.deepEqual(transform.screenToView({ x: 300, y: 400 }), { x: 400, y: 300 });
  assertPointClose(transform.viewToScreen({ x: 0, y: 600 }), { x: 0, y: 0 }, "top-left");
  assertPointClose(transform.viewToScreen({ x: 400, y: 300 }), { x: 300, y: 400 }, "center");
});

test("MapProjectionTransform shares map/view/screen math with fixture-backed geometry", async () => {
  const fixture = await readMapFixture();
  const renderConstants = {
    tileWidth: fixture.renderConstants.tileWidth,
    tileHeight: fixture.renderConstants.tileHeight,
  };
  const candidate = fixture.cases.find((item) => item.size === 3);
  assert.ok(candidate);

  const geometry = new MapGeometry(candidate.size);
  const heightProvider = syntheticHeight(candidate.size);
  const transform = MapProjectionTransform.create({
    geometry,
    virtualSize: { width: 2048, height: 1280 },
    screenSize: { width: 2048, height: 1280 },
    ...renderConstants,
    scrollX: 1,
    scrollY: 2,
  });

  for (const sample of candidate.projectionSamples) {
    assert.deepEqual(
      transform.tileToMap(sample.tile.position, heightProvider),
      sample.tileToMap,
      `tileToMap ${sample.tile.position}`,
    );
    assert.deepEqual(
      transform.tileToView(sample.tile.position, heightProvider),
      sample.mapToViewScroll1x2,
      `tileToView ${sample.tile.position}`,
    );
    assertPointClose(
      transform.tileToScreen(sample.tile.position, heightProvider),
      sample.mapToViewScroll1x2,
      `tileToScreen ${sample.tile.position}`,
    );
    assert.deepEqual(
      transform.screenToMap(sample.mapToViewScroll1x2),
      sample.viewToMapScroll1x2,
      `screenToMap ${sample.tile.position}`,
    );
  }

  for (const sample of candidate.viewToTileSamples) {
    if (sample.viewInput.x < 0 || sample.viewInput.y < 0) {
      continue;
    }

    const viewTransform = MapProjectionTransform.create({
      geometry,
      virtualSize: { width: 4096, height: 1280 },
      screenSize: { width: 4096, height: 1280 },
      ...renderConstants,
      scrollY: sample.viewInput.scrollY,
    });

    assert.deepEqual(
      geometry.tileFromPosition(
        viewTransform.screenToTile({ x: sample.viewInput.x, y: sample.viewInput.y }, heightProvider),
      ),
      sample.tile,
      `screenToTile ${sample.viewInput.x},${sample.viewInput.y}`,
    );
  }
});
