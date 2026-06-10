import assert from "node:assert/strict";
import { test } from "node:test";

import {
  LockstepSession,
  computeGameChecksum,
  firstChecksumDivergence,
  startSerfboundLocalGame,
} from "@serfbound/engine";

// SB-22-02: the lockstep session core — two full simulations driven by
// tick-stamped action bundles agree exactly, under jitter, reversed
// arrival, and stalls.

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

const turnTicks = 64;
const inputDelayTurns = 2;

// Discover valid castle sites once on a probe world (applied in player
// order, matching lockstep execution order).
function discoverCastleSites() {
  const probe = startSerfboundLocalGame(settings).game.world();
  let first = null;
  let second = null;
  for (let position = 0; position < probe.tileCount; position += 1) {
    if (first === null) {
      if (probe.buildCastle(position, 0) !== null) {
        first = position;
      }
    } else if (probe.buildCastle(position, 1) !== null) {
      second = position;
      break;
    }
  }

  assert.notEqual(first, null);
  assert.notEqual(second, null);
  return { first, second };
}

function createPeer(localPlayer) {
  const started = startSerfboundLocalGame(settings);
  assert.equal(started.status, "started");
  return {
    localPlayer,
    game: started.game,
    world: started.game.world(),
    engine: started.game.serfEngine(),
    session: new LockstepSession({ localPlayer, players: [0, 1], turnTicks, inputDelayTurns }),
    records: [],
    outcomes: [],
    stalledTurns: 0,
  };
}

// Drive both peers turn by turn over a fake network. script[player] maps
// localTurn -> actions; delayFor(step) is the delivery delay in wall
// steps for bundles sent at that step.
function runLockstep(script, delayFor, totalTurns) {
  const peers = [createPeer(0), createPeer(1)];
  let inFlight = [];
  const horizon = totalTurns + 64;
  for (let step = 0; step < horizon; step += 1) {
    for (const peer of peers) {
      if (peer.session.localTurn < totalTurns) {
        for (const action of script[peer.localPlayer]?.[peer.session.localTurn] ?? []) {
          peer.session.submit(action);
        }

        const bundle = peer.session.completeTurn();
        for (const other of peers) {
          if (other !== peer) {
            inFlight.push({ deliverAt: step + delayFor(step), target: other, bundle });
          }
        }
      }
    }

    const deliveries = inFlight.filter((message) => message.deliverAt <= step);
    inFlight = inFlight.filter((message) => message.deliverAt > step);
    for (const message of deliveries) {
      message.target.session.receive(message.bundle);
    }

    for (const peer of peers) {
      // Classic lockstep pacing: the simulation consumes one turn per
      // wall step once inputs allow; falling behind that target is a
      // (network) stall, and late bundles catch up in bursts.
      const targetTurn = Math.min(step, totalTurns - 1);
      while (
        peer.session.executedTurn < targetTurn &&
        peer.session.readyThroughTurn() > peer.session.executedTurn
      ) {
        for (const executed of peer.session.executeNextTurn(peer.world)) {
          peer.outcomes.push(
            `${peer.session.executedTurn}:${executed.action.kind}:` +
              (executed.outcome.ok ? executed.outcome.effect : executed.outcome.reason),
          );
        }

        const startTick = peer.session.turnStartTick(peer.session.executedTurn);
        for (let tick = startTick + 16; tick <= startTick + turnTicks; tick += 16) {
          peer.engine.update(tick);
        }

        if ((peer.session.executedTurn + 1) % 16 === 0) {
          peer.records.push({
            tick: startTick + turnTicks,
            checksum: computeGameChecksum({
              world: peer.world,
              serfEngine: peer.engine,
            }),
          });
        }
      }

      if (peer.session.executedTurn < targetTurn) {
        peer.stalledTurns += 1;
      }
    }
  }

  return peers;
}

test("two peers play one lockstep game with matching checksum streams", () => {
  const sites = discoverCastleSites();
  const script = {
    0: { 1: [{ kind: "build-castle", position: sites.first, player: 0 }] },
    1: { 4: [{ kind: "build-castle", position: sites.second, player: 1 }] },
  };
  // Jittery but within the input-delay window: 0-1 wall steps.
  const peers = runLockstep(script, (step) => step % 2, 192);

  assert.equal(peers[0].session.executedTurn, 191);
  assert.equal(peers[1].session.executedTurn, 191);
  assert.equal(peers[0].records.length, 12);
  assert.deepEqual(peers[1].records, peers[0].records);
  assert.equal(firstChecksumDivergence(peers[0].records, peers[1].records), null);
  // Both castles stand on both peers.
  for (const peer of peers) {
    assert.equal(peer.world.players[0].hasCastle, true);
    assert.equal(peer.world.players[1].hasCastle, true);
  }

  // No stalls inside the delay window.
  assert.equal(peers[0].stalledTurns, 0);
  assert.equal(peers[1].stalledTurns, 0);
});

test("same-turn actions execute in player order regardless of arrival", () => {
  const sites = discoverCastleSites();
  // Both players schedule their castle in the same local turn — the
  // bundles land in the same execution turn.
  const script = {
    0: {
      2: [
        { kind: "build-castle", position: sites.first, player: 0 },
        // A deliberately invalid follow-up rejects identically on both
        // peers (deterministic rejection is a valid outcome).
        { kind: "build-flag", position: 0, player: 0 },
      ],
    },
    1: { 2: [{ kind: "build-castle", position: sites.second, player: 1 }] },
  };
  // Asymmetric delays: peer 1 receives bundles late (still in-window
  // relative to the hold rule) and out of phase with peer 0.
  const peers = runLockstep(script, (step) => (step % 3 === 0 ? 1 : 0), 96);

  assert.deepEqual(peers[1].outcomes, peers[0].outcomes);
  assert.equal(
    peers[0].outcomes.some((entry) => entry.includes("build-flag:invalid-build-position")),
    true,
    "the invalid action rejected deterministically",
  );
  assert.deepEqual(peers[1].records, peers[0].records);
});

test("late bundles stall the simulation instead of breaking it", () => {
  const sites = discoverCastleSites();
  const script = {
    0: { 1: [{ kind: "build-castle", position: sites.first, player: 0 }] },
    1: {},
  };
  // Every bundle takes 8 wall steps — far beyond the 2-turn input
  // delay: peers must hold repeatedly, then catch up and agree.
  const peers = runLockstep(script, () => 8, 96);

  assert.equal(peers[0].stalledTurns > 0, true, "peer 0 held for missing bundles");
  assert.equal(peers[1].stalledTurns > 0, true, "peer 1 held for missing bundles");
  assert.equal(peers[0].session.executedTurn, 95);
  assert.equal(peers[1].session.executedTurn, 95);
  assert.deepEqual(peers[1].records, peers[0].records);
});

test("bootstrap turns below the input delay execute empty", () => {
  const session = new LockstepSession({ localPlayer: 0, players: [0, 1], inputDelayTurns: 2 });
  // Nothing received yet: turns 0 and 1 are implicitly ready and empty.
  assert.equal(session.readyThroughTurn(), 1);
  assert.deepEqual(session.actionsForTurn(0), []);
  assert.equal(session.stalled, false);
});
