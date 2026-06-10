import { findShortestRoad } from "./pathfinder.js";
import {
  buildingType,
  isMilitaryBuildingType,
  type BuildingTypeValue,
  type SerfboundGameWorld,
} from "./game-world.js";
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

// The deeper economy the AI grows into once established (mines try
// opportunistically — they need mountain sites).
const expansionPlan: readonly BuildingTypeValue[] = [
  buildingType.pigFarm,
  buildingType.butcher,
  buildingType.steelSmelter,
  buildingType.weaponSmith,
  buildingType.toolMaker,
  buildingType.coalMine,
  buildingType.ironMine,
  buildingType.goldMine,
  buildingType.goldSmelter,
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
    this.#updateThreatLevels();
    this.#considerAttack(gameTick);
    this.#nextActionTick = gameTick + 1024;
  }

  // Building.ThreatLevel by enemy proximity, condensed to distance bands.
  #updateThreatLevels(): void {
    const enemyPositions = [...this.world.buildings.values()]
      .filter((building) => building.player !== this.playerIndex)
      .map((building) => building.position);
    if (enemyPositions.length === 0) {
      return;
    }

    for (const building of this.world.buildings.values()) {
      if (building.player !== this.playerIndex || !isMilitaryBuildingType(building.type)) {
        continue;
      }

      let nearest = Number.POSITIVE_INFINITY;
      for (const enemy of enemyPositions) {
        const dx = Math.abs(this.world.geometry.distanceX(building.position, enemy));
        const dy = Math.abs(this.world.geometry.distanceY(building.position, enemy));
        nearest = Math.min(nearest, Math.max(dx, dy));
      }

      building.threatLevel = nearest < 10 ? 3 : nearest < 18 ? 2 : nearest < 26 ? 1 : 0;
    }
  }

  // Military: with a knight surplus in stock, march on the closest enemy
  // post (the reference attack flow, condensed to the engine's
  // launchAttack; attack pacing keeps assaults occasional).
  #attackCooldownUntil = 0;

  #considerAttack(gameTick: number): void {
    if (gameTick < this.#attackCooldownUntil) {
      return;
    }

    const inventory = this.world.inventoryForPlayer(this.playerIndex);
    if (inventory === null || inventory.knights < 4) {
      return;
    }

    const castlePosition = this.world.players[this.playerIndex]!.castlePosition!;
    let target: { index: number; distance: number } | null = null;
    for (const building of this.world.buildings.values()) {
      if (
        building.player === this.playerIndex ||
        !building.isDone ||
        (!isMilitaryBuildingType(building.type) && building.type !== buildingType.castle)
      ) {
        continue;
      }

      const dx = Math.abs(this.world.geometry.distanceX(castlePosition, building.position));
      const dy = Math.abs(this.world.geometry.distanceY(castlePosition, building.position));
      const distance = Math.max(dx, dy);
      if (target === null || distance < target.distance) {
        target = { index: building.index, distance };
      }
    }

    if (target === null) {
      return;
    }

    const knights = Math.max(2, inventory.knights - 2);
    const sent = this.engine.launchAttack(this.playerIndex, target.index, knights, gameTick);
    if (sent > 0) {
      this.decisions.push(`attack:${target.index}:${sent}:${gameTick}`);
      this.#attackCooldownUntil = gameTick + 32768;
    }
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

    // Candidates in plan order; a siteless type (mines without mountains)
    // never blocks the rest of the plan.
    const candidates: BuildingTypeValue[] = [
      ...establishmentPlan.filter((type) => !built.has(type)),
      ...expansionPlan.filter((type) => !built.has(type)),
    ];
    const myBuildings = [...this.world.buildings.values()].filter(
      (building) => building.player === this.playerIndex,
    );
    const huts = myBuildings.filter((building) => building.type === buildingType.hut).length;
    if (huts < 1 + Math.floor(myBuildings.length / 8)) {
      candidates.push(buildingType.hut);
    }

    for (const nextType of candidates) {
      if (this.#tryBuild(nextType, castlePosition, gameTick)) {
        return;
      }
    }
  }

  #tryBuild(
    nextType: BuildingTypeValue,
    castlePosition: number,
    gameTick: number,
  ): boolean {
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
      return true;
    }

    return false;
  }
}
