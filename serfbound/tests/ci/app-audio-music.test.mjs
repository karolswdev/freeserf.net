import assert from "node:assert/strict";
import { test } from "node:test";

import { parseXmi } from "@serfbound/assets";
import { SerfboundAudioService, buildDecodedRenderAssets } from "@serfbound/app";
import { createDecodableGeneratedPaArchive } from "@serfbound/test-support";

test("XMI parsing follows the reference chunk walk and event model", () => {
  const decoded = buildDecodedRenderAssets(createDecodableGeneratedPaArchive());
  assert.notEqual(decoded.rawMusic, null, "the fixture track parses");
  const events = decoded.rawMusic;

  // The tempo meta lands first.
  assert.deepEqual(events[0], { kind: "tempo", tempo: 500000, time: 0 });
  // The instrument change for channel 0.
  assert.deepEqual(events[1], { kind: "instrument", channel: 0, program: 5, time: 0 });

  // Two notes, each split into on/off with XMI duration semantics:
  // tempo 500000 -> 60 ticks per quarternote; 48 ticks = 400ms.
  const noteOns = events.filter((event) => event.kind === "noteOn");
  const noteOffs = events.filter((event) => event.kind === "noteOff");
  assert.equal(noteOns.length, 2);
  assert.equal(noteOffs.length, 2);
  assert.equal(noteOns[0].note, 60);
  assert.equal(noteOns[0].velocity, 100);
  assert.equal(noteOns[0].time, 0);
  assert.equal(Math.round(noteOffs[0].time), 400, "48 ticks at 500000us/qn");
  // The second note starts after the 48-tick interval byte.
  assert.equal(Math.round(noteOns[1].time), 400);
  assert.equal(noteOns[1].note, 64);
  assert.equal(Math.round(noteOffs[1].time), 600, "24-tick duration");

  // The event list sorts by time with stable ties.
  for (let index = 1; index < events.length; index += 1) {
    assert.equal(events[index - 1].time <= events[index].time, true, "sorted");
  }
});

test("malformed XMI data parses to null, not a crash", () => {
  assert.equal(parseXmi(Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8])), null);
  // A two-track XDIR is unsupported, like the reference.
  const twoTracks = Uint8Array.from([
    70, 79, 82, 77, 0, 0, 0, 0, 88, 68, 73, 82, 73, 78, 70, 79, 2, 0, 0, 0, 2, 0,
  ]);
  assert.equal(parseXmi(twoTracks), null);
});

test("the audio service tracks the music state machine", () => {
  const service = new SerfboundAudioService();
  assert.equal(service.musicState, "silent");

  const decoded = buildDecodedRenderAssets(createDecodableGeneratedPaArchive());
  service.loadMusic(decoded.rawMusic);
  assert.equal(service.musicState, "ready");
  assert.equal(service.musicEventCount > 0, true);

  // Without a real AudioContext (CI) playback declines gracefully.
  assert.equal(service.playMusic(), false);
  assert.equal(service.musicState, "ready");

  service.loadMusic(null);
  assert.equal(service.musicState, "silent");
});
