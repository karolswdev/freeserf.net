import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildDecodedRenderAssets,
  buildLandscapeRenderAssets,
  createLandscapeScene,
  panelBackgroundLayout,
  panelBarRect,
  panelButtonAt,
  panelButtonSprites,
  pointInPanelBar,
} from "@serfbound/app";
import { startSerfboundLocalGame } from "@serfbound/engine";
import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

const dataSource = {
  kind: "imported-dos-pa-catalog",
  archiveName: "SPAU.PA",
  byteLength: 1_282_805,
  entryCount: 4000,
  definedArchiveEntries: 3805,
  fixupCount: 252,
};

test("the panel bar docks bottom-center at the reference 320x40 layout", () => {
  const rect = panelBarRect({ width: 1280, height: 720 }, 2);
  assert.deepEqual(rect, { x: 320, y: 640, width: 640, height: 80 });

  // Button slots at (64 + i * 48, 4), 32x32, reference layout.
  assert.equal(panelButtonAt(rect, 2, rect.x + 64 * 2 + 1, rect.y + 4 * 2 + 1), 0);
  assert.equal(panelButtonAt(rect, 2, rect.x + (64 + 48) * 2 + 1, rect.y + 30), 1);
  assert.equal(panelButtonAt(rect, 2, rect.x + (64 + 4 * 48) * 2 + 1, rect.y + 30), 4);
  // Between slots (the frame gaps) hits nothing.
  assert.equal(panelButtonAt(rect, 2, rect.x + 96 * 2 + 4, rect.y + 30), null);
  // Inside the bar but outside slots still belongs to the bar.
  assert.equal(pointInPanelBar(rect, rect.x + 4, rect.y + 4), true);
  assert.equal(pointInPanelBar(rect, rect.x - 2, rect.y + 4), false);
});

test("button sprites follow the reference build possibility and road mode", () => {
  assert.deepEqual(
    panelButtonSprites({ buildPossibility: "castle", roadMode: false }),
    [5, 8, 10, 12, 14],
  );
  assert.deepEqual(
    panelButtonSprites({ buildPossibility: "large", roadMode: false }),
    [4, 8, 10, 12, 14],
  );
  assert.deepEqual(
    panelButtonSprites({ buildPossibility: "flag", roadMode: true }),
    [1, 25, 10, 12, 14],
  );
  assert.deepEqual(
    panelButtonSprites({ buildPossibility: "none", roadMode: false }),
    [0, 8, 10, 12, 14],
  );
});

test("the background layout matches PanelBar.BackgroundLayout exactly", () => {
  // Freeserf.Core/UI/PanelBar.cs BackgroundLayout, audited piece for
  // piece (sprite, x, y triplets).
  assert.deepEqual(panelBackgroundLayout.flat(), [
    6, 0, 0, 0, 40, 0, 20, 48, 0,
    7, 64, 0, 8, 64, 36, 21, 96, 0,
    9, 112, 0, 10, 112, 36, 22, 144, 0,
    11, 160, 0, 12, 160, 36, 23, 192, 0,
    13, 208, 0, 14, 208, 36, 24, 240, 0,
    15, 256, 0, 16, 256, 36, 25, 288, 0,
    1, 304, 0, 6, 312, 0,
  ]);
});

test("the scene renders the panel bar from frame_bottom and panel_button art", () => {
  const decoded = buildDecodedRenderAssets(createDecodableGeneratedPaArchive());
  const started = startSerfboundLocalGame({ data: dataSource });
  const world = started.game.world();
  const assets = buildLandscapeRenderAssets(decoded, started.game.landscape());

  const size = { width: 1280, height: 720 };
  const scene = createLandscapeScene({
    size,
    assets,
    scroll: { column: 0, row: 0 },
    world,
    panel: { buttons: panelButtonSprites({ buildPossibility: "none", roadMode: false }) },
  });

  const uiSprites = scene.sprites.filter((sprite) => sprite.layer === "ui");
  const backgroundPieces = uiSprites.filter((sprite) => sprite.key.startsWith("uifb:"));
  assert.equal(
    backgroundPieces.length,
    panelBackgroundLayout.length,
    "every background piece drawn",
  );

  const rect = panelBarRect(size, 2);
  const buttons = uiSprites.filter((sprite) => sprite.key.startsWith("uip:"));
  assert.equal(buttons.length, 5, "five panel buttons drawn");
  buttons.forEach((button, slot) => {
    assert.equal(button.x, rect.x + (64 + slot * 48) * 2, `slot ${slot} x position`);
    assert.equal(button.y, rect.y + 4 * 2, `slot ${slot} y position`);
    assert.equal(button.scale, 2, `slot ${slot} integer scale`);
  });

  assert.equal(buttons[0].key, "uip:0", "build slot inactive without a selection");
  assert.equal(buttons[1].key, "uip:8", "road slot shows BuildRoad");
});
