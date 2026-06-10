import assert from "node:assert/strict";
import { test } from "node:test";

import {
  convertSfxToPcm16,
  dosSfxLevel,
  sfxSampleRate,
  sfxType,
} from "@serfbound/assets";
import { SerfboundAudioService, buildDecodedRenderAssets } from "@serfbound/app";
import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

test("ConvertToWav parity: level shift, 0xFF scaling, 16-bit wrap", () => {
  // (byte + level) * 0xFF with C# short wrapping.
  const samples = convertSfxToPcm16(Uint8Array.from([0, 32, 100, 255]), dosSfxLevel);
  assert.equal(samples[0], ((0 - 32) * 0xff << 16) >> 16); // -8160
  assert.equal(samples[0], -8160);
  assert.equal(samples[1], 0); // level cancels exactly
  assert.equal(samples[2], (100 - 32) * 0xff); // 17340
  // (255 - 32) * 255 = 56865 wraps to a negative short.
  assert.equal(samples[3], ((223 * 0xff) << 16) >> 16);
  assert.equal(samples[3] < 0, true, "high bytes wrap like the C# short cast");
  assert.equal(sfxSampleRate, 8000, "DOS sounds play at 8000 Hz");
});

test("the fixture archive's sound entries decode into the render assets", () => {
  const decoded = buildDecodedRenderAssets(createDecodableGeneratedPaArchive());
  assert.notEqual(decoded, null);
  // The fixture defines clips 1, 2, 4, 8, 34, 42, 76.
  assert.equal(decoded.rawSfx.size, 7);
  assert.equal(decoded.rawSfx.has(sfxType.accepted), true);
  assert.equal(decoded.rawSfx.has(sfxType.click), true);
  assert.equal(decoded.rawSfx.has(sfxType.treeFall), true);
  assert.equal(decoded.rawSfx.get(sfxType.accepted).length, 64);
});

test("the audio service gates on gesture and tracks the event mapping", () => {
  const service = new SerfboundAudioService();
  assert.equal(service.state, "idle");

  const decoded = buildDecodedRenderAssets(createDecodableGeneratedPaArchive());
  service.loadClips(decoded.rawSfx);
  assert.equal(service.state, "locked", "clips loaded, waiting for a gesture");
  assert.equal(service.clipCount, 7);

  // Playback facts track even where WebAudio cannot run (CI).
  assert.equal(service.playSfx(sfxType.accepted), false, "locked context plays nothing");
  assert.equal(service.lastSfx, sfxType.accepted, "the mapping stays observable");
  assert.equal(service.playedCount, 1);

  // Unknown clips do not count.
  assert.equal(service.playSfx(999), false);
  assert.equal(service.playedCount, 1);

  // No AudioContext in Node: unlock degrades gracefully.
  service.unlock();
  assert.equal(service.state, "unavailable");

  // Muting suppresses the mapping.
  service.sfxMuted = true;
  service.playSfx(sfxType.click);
  assert.equal(service.lastSfx, sfxType.accepted);
});
