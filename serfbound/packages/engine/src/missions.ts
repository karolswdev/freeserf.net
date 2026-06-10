import {
  startSerfboundLocalGame,
  type SerfboundLocalGameDataSource,
  type SerfboundLocalGameStartResult,
} from "./local-game.js";
import { applyWorldAction, type SerfboundWorldAction } from "./world-commands.js";

// The original campaign, ported exactly from Freeserf.Core/Mission.cs:
// mission names, map seeds, and player presets
// (character, intelligence, supplies, reproduction, castle position).

export type MissionPlayerPreset = {
  readonly character: number;
  readonly intelligence: number;
  readonly supplies: number;
  readonly reproduction: number;
  readonly castle: { readonly column: number; readonly row: number } | null;
};

export type SerfboundMission = {
  readonly name: string;
  readonly seedString: string;
  readonly players: readonly MissionPlayerPreset[];
};

function preset(
  character: number,
  intelligence: number,
  supplies: number,
  reproduction: number,
  castle: { column: number; row: number } | null = null,
): MissionPlayerPreset {
  return { character, intelligence, supplies, reproduction, castle };
}

export const serfboundMissions: readonly SerfboundMission[] = [
  { name: "START", seedString: "8667715887436237", players: [preset(12, 40, 35, 30), preset(1, 10, 5, 30)] },
  { name: "STATION", seedString: "2831713285431227", players: [preset(12, 40, 30, 40), preset(2, 12, 15, 30), preset(3, 14, 15, 30)] },
  { name: "UNITY", seedString: "4632253338621228", players: [preset(12, 40, 30, 30), preset(2, 18, 10, 25), preset(4, 18, 10, 25)] },
  { name: "WAVE", seedString: "8447342476811762", players: [preset(12, 40, 25, 40), preset(2, 16, 20, 30)] },
  { name: "EXPORT", seedString: "4276472414845177", players: [preset(12, 40, 30, 30), preset(3, 16, 25, 20), preset(4, 16, 25, 20)] },
  { name: "OPTION", seedString: "2333577877517478", players: [preset(12, 40, 30, 30), preset(3, 20, 12, 14), preset(5, 20, 12, 14)] },
  { name: "RECORD", seedString: "1416541231242884", players: [preset(12, 40, 30, 40), preset(3, 22, 30, 30)] },
  { name: "SCALE", seedString: "7845187715476348", players: [preset(12, 40, 25, 30), preset(4, 23, 25, 30), preset(6, 24, 25, 30)] },
  { name: "SIGN", seedString: "5185768873118642", players: [preset(12, 40, 25, 40), preset(4, 26, 13, 30), preset(5, 28, 13, 30), preset(6, 30, 13, 30)] },
  { name: "ACORN", seedString: "3183215728814883", players: [preset(12, 40, 20, 16, { column: 28, row: 14 }), preset(4, 30, 19, 20, { column: 5, row: 47 })] },
  { name: "CHOPPER", seedString: "4376241846215474", players: [preset(12, 40, 16, 20, { column: 16, row: 42 }), preset(5, 33, 10, 20, { column: 52, row: 25 }), preset(7, 34, 13, 20, { column: 23, row: 12 })] },
  { name: "GATE", seedString: "6371557668231277", players: [preset(12, 40, 23, 27, { column: 53, row: 13 }), preset(5, 27, 17, 24, { column: 27, row: 10 }), preset(6, 27, 13, 24, { column: 29, row: 38 }), preset(7, 27, 13, 24, { column: 15, row: 32 })] },
  { name: "ISLAND", seedString: "8473352672411117", players: [preset(12, 40, 24, 20, { column: 7, row: 26 }), preset(5, 20, 30, 20, { column: 2, row: 10 })] },
  { name: "LEGION", seedString: "1167854231884464", players: [preset(12, 40, 20, 23, { column: 19, row: 3 }), preset(6, 28, 16, 20, { column: 55, row: 7 }), preset(8, 28, 16, 20, { column: 55, row: 46 })] },
  { name: "PIECE", seedString: "2571462671725414", players: [preset(12, 40, 20, 17, { column: 41, row: 5 }), preset(6, 40, 23, 20, { column: 19, row: 49 }), preset(7, 37, 20, 20, { column: 58, row: 52 }), preset(8, 40, 15, 15, { column: 43, row: 31 })] },
  { name: "RIVAL", seedString: "4563653871271587", players: [preset(12, 40, 26, 23, { column: 36, row: 63 }), preset(6, 28, 29, 40, { column: 14, row: 15 })] },
  { name: "SAVAGE", seedString: "7212145428156114", players: [preset(12, 40, 25, 12, { column: 63, row: 59 }), preset(7, 29, 17, 10, { column: 29, row: 24 }), preset(8, 29, 17, 10, { column: 39, row: 26 }), preset(9, 32, 17, 10, { column: 42, row: 49 })] },
  { name: "XAVER", seedString: "4276472414435177", players: [preset(12, 40, 25, 40, { column: 15, row: 0 }), preset(7, 40, 30, 35, { column: 34, row: 48 }), preset(9, 30, 30, 35, { column: 58, row: 5 })] },
  { name: "BLADE", seedString: "7142748441424786", players: [preset(12, 40, 30, 20, { column: 13, row: 37 }), preset(7, 40, 20, 20, { column: 32, row: 34 })] },
  { name: "BEACON", seedString: "6882188351133886", players: [preset(12, 40, 9, 10, { column: 14, row: 42 }), preset(8, 40, 16, 22, { column: 62, row: 1 }), preset(9, 40, 16, 23, { column: 32, row: 14 })] },
  { name: "PASTURE", seedString: "7742136435163436", players: [preset(12, 40, 20, 11, { column: 38, row: 17 }), preset(8, 30, 22, 13, { column: 32, row: 51 }), preset(9, 30, 23, 13, { column: 1, row: 50 }), preset(10, 30, 21, 13, { column: 4, row: 9 })] },
  { name: "OMNUS", seedString: "6764387728224725", players: [preset(12, 40, 20, 40, { column: 42, row: 20 }), preset(8, 36, 25, 40, { column: 48, row: 47 })] },
  { name: "TRIBUTE", seedString: "5848744734731253", players: [preset(12, 40, 5, 11, { column: 53, row: 1 }), preset(9, 35, 30, 10, { column: 20, row: 2 }), preset(10, 37, 30, 10, { column: 16, row: 55 })] },
  { name: "FOUNTAIN", seedString: "6183541838474434", players: [preset(12, 40, 20, 12, { column: 3, row: 34 }), preset(9, 30, 25, 10, { column: 47, row: 41 }), preset(10, 30, 26, 10, { column: 42, row: 52 })] },
  { name: "CHUDE", seedString: "7633126817245833", players: [preset(12, 40, 20, 40, { column: 23, row: 38 }), preset(9, 40, 25, 40, { column: 57, row: 52 })] },
  { name: "TRAILER", seedString: "5554144773646312", players: [preset(12, 40, 20, 30, { column: 29, row: 11 }), preset(10, 38, 30, 35, { column: 15, row: 40 })] },
  { name: "CANYON", seedString: "3122431112682557", players: [preset(12, 40, 18, 28, { column: 49, row: 53 }), preset(10, 39, 25, 40, { column: 14, row: 53 })] },
  { name: "REPRESS", seedString: "2568412624848266", players: [preset(12, 40, 20, 40, { column: 44, row: 39 }), preset(10, 39, 25, 40, { column: 44, row: 63 })] },
  { name: "YOKI", seedString: "3736685353284538", players: [preset(12, 40, 5, 22, { column: 53, row: 8 }), preset(11, 40, 15, 20, { column: 30, row: 22 })] },
  { name: "PASSIVE", seedString: "5471458635555317", players: [preset(12, 40, 5, 20, { column: 25, row: 46 }), preset(11, 40, 20, 20, { column: 51, row: 42 })] },
  { name: "PYRDACOR", seedString: "5079726461636072", players: [preset(12, 40, 0, 30, { column: 54, row: 63 }), preset(11, 40, 18, 16, { column: 55, row: 25 })] },
];

export function findSerfboundMission(name: string): SerfboundMission | undefined {
  return serfboundMissions.find((mission) => mission.name === name);
}

// Start a campaign mission: the mission seed and player presets configure
// the game; AI presets with pinned castles found them at start (recorded
// as world actions so saves replay identically). Presets without castles
// leave their AI slot to found one (SB-18-02).
export function startSerfboundMission(
  missionName: string,
  data: SerfboundLocalGameDataSource,
): SerfboundLocalGameStartResult & { mission?: SerfboundMission } {
  const mission = findSerfboundMission(missionName);
  if (mission === undefined) {
    return {
      status: "rejected",
      reason: "invalid-seed",
      message: `Unknown mission: ${missionName}.`,
    };
  }

  const result = startSerfboundLocalGame({
    data,
    seedString: mission.seedString,
    initialSupplies: mission.players[0]!.supplies,
    playerCount: mission.players.length,
    playerSupplies: mission.players.map((player) => player.supplies),
  });

  if (result.status !== "started") {
    return result;
  }

  const world = result.game.world();
  mission.players.forEach((player, playerIndex) => {
    if (playerIndex === 0 || player.castle === null) {
      return;
    }

    // The preset castle position, or the nearest founding-valid spot on
    // the generated map (the original positions assume the same seed).
    const wanted = world.geometry.position(player.castle.column, player.castle.row);
    let position: number | null = null;
    for (let offset = 0; offset < 295 && position === null; offset += 1) {
      const candidate = world.positionAddSpirally(wanted, offset);
      if (world.canBuildCastle(candidate, playerIndex)) {
        position = candidate;
      }
    }

    if (position !== null) {
      const action: SerfboundWorldAction = {
        kind: "build-castle",
        position,
        player: playerIndex,
      };
      const outcome = applyWorldAction(world, action);
      if (outcome.ok) {
        result.game.state.recordWorldAction(action);
      }
    }
  });

  return { ...result, mission };
}
