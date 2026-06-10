import assert from "node:assert/strict";
import { test } from "node:test";

import {
  SerfboundAiPlayer,
  computeGameChecksum,
  firstChecksumDivergence,
  restoreSerfboundLocalGame,
  startSerfboundLocalGame,
} from "@serfbound/engine";

// SB-22-01: per-tick state checksums — the lockstep determinism
// contract made measurable. Identical settings + seed + schedule must
// fingerprint identically; any divergence must surface at its tick.

const dataSource = {
  kind: "imported-dos-pa-catalog",
  archiveName: "SPAU.PA",
  byteLength: 1_282_805,
  entryCount: 4000,
  definedArchiveEntries: 3805,
  fixupCount: 252,
};

const settings = {
  data: dataSource,
  seedString: "1234567812345678",
  mapSize: 3,
  playerCount: 2,
  playerSupplies: [20, 20],
};

function startSimulation() {
  const started = startSerfboundLocalGame(settings);
  assert.equal(started.status, "started");
  const world = started.game.world();
  const engine = started.game.serfEngine();
  const ai = new SerfboundAiPlayer(world, engine, 1, (action) =>
    started.game.state.recordWorldAction(action),
  );
  return { game: started.game, world, engine, ai };
}

function checksumOf(simulation) {
  return computeGameChecksum({
    world: simulation.world,
    serfEngine: simulation.engine,
    state: simulation.game.state,
  });
}

const cadence = 1024;
const totalTicks = 40_960;

function runRecording(simulation, mutateAtTick) {
  const records = [];
  for (let tick = 16; tick <= totalTicks; tick += 16) {
    simulation.ai.update(tick);
    simulation.engine.update(tick);
    if (mutateAtTick !== undefined && tick === mutateAtTick) {
      simulation.world.heights[100] = (simulation.world.heights[100] + 1) & 0xff;
    }

    if (tick % cadence === 0) {
      records.push({ tick, checksum: checksumOf(simulation) });
    }
  }

  return records;
}

test("identical seed and schedule produce identical checksum streams", () => {
  const first = runRecording(startSimulation());
  const second = runRecording(startSimulation());
  assert.equal(first.length, totalTicks / cadence);
  assert.deepEqual(second, first);
  assert.equal(firstChecksumDivergence(first, second), null);
  // The streams are alive (the AI builds, serfs move): fingerprints
  // change over time.
  assert.equal(new Set(first.map((record) => record.checksum)).size > 1, true);
});

test("an injected single-field mutation is caught at its tick", () => {
  const clean = runRecording(startSimulation());
  const mutateAt = 20_000;
  const tampered = runRecording(startSimulation(), mutateAt);

  const divergence = firstChecksumDivergence(clean, tampered);
  assert.notEqual(divergence, null, "divergence detected");
  // The first checksum at or after the mutation reports it; everything
  // before matches.
  const expectedTick = Math.ceil(mutateAt / cadence) * cadence;
  assert.equal(divergence, expectedTick);
  const beforeClean = clean.filter((record) => record.tick < expectedTick);
  const beforeTampered = tampered.filter((record) => record.tick < expectedTick);
  assert.deepEqual(beforeTampered, beforeClean);
});

test("the world-action log replays deterministically across restores", () => {
  // Lockstep peers agree because the same inputs materialize the same
  // state. The save model replays the recorded action log (in-flight
  // serf-driven state is not serialized — the recorded Phase 13
  // limitation — so a live world and its replay differ by simulation
  // effects); what must hold is that the replay itself is
  // deterministic: two restores of one snapshot fingerprint
  // identically, including their re-dispatched serf engines.
  const live = startSimulation();
  for (let tick = 16; tick <= totalTicks; tick += 16) {
    live.ai.update(tick);
    live.engine.update(tick);
  }

  const snapshot = live.game.snapshot();
  const restoredA = restoreSerfboundLocalGame(snapshot);
  const restoredB = restoreSerfboundLocalGame(structuredClone(snapshot));
  assert.equal(restoredA.status, "started");
  assert.equal(restoredB.status, "started");

  const fingerprint = (restored) =>
    computeGameChecksum({
      world: restored.game.world(),
      serfEngine: restored.game.serfEngine(),
      state: restored.game.state,
    });
  assert.equal(fingerprint(restoredA), fingerprint(restoredB));
});

test("checksum cost stays negligible at gameplay cadence", () => {
  const simulation = startSimulation();
  for (let tick = 16; tick <= 8192; tick += 16) {
    simulation.ai.update(tick);
    simulation.engine.update(tick);
  }

  const begin = performance.now();
  for (let round = 0; round < 100; round += 1) {
    checksumOf(simulation);
  }

  const perChecksumMs = (performance.now() - begin) / 100;
  // A size-3 world fingerprints in well under a frame; the guard is
  // generous against CI noise.
  assert.equal(perChecksumMs < 10, true, `checksum took ${perChecksumMs.toFixed(2)}ms`);
});
