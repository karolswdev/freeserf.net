import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildDecodedRenderAssets,
  buildLandscapeRenderAssets,
  buildPopupPages,
  createLandscapeScene,
  mapBuildingSprite,
  popupBorderLayout,
  popupBuildItemAt,
  popupInterior,
  popupRect,
  resourceStatsLayout,
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

function decodedScene(popupKind) {
  const decoded = buildDecodedRenderAssets(createDecodableGeneratedPaArchive());
  const started = startSerfboundLocalGame({ data: dataSource });
  const world = started.game.world();
  const assets = buildLandscapeRenderAssets(decoded, started.game.landscape());
  return createLandscapeScene({
    size: { width: 1280, height: 720 },
    assets,
    scroll: { column: 0, row: 0 },
    world,
    popup: { kind: popupKind },
  });
}

test("the build pages carry the reference building positions", () => {
  // DrawBasicBuildingBox: stonecutter 24,22 / lumberjack 8,67 / flag 72,117.
  const basic = buildPopupPages.buildBasic;
  assert.deepEqual(
    basic.find((item) => item.building === 4),
    { building: 4, x: 24, y: 22 },
  );
  assert.deepEqual(
    basic.find((item) => item.building === 2),
    { building: 2, x: 8, y: 67 },
  );
  assert.deepEqual(
    basic.find((item) => item.building === "flag"),
    { building: "flag", x: 72, y: 117 },
  );
  // DrawAdv2BuildingBox: farm 72,10 / fortress 72,93.
  assert.deepEqual(
    buildPopupPages.buildAdv2.find((item) => item.building === 12),
    { building: 12, x: 72, y: 10 },
  );
  assert.deepEqual(
    buildPopupPages.buildAdv2.find((item) => item.building === 22),
    { building: 22, x: 72, y: 93 },
  );
});

test("the resources box mirrors DrawResourcesBox exactly", () => {
  assert.equal(resourceStatsLayout.length, 26, "all 26 resources listed");
  const lumber = resourceStatsLayout.find((entry) => entry.resource === 6);
  assert.deepEqual(lumber, {
    resource: 6, icon: 0x28, iconX: 16, iconY: 9, countX: 32, countY: 13,
  });
  const bread = resourceStatsLayout.find((entry) => entry.resource === 5);
  assert.deepEqual(bread, {
    resource: 5, icon: 0x27, iconX: 96, iconY: 121, countX: 112, countY: 125,
  });
});

test("popup hit testing finds build items and the flip button", () => {
  const rect = popupRect({ width: 1280, height: 720 }, 2);
  // Lumberjack at (8, 67) in the basic page.
  const lumberjack = popupBuildItemAt(rect, 2, "buildBasic", rect.x + 8 * 2 + 4, rect.y + 67 * 2 + 4);
  assert.deepEqual(lumberjack, { building: 2, x: 8, y: 67 });
  // The flip button at (8, 137).
  assert.equal(
    popupBuildItemAt(rect, 2, "buildBasic", rect.x + 8 * 2 + 4, rect.y + 137 * 2 + 4),
    "flip",
  );
  // Open space hits nothing.
  assert.equal(popupBuildItemAt(rect, 2, "buildBasic", rect.x + 4, rect.y + 4), null);
});

test("the popup border assembles the four Box.cs frame pieces", () => {
  // UI/Box.cs Border definitions, type 1: top 144x9 (sprite 0), left
  // 8x144 (sprite 2), right 8x144 (sprite 3), bottom 144x7 (sprite 1).
  const pieces = popupBorderLayout(144, 160);
  assert.deepEqual(pieces, [
    { sprite: 0, x: 0, y: 0, height: 9 },
    { sprite: 2, x: 0, y: 9, height: 144 },
    { sprite: 3, x: 136, y: 9, height: 144 },
    { sprite: 1, x: 0, y: 153, height: 7 },
  ]);

  // The condensed 128-tall init box crops the side pieces.
  const initPieces = popupBorderLayout(144, 128);
  assert.equal(initPieces[1].height, 112);
  assert.equal(initPieces[3].y, 121);

  // The rendered popup places all four pieces around the box.
  const scene = decodedScene("buildBasic");
  const uiSprites = scene.sprites.filter((sprite) => sprite.layer === "ui");
  const rect = popupRect({ width: 1280, height: 720 }, 2);
  for (const piece of pieces) {
    assert.equal(
      uiSprites.some(
        (sprite) =>
          sprite.key === `uifr:${piece.sprite}` &&
          sprite.x === rect.x + piece.x * 2 &&
          sprite.y === rect.y + piece.y * 2,
      ),
      true,
      `border piece ${piece.sprite} placed`,
    );
  }
});

test("the build popup renders building sprites at the reference layout", () => {
  const scene = decodedScene("buildBasic");
  const uiSprites = scene.sprites.filter((sprite) => sprite.layer === "ui");
  const rect = popupRect({ width: 1280, height: 720 }, 2);

  // The tiled background pattern fills the 128x144 interior between the
  // borders, inset by the border thickness.
  const pattern = uiSprites.filter((sprite) => sprite.key === "uii:310");
  assert.equal(pattern.length, 72, "8x9 interior tiles");
  assert.equal(
    pattern.every(
      (sprite) =>
        sprite.x >= rect.x + popupInterior.x * 2 && sprite.y >= rect.y + popupInterior.y * 2,
    ),
    true,
    "pattern tiles inset by the border",
  );

  // The lumberjack building sprite sits at the reference position.
  const lumberjackKey = `mo:${mapBuildingSprite[2]}`;
  const lumberjack = uiSprites.find((sprite) => sprite.key === lumberjackKey);
  assert.notEqual(lumberjack, undefined, "lumberjack sprite drawn");
  assert.equal(lumberjack.x, rect.x + 8 * 2);
  assert.equal(lumberjack.y, rect.y + 67 * 2);

  // The flag closes the page.
  assert.equal(uiSprites.some((sprite) => sprite.key === "obj:flag"), true);
});

test("the stats popup renders the resource icons with live counts", () => {
  const scene = decodedScene("stats");
  const uiSprites = scene.sprites.filter((sprite) => sprite.layer === "ui");

  // Every reference icon present.
  for (const entry of resourceStatsLayout) {
    assert.equal(
      uiSprites.some((sprite) => sprite.key === `uii:${entry.icon}`),
      true,
      `icon 0x${entry.icon.toString(16)} drawn`,
    );
  }

  // Counts render as font digits (glyphs 29..38).
  const digitGlyphs = uiSprites.filter((sprite) => {
    const match = sprite.key.match(/^uif:(\d+)$/);
    return match !== null && Number(match[1]) >= 29 && Number(match[1]) <= 38;
  });
  assert.equal(digitGlyphs.length > 0, true, "live counts in the game font");
});

test("the sett popup renders knight occupation rows and morale", () => {
  const scene = decodedScene("sett");
  const uiSprites = scene.sprites.filter((sprite) => sprite.layer === "ui");
  // The header and rows render as font glyphs; 'K' is glyph 10.
  assert.equal(
    uiSprites.some((sprite) => sprite.key === "uif:10"),
    true,
    "KNIGHTS header drawn",
  );
  assert.equal(uiSprites.filter((sprite) => sprite.key.startsWith("uif:")).length > 40, true);
});
