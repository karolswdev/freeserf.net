import assert from "node:assert/strict";
import { test } from "node:test";

import { sfxType } from "@serfbound/assets";
import {
  SerfboundAudioService,
  audioSettingsKey,
  buildDecodedRenderAssets,
  loadAudioSettings,
  saveAudioSettings,
  settAudioToggleAt,
  popupRect,
} from "@serfbound/app";
import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

function memoryStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
  };
}

test("audio settings round-trip through storage with safe defaults", () => {
  const storage = memoryStorage();
  assert.equal(loadAudioSettings(storage), null, "empty storage yields null");

  saveAudioSettings(storage, {
    sfxVolume: 0.5,
    sfxMuted: true,
    musicVolume: 0.8,
    musicMuted: false,
  });
  assert.deepEqual(loadAudioSettings(storage), {
    sfxVolume: 0.5,
    sfxMuted: true,
    musicVolume: 0.8,
    musicMuted: false,
  });

  // Corrupt entries degrade to null, not a crash.
  storage.setItem(audioSettingsKey, "{not json");
  assert.equal(loadAudioSettings(storage), null);
});

test("applied settings drive the service: muted SFX and music stay silent", () => {
  const service = new SerfboundAudioService();
  const decoded = buildDecodedRenderAssets(createDecodableGeneratedPaArchive());
  service.loadClips(decoded.rawSfx);
  service.loadMusic(decoded.rawMusic);

  service.applySettings({
    sfxVolume: 0.4,
    sfxMuted: true,
    musicVolume: 1,
    musicMuted: true,
  });
  assert.equal(service.sfxVolume, 0.4);
  assert.equal(service.playSfx(sfxType.click), false, "muted SFX plays nothing");
  assert.equal(service.lastSfx, null);
  assert.equal(service.playMusic(), false, "muted music plays nothing");

  const roundTrip = service.settings();
  assert.deepEqual(roundTrip, {
    sfxVolume: 0.4,
    sfxMuted: true,
    musicVolume: 1,
    musicMuted: true,
  });
});

test("the sett popup's audio row hit-tests SFX and MUSIC halves", () => {
  const rect = popupRect({ width: 1280, height: 720 }, 2);
  const rowY = rect.y + 146 * 2 + 4;
  assert.equal(settAudioToggleAt(rect, 2, rect.x + 20, rowY), "sfx");
  assert.equal(settAudioToggleAt(rect, 2, rect.x + 160, rowY), "music");
  assert.equal(settAudioToggleAt(rect, 2, rect.x + 20, rect.y + 60), null);
});

test("visibility changes are safe in any state", () => {
  const service = new SerfboundAudioService();
  // No context, locked, unavailable: setVisible must never throw.
  service.setVisible(false);
  service.setVisible(true);
  service.unlock(); // no AudioContext in Node -> unavailable
  service.setVisible(false);
  assert.equal(service.state, "unavailable");
});
