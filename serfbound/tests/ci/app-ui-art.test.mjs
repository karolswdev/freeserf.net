import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DosPaArchive,
  decodeUiFontShadowGlyph,
  layoutUiText,
  mapCharacterToGlyphIndex,
  uiFontAdvance,
} from "@serfbound/assets";
import {
  buildDecodedRenderAssets,
  buildLandscapeRenderAssets,
  createLandscapeScene,
} from "@serfbound/app";
import {
  SerfboundCommandRouter,
  startSerfboundLocalGame,
} from "@serfbound/engine";
import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

const dataSource = {
  kind: "imported-dos-pa-catalog",
  archiveName: "SPAU.PA",
  byteLength: 1_282_805,
  entryCount: 4000,
  definedArchiveEntries: 3805,
  fixupCount: 252,
};

test("the glyph mapping matches TextRenderer.MapCharacterToSpriteIndex", () => {
  assert.equal(mapCharacterToGlyphIndex("A"), 0);
  assert.equal(mapCharacterToGlyphIndex("Z"), 25);
  assert.equal(mapCharacterToGlyphIndex("a"), 0);
  assert.equal(mapCharacterToGlyphIndex("z"), 25);
  assert.equal(mapCharacterToGlyphIndex("ä"), 26);
  assert.equal(mapCharacterToGlyphIndex("Ö"), 27);
  assert.equal(mapCharacterToGlyphIndex("ü"), 28);
  assert.equal(mapCharacterToGlyphIndex("0"), 29);
  assert.equal(mapCharacterToGlyphIndex("9"), 38);
  assert.equal(mapCharacterToGlyphIndex("."), 39);
  assert.equal(mapCharacterToGlyphIndex("-"), 40);
  assert.equal(mapCharacterToGlyphIndex(":"), 41);
  assert.equal(mapCharacterToGlyphIndex("?"), 42);
  assert.equal(mapCharacterToGlyphIndex("%"), 43);
  // Invalid characters print as '?'.
  assert.equal(mapCharacterToGlyphIndex("!"), 42);
});

test("text layout advances 8 pixels per character and skips spaces", () => {
  const placements = layoutUiText("AB 12");
  assert.equal(placements.length, 4);
  assert.deepEqual(
    placements.map((placement) => placement.x),
    [0, uiFontAdvance, 3 * uiFontAdvance, 4 * uiFontAdvance],
  );
  assert.deepEqual(
    placements.map((placement) => placement.glyphIndex),
    [0, 1, 30, 31],
  );
});

test("the font-shadow set decodes black with the font's glyph coverage", () => {
  const archive = new DosPaArchive(createDecodableGeneratedPaArchive());
  const shadow = decodeUiFontShadowGlyph(archive, 0);
  assert.notEqual(shadow, null);
  let visible = 0;
  for (let pixel = 0; pixel < shadow.rgba.length; pixel += 4) {
    if (shadow.rgba[pixel + 3] !== 0) {
      visible += 1;
      assert.deepEqual(
        [shadow.rgba[pixel], shadow.rgba[pixel + 1], shadow.rgba[pixel + 2]],
        [0, 0, 0],
        "shadow pixels tint black like the reference",
      );
    }
  }
  assert.equal(visible > 0, true, "shadow glyph has coverage");
});

test("decoded UI art lands in the render assets and the landscape atlas", () => {
  const decoded = buildDecodedRenderAssets(createDecodableGeneratedPaArchive());
  assert.notEqual(decoded, null);
  assert.equal(decoded.rawFontGlyphs.filter((glyph) => glyph !== null).length, 44);
  assert.equal(decoded.rawFontShadows.filter((glyph) => glyph !== null).length, 44);
  assert.equal(decoded.rawIcons.size, 65);
  assert.equal(decoded.rawPanelButtons.size, 26);
  assert.equal(decoded.rawPopupFrames.filter((frame) => frame !== null).length, 4);
  assert.equal(decoded.rawBottomFrames.filter((frame) => frame !== null).length, 26);
  assert.notEqual(decoded.rawCursor, null);

  const started = startSerfboundLocalGame({ data: dataSource });
  const assets = buildLandscapeRenderAssets(decoded, started.game.landscape());
  assert.notEqual(assets, null);
  assert.equal(assets.uiGlyphCount, 44);
  assert.equal(assets.uiIconCount, 65);
  assert.notEqual(assets.atlas.regions["uif:0"], undefined, "font glyph in atlas");
  assert.notEqual(assets.atlas.regions["uifs:0"], undefined, "font shadow in atlas");
  assert.notEqual(assets.atlas.regions["uii:0"], undefined, "icon in atlas");
  assert.notEqual(assets.atlas.regions["uip:0"], undefined, "panel button in atlas");
  // All four Box.cs border pieces at their reference sizes (full-height
  // sides in the landscape atlas; the pre-game atlas crops them).
  assert.notEqual(assets.atlas.regions["uifr:0"], undefined, "frame piece in atlas");
  assert.equal(assets.atlas.regions["uifr:0"].height, 9, "top bar 144x9");
  assert.equal(assets.atlas.regions["uifr:1"].height, 7, "bottom bar 144x7");
  assert.equal(assets.atlas.regions["uifr:2"].height, 144, "left side 8x144");
  assert.equal(assets.atlas.regions["uifr:3"].width, 8, "right side 8x144");
  assert.notEqual(assets.atlas.regions["uic"], undefined, "cursor in atlas");
});

test("the UI overlay renders text, icon, frame, and cursor at 2x over the world", () => {
  const decoded = buildDecodedRenderAssets(createDecodableGeneratedPaArchive());
  const started = startSerfboundLocalGame({ data: dataSource });
  const world = started.game.world();
  const assets = buildLandscapeRenderAssets(decoded, started.game.landscape());
  const router = new SerfboundCommandRouter(started.game.state, world);

  const scene = createLandscapeScene({
    size: { width: 1280, height: 720 },
    assets,
    scroll: { column: 0, row: 0 },
    world,
  });

  const uiSprites = scene.sprites.filter((sprite) => sprite.layer === "ui");
  assert.equal(uiSprites.length > 0, true, "ui layer populated");
  assert.equal(
    uiSprites.every((sprite) => sprite.scale === 2),
    true,
    "ui chrome renders at 2x integer scale",
  );
  assert.equal(
    uiSprites.some((sprite) => sprite.key.startsWith("uif:")),
    true,
    "decoded font text on screen",
  );

  // Every glyph draws over its black font-shadow twin at the same spot,
  // pushed shadow-first so the stable sort keeps the glyph on top.
  const glyphSprites = uiSprites.filter((sprite) => /^uif:\d+$/.test(sprite.key));
  for (const glyph of glyphSprites) {
    const shadowIndex = scene.sprites.findIndex(
      (sprite) =>
        sprite.key === glyph.key.replace("uif:", "uifs:") &&
        sprite.x === glyph.x &&
        sprite.y === glyph.y,
    );
    assert.notEqual(shadowIndex, -1, `shadow under ${glyph.key}`);
    assert.equal(
      shadowIndex < scene.sprites.indexOf(glyph),
      true,
      `shadow sorts under ${glyph.key}`,
    );
  }
  assert.equal(uiSprites.some((sprite) => sprite.key === "uii:0"), true, "icon on screen");
  assert.equal(uiSprites.some((sprite) => sprite.key === "uic"), true, "cursor on screen");

  // The ui layer draws last: every ui sprite sorts after every map sprite.
  const lastMapIndex = scene.sprites.reduce(
    (last, sprite, index) => (sprite.layer === "ui" ? last : index),
    -1,
  );
  const firstUiIndex = scene.sprites.findIndex((sprite) => sprite.layer === "ui");
  assert.equal(firstUiIndex > lastMapIndex, true, "ui sprites sort above the map");

  void router;
});
