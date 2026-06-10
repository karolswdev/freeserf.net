import { findShortestRoad } from "./pathfinder.js";
import { buildingType, type BuildingTypeValue, type SerfboundGameWorld } from "./game-world.js";
import type { SerfboundSerfEngine } from "./serfs.js";
import { applyWorldAction, type SerfboundWorldAction } from "./world-commands.js";

// The classic AI, staged like the reference AI.cs: found a castle, then
// establish the economy in the reference build order, expanding through
// connected roads. Decisions are logged so seeded runs fixture exactly.

// AI.cs opening build order, condensed to the chains the engine runs.
const establishmentPlan: readonly BuildingTypeValue[] = [
  buildingType.lumberjack,
  buildingType.sawmill,
  buildingType.stonecutter,
  buildingType.forester,
  buildingType.hut,
  buildingType.farm,
  buildingType.mill,
  buildingType.baker,
];

export class SerfboundAiPlayer {
  readonly world: SerfboundGameWorld;
  readonly engine: SerfboundSerfEngine;
  readonly playerIndex: number;
  readonly #recordAction: (action: SerfboundWorldAction) => void;
  // The decision log: every action the AI takes, in order (fixtures).
  readonly decisions: string[] = [];
  #nextActionTick = 0;
  #castleAnchorOffset = 0;

  constructor(
    world: SerfboundGameWorld,
    engine: SerfboundSerfEngine,
    playerIndex: number,
    recordAction: (action: SerfboundWorldAction) => void,
  ) {
    this.world = world;
    this.engine = engine;
    this.playerIndex = playerIndex;
    this.#recordAction = recordAction;
  }

  // One staged decision per pacing window (the reference AI thinks in
  // games ticks, not frames).
  update(gameTick: number): void {
    if (gameTick < this.#nextActionTick) {
      return;
    }

    const player = this.world.players[this.playerIndex];
    if (player === undefined || player.defeated) {
      return;
    }

    if (!player.hasCastle) {
      this.#foundCastle(gameTick);
      this.#nextActionTick = gameTick + 512;
      return;
    }

    this.#establishEconomy(gameTick);
    this.#nextActionTick = gameTick + 1024;
  }

  #apply(action: SerfboundWorldAction): boolean {
    const outcome = applyWorldAction(this.world, action);
    if (outcome.ok) {
      this.#recordAction(action);
    }

    return outcome.ok;
  }

  // Castle founding: walk the deterministic anchor lattice until a
  // founding-valid spot accepts (players spread by index).
  #foundCastle(gameTick: number): void {
    const columns = this.world.geometry.columns;
    const rows = this.world.geometry.rows;
    const anchorColumn = (8 + this.playerIndex * 24) % columns;
    const anchorRow = (12 + this.playerIndex * 20) % rows;
    const anchor = this.world.geometry.position(anchorColumn, anchorRow);

    for (let offset = this.#castleAnchorOffset; offset < 295; offset += 1) {
      const candidate = this.world.positionAddSpirally(anchor, offset);
      if (this.world.canBuildCastle(candidate, this.playerIndex)) {
        if (
          this.#apply({ kind: "build-castle", position: candidate, player: this.playerIndex })
        ) {
          this.decisions.push(`found-castle:${candidate}:${gameTick}`);
        }

        return;
      }
    }

    // The anchor neighborhood is full; restart the scan next window.
    this.#castleAnchorOffset = 0;
  }

  // Establishment: the next missing plan building, sited near the castle
  // and connected to the castle flag.
  #establishEconomy(gameTick: number): void {
    const player = this.world.players[this.playerIndex]!;
    const castlePosition = player.castlePosition!;
    const built = new Set(
      [...this.world.buildings.values()]
        .filter((building) => building.player === this.playerIndex)
        .map((building) => building.type),
    );

    const nextType = establishmentPlan.find((type) => !built.has(type));
    if (nextType === undefined) {
      return;
    }

    for (let offset = 1; offset < 151; offset += 1) {
      const site = this.world.positionAddSpirally(castlePosition, offset);
      if (!this.world.canBuildBuilding(site, nextType, this.playerIndex)) {
        continue;
      }

      if (
        !this.#apply({
          kind: "build-building",
          position: site,
          building: nextType,
          player: this.playerIndex,
          atTick: gameTick,
        })
      ) {
        continue;
      }

      const building = [...this.world.buildings.values()].reduce((a, b) =>
        a.index > b.index ? a : b,
      );
      const castleFlagPosition = this.world.move(castlePosition, "DownRight");
      const buildingFlag = this.world.flags.get(building.flagIndex);
      if (buildingFlag !== undefined && buildingFlag.position !== castleFlagPosition) {
        const road = findShortestRoad(this.world, castleFlagPosition, buildingFlag.position);
        if (
          road !== null &&
          this.#apply({
            kind: "build-road",
            start: road.start,
            directions: road.directions,
            player: this.playerIndex,
          })
        ) {
          // Builders and materials follow over the new road.
          this.engine.dispatchConstructionLogistics(building, gameTick);
        }
      }

      this.decisions.push(`build:${nextType}:${site}:${gameTick}`);
      return;
    }
  }
}
