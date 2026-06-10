import { FreeserfRandom, type Direction } from "./index.js";
import {
  buildingConstructionCosts,
  isMilitaryBuildingType,
  militaryGoldCap,
  militaryKnightsNeeded,
  type SerfboundGameWorld,
  type WorldBuilding,
} from "./game-world.js";
import {
  inventoryPromoteSerfToKnight,
  inventoryTakeResource,
  inventoryTakeSerf,
  resourceType,
} from "./inventory.js";
import {
  buildingType,
  isStoneObject,
  isTreeObject,
  mapObject,
} from "./map-generator-extra.js";

// Serf state machine core ported from Freeserf.Core/Serf.cs (spawning,
// walking, entering/leaving buildings). Professions, transport, and combat
// land in later stories. The reference update pattern is preserved exactly:
//   delta = gameTick - serf.tick; serf.tick = gameTick; counter -= delta;
//   while (counter < 0) step();

export const serfState = {
  null: 0,
  idleInStock: 1,
  walking: 2,
  transporting: 3,
  enteringBuilding: 4,
  leavingBuilding: 5,
  readyToEnter: 6,
  readyToLeave: 7,
  digging: 8,
  building: 9,
  idleOnPath: 10,
  working: 11,
  knightMarching: 12,
  knightAttacking: 13,
  knightDefending: 14,
  knightAttackingVictory: 15,
  dead: 16,
} as const;

export type SerfStateValue = (typeof serfState)[keyof typeof serfState];

// lumberjack, stonecutter, forester, sawmill, fisher, farm, mill, baker,
// pig farm, butcher, the four mines, both smelters, toolmaker, weaponsmith
const workedBuildingTypes = new Set<number>([
  2, 4, 9, 17, 1, 12, 15, 16, 14, 13, 5, 6, 7, 8, 18, 23, 19, 20,
]);

// Demand routing: which completed buildings consume a product directly.
const productConsumers: Readonly<Record<number, readonly number[]>> = {
  6: [17], // lumber -> sawmill
  3: [15, 14], // wheat -> mill, pig farm
  4: [16], // flour -> baker
  1: [13], // pig -> butcher
  0: [5, 6, 7, 8], // fish -> mines
  5: [5, 6, 7, 8], // bread -> mines
  2: [5, 6, 7, 8], // meat -> mines
  12: [18, 20, 23], // coal -> steel smelter, weaponsmith, gold smelter
  10: [18], // iron ore -> steel smelter
  13: [23], // gold ore -> gold smelter
  11: [19, 20], // steel -> toolmaker, weaponsmith
  14: [11, 21, 22], // gold bars -> occupied huts, towers, fortresses
};

// Mine building type -> [deposit mineral value, ore resource value].
const mineDeposits: Readonly<Record<number, readonly [number, number]>> = {
  5: [4, 9], // stone mine -> stone deposit -> stone
  6: [3, 12], // coal mine -> coal -> coal
  7: [2, 10], // iron mine -> iron -> iron ore
  8: [1, 13], // gold mine -> gold -> gold ore
};

const minerFoods: readonly number[] = [resourceType.fish, resourceType.bread, resourceType.meat];

// The reference tool order for the toolmaker's round-robin output.
const toolOutputs: readonly number[] = [15, 16, 17, 18, 19, 20, 21, 22, 23];

// Serf.cs combat tables, copied flat exactly as the reference declares them
// (the later rows are 15 entries, so sequence starts chosen by
// RandomInt() & 0x70 land mid-row — a reference quirk preserved).
const knightAttackMoves: readonly number[] = [
  1, 2, 4, 2, 0, 2, 4, 2, 1, 0, 2, 2, 3, 0, 0, -1,
  3, 2, 2, 3, 0, 4, 1, 3, 2, 4, 2, 2, 3, 0, 0, -1,
  2, 1, 4, 3, 2, 2, 2, 3, 0, 3, 1, 2, 0, 2, 0, -1,
  2, 1, 3, 2, 4, 2, 3, 0, 0, 4, 2, 0, 2, 1, 0, -1,
  3, 1, 0, 2, 2, 1, 0, 2, 4, 2, 2, 3, 0, 0, -1,
  0, 3, 1, 2, 3, 4, 2, 1, 2, 0, 2, 4, 0, 2, 0, -1,
  0, 2, 1, 2, 4, 2, 3, 0, 2, 4, 3, 2, 0, 0, -1,
  0, 0, 1, 4, 3, 2, 2, 1, 2, 0, 0, 4, 3, 0, -1,
];

const knightFightAnim: readonly number[] = [
  24, 35, 41, 56, 67, 72, 83, 89, 100, 121, 0, 0, 0, 0, 0, 0,
  26, 40, 42, 57, 73, 74, 88, 104, 106, 120, 122, 0, 0, 0, 0, 0,
  17, 18, 23, 33, 34, 38, 39, 98, 102, 103, 113, 114, 118, 119, 0, 0,
  130, 133, 134, 135, 147, 148, 161, 162, 164, 166, 167, 0, 0, 0, 0, 0,
  50, 52, 53, 70, 129, 131, 132, 146, 149, 151, 0, 0, 0, 0, 0, 0,
];

const knightFightAnimMax: readonly number[] = [10, 11, 14, 11, 10];

const directionOrder: readonly Direction[] = ["Right", "DownRight", "Down", "Left", "UpLeft", "Up"];
const reverseOf: Record<Direction, Direction> = {
  Right: "Left",
  DownRight: "UpLeft",
  Down: "Up",
  Left: "Right",
  UpLeft: "DownRight",
  Up: "Down",
};

// Serf.CounterFromAnimation, walking rows 0..80 plus waiting 81..86.
const walkingCounterRow = [511, 447, 383, 319, 255, 319, 511, 767, 1023] as const;
export function counterFromAnimation(animation: number): number {
  if (animation < 81) {
    return walkingCounterRow[animation % 9]!;
  }

  if (animation < 87) {
    return 127;
  }

  return 255;
}

// Serf.GetWalkingAnimation: 4 + heightDifference + 9 * directionIndex.
export function walkingAnimation(
  heightDifference: number,
  direction: Direction,
  switchPosition: boolean,
): number {
  let directionIndex = directionOrder.indexOf(direction);
  if (switchPosition && directionIndex < 3) {
    directionIndex += 6;
  }

  return 4 + heightDifference + 9 * directionIndex;
}

export type WorldSerf = {
  readonly index: number;
  player: number;
  state: SerfStateValue;
  position: number;
  tick: number;
  animation: number;
  counter: number;
  // Walking state: direction stores the REVERSE of the movement direction
  // (reference encoding); negative values mean waiting (direction - 6).
  walkingDirection: number;
  walkingDestination: number;
  walkingWaitCounter: number;
  // Entering/leaving slide state.
  slopeLength: number;
  nextState: SerfStateValue;
  // Transporter assignment: the road is identified by one end flag and the
  // direction the road leaves it.
  roadFlagIndex: number;
  roadDirection: Direction | null;
  carriedResource: number;
  carriedDestination: number;
  // Builder assignment: the building this serf constructs.
  buildTargetIndex: number;
  // Profession assignment: the completed building this serf works.
  workBuildingIndex: number;
  // Profession work phase bookkeeping.
  workPhase: number;
  workCounter: number;
  workTargetPosition: number;
  // Knight assignment: the military building this knight garrisons.
  isKnight: boolean;
  garrisonTargetIndex: number;
  // Combat state: rank (Knight0..Knight4), the building under attack, the
  // fight opponent, the position in the attack-move sequence, and the
  // outcome decided up front by SetFightOutcome.
  knightRank: number;
  attackTargetIndex: number;
  fightOpponentIndex: number;
  fightMove: number;
  fightWon: boolean;
};

export class SerfboundSerfEngine {
  readonly world: SerfboundGameWorld;
  readonly serfs = new Map<number, WorldSerf>();
  // Map position -> serf index (Map.SetSerfIndex equivalent; 0 = none).
  readonly serfIndexes: Uint32Array;
  // Game.RandomInt source for combat (seeded for deterministic outcomes).
  readonly random: FreeserfRandom;
  // Production event hook (the app maps products to work-loop sounds).
  onProduct: ((buildingType: number, product: number) => void) | undefined;
  #nextSerfIndex = 1;
  readonly #dispatchedBuildings = new Set<number>();

  constructor(world: SerfboundGameWorld, random?: FreeserfRandom) {
    this.world = world;
    this.serfIndexes = new Uint32Array(world.tileCount);
    this.random = random ?? FreeserfRandom.fromWord(0x5a5a);
  }

  hasSerfAt(position: number): boolean {
    return this.serfIndexes[position] !== 0;
  }

  serfAt(position: number): WorldSerf | null {
    const index = this.serfIndexes[position]!;
    return index === 0 ? null : (this.serfs.get(index) ?? null);
  }

  // Serf.InitGeneric: spawn inside the castle inventory, consuming one of
  // its stocked generic serfs.
  spawnGenericSerf(player: number, gameTick: number): WorldSerf | null {
    const castlePosition = this.world.players[player]?.castlePosition;
    if (castlePosition === undefined || castlePosition === null) {
      return null;
    }

    const inventory = this.world.inventoryForPlayer(player);
    if (inventory === null || !inventoryTakeSerf(inventory)) {
      return null;
    }

    const serf: WorldSerf = {
      index: this.#nextSerfIndex,
      player,
      state: serfState.idleInStock,
      position: castlePosition,
      tick: gameTick,
      animation: 0,
      counter: 0,
      walkingDirection: 0,
      walkingDestination: 0,
      walkingWaitCounter: 0,
      slopeLength: 0,
      nextState: serfState.null,
      roadFlagIndex: 0,
      roadDirection: null,
      carriedResource: -1,
      carriedDestination: 0,
      buildTargetIndex: 0,
      workBuildingIndex: 0,
      workPhase: 0,
      workCounter: 0,
      workTargetPosition: -1,
      isKnight: false,
      garrisonTargetIndex: 0,
      knightRank: 0,
      attackTargetIndex: 0,
      fightOpponentIndex: 0,
      fightMove: 0,
      fightWon: false,
    };
    this.#nextSerfIndex += 1;
    this.serfs.set(serf.index, serf);
    return serf;
  }

  // Spawn a knight from the inventory's recruited knight stock.
  spawnKnightSerf(player: number, gameTick: number): WorldSerf | null {
    const inventory = this.world.inventoryForPlayer(player);
    if (inventory === null || inventory.knights <= 0) {
      return null;
    }

    // Borrow the generic spawn path, then restore the generic pool the
    // knight did not consume (knights were already promoted out of it).
    inventory.genericSerfs += 1;
    const serf = this.spawnGenericSerf(player, gameTick);
    if (serf === null) {
      inventory.genericSerfs -= 1;
      return null;
    }

    inventory.knights -= 1;
    serf.isKnight = true;
    return serf;
  }

  // Send an idle castle serf walking toward a destination flag.
  // (Condensed reference path IdleInStock -> ReadyToLeaveInventory ->
  // LeavingBuilding -> Walking; the inventory queueing arrives with
  // SB-13-03 transport scheduling.)
  callOutSerf(serf: WorldSerf, destinationFlagIndex: number, gameTick: number): boolean {
    if (serf.state !== serfState.idleInStock) {
      return false;
    }

    const castlePosition = serf.position;
    const flagPosition = this.world.move(castlePosition, "DownRight");

    serf.state = serfState.leavingBuilding;
    serf.tick = gameTick;
    // Serf.LeaveBuilding: slide down-right from the building to its flag.
    const newPosition = flagPosition;
    const heightDifference =
      this.world.heights[newPosition]! - this.world.heights[castlePosition]!;
    serf.animation = walkingAnimation(heightDifference, "DownRight", false);
    serf.counter += (30 * counterFromAnimation(serf.animation)) >> 5;
    serf.position = newPosition;
    serf.walkingDestination = destinationFlagIndex;
    serf.nextState = serfState.walking;
    return true;
  }

  // Assign an idle castle serf as the transporter of a road. The serf walks
  // out to the road's flag and then serves it (condensed reference
  // IdleOnPath path; full wake/park behavior follows with congestion work).
  assignTransporter(
    serf: WorldSerf,
    flagIndex: number,
    direction: Direction,
    gameTick: number,
  ): boolean {
    const flag = this.world.flags.get(flagIndex);
    if (flag === undefined || !flag.paths[direction].hasPath) {
      return false;
    }

    serf.roadFlagIndex = flagIndex;
    serf.roadDirection = direction;
    flag.paths[direction].freeTransporters += 1;
    const otherFlag = this.world.flags.get(flag.paths[direction].otherFlagIndex);
    const otherDirection = flag.paths[direction].otherEndDirection;
    if (otherFlag !== undefined && otherDirection !== null) {
      otherFlag.paths[otherDirection].freeTransporters += 1;
    }

    return this.callOutSerf(serf, flagIndex, gameTick);
  }

  // Game.UpdateSerfs equivalent.
  update(gameTick: number): void {
    this.#sweepWorkerRequests(gameTick);
    this.#drainPendingOut();
    this.#sweepMilitary(gameTick);
    for (const serf of [...this.serfs.values()]) {
      switch (serf.state) {
        case serfState.walking:
          this.#handleWalking(serf, gameTick);
          break;
        case serfState.transporting:
          this.#handleTransporting(serf, gameTick);
          break;
        case serfState.idleOnPath:
          this.#handleIdleOnPath(serf, gameTick);
          break;
        case serfState.building:
          this.#handleBuilding(serf, gameTick);
          break;
        case serfState.working:
          this.#handleWorking(serf, gameTick);
          break;
        case serfState.leavingBuilding:
          this.#handleLeavingBuilding(serf, gameTick);
          break;
        case serfState.enteringBuilding:
          this.#handleEnteringBuilding(serf, gameTick);
          break;
        case serfState.knightMarching:
          this.#handleKnightMarching(serf, gameTick);
          break;
        case serfState.knightAttacking:
          this.#handleKnightAttacking(serf, gameTick);
          break;
        case serfState.knightAttackingVictory:
          this.#handleKnightAttackingVictory(serf, gameTick);
          break;
        case serfState.dead:
          this.#handleDead(serf, gameTick);
          break;
        default:
          break;
      }
    }
  }

  #handleLeavingBuilding(serf: WorldSerf, gameTick: number): void {
    const delta = (gameTick - serf.tick) & 0xffff;
    serf.tick = gameTick;
    serf.counter -= delta;

    if (serf.counter < 0) {
      serf.counter = 0;
      serf.state = serf.nextState === serfState.null ? serfState.walking : serf.nextState;
      serf.walkingDirection = directionOrder.indexOf(reverseOf["DownRight"]);
      serf.walkingWaitCounter = 0;
      this.serfIndexes[serf.position] = serf.index;
    }
  }

  #handleEnteringBuilding(serf: WorldSerf, gameTick: number): void {
    const delta = (gameTick - serf.tick) & 0xffff;
    serf.tick = gameTick;
    serf.counter -= delta;

    if (serf.counter < 0 || serf.counter <= serf.slopeLength) {
      serf.counter = serf.slopeLength;
      // Generic serfs disappear into the building (inventory) for now;
      // professions take over in SB-13-03/04.
      this.serfIndexes[serf.position] = 0;
      serf.state = serfState.idleInStock;
    }
  }

  // Serf.HandleSerfWalkingState, core path: follow the road to the
  // destination flag; on arrival, enter idle-at-flag (transport arrives in
  // SB-13-03).
  #handleWalking(serf: WorldSerf, gameTick: number): void {
    const delta = (gameTick - serf.tick) & 0xffff;
    serf.tick = gameTick;
    serf.counter -= delta;

    while (serf.counter < 0) {
      if (serf.walkingDirection < 0) {
        // Waiting: stick to the same direction (loop handling condensed).
        serf.walkingWaitCounter += 1;
        const direction = directionOrder[serf.walkingDirection + 6]!;
        if (!this.#changeDirection(serf, direction)) {
          serf.counter = 0;
          return;
        }

        continue;
      }

      if (this.world.hasFlag(serf.position)) {
        const flag = this.world.flagAt(serf.position)!;
        if (flag.index === serf.walkingDestination || serf.walkingDestination === 0) {
          // Assigned transporters take up duty at their road's flag before
          // any building entry. Idle transporters leave the collision map
          // (the reference marks idle-on-path serfs passable).
          if (serf.roadDirection !== null && flag.index === serf.roadFlagIndex) {
            serf.state = serfState.idleOnPath;
            serf.counter = 0;
            this.serfIndexes[serf.position] = 0;
            return;
          }

          // Profession workers settle into their completed building.
          if (serf.workBuildingIndex !== 0 && flag.buildingIndex === serf.workBuildingIndex) {
            const workplace = this.world.buildings.get(serf.workBuildingIndex);
            if (workplace !== undefined && workplace.isDone) {
              this.serfIndexes[serf.position] = 0;
              serf.position = workplace.position;
              serf.state = serfState.working;
              serf.workPhase = 0;
              serf.workCounter = 0;
              serf.counter = 0;
              return;
            }
          }

          // Knights take their garrison post; the first knight activates
          // the building and its territory (reference knight occupation).
          if (serf.garrisonTargetIndex !== 0 && flag.buildingIndex === serf.garrisonTargetIndex) {
            const post = this.world.buildings.get(serf.garrisonTargetIndex);
            if (post !== undefined && post.isDone) {
              this.serfIndexes[serf.position] = 0;
              serf.position = post.position;
              serf.state = serfState.idleInStock;
              serf.garrisonTargetIndex = 0;
              post.requestedKnights = Math.max(0, post.requestedKnights - 1);
              post.knights += 1;
              if (post.knights === 1) {
                this.world.updateLandOwnership(post.position);
              }

              return;
            }
          }

          // Builders move onto their construction site and start working.
          if (serf.buildTargetIndex !== 0 && flag.buildingIndex === serf.buildTargetIndex) {
            const site = this.world.buildings.get(serf.buildTargetIndex);
            if (site !== undefined && !site.isDone) {
              this.serfIndexes[serf.position] = 0;
              serf.position = site.position;
              serf.state = serfState.building;
              serf.counter = 0;
              return;
            }
          }

          // Destination reached: enter the building if the flag has one,
          // otherwise idle here (SB-13-03 turns these into transporters).
          const buildingIndex = flag.buildingIndex;
          if (buildingIndex !== null) {
            const building = this.world.buildings.get(buildingIndex)!;
            const heightDifference =
              this.world.heights[building.position]! - this.world.heights[serf.position]!;
            this.serfIndexes[serf.position] = 0;
            serf.position = building.position;
            serf.state = serfState.enteringBuilding;
            serf.animation = walkingAnimation(heightDifference, "UpLeft", false);
            serf.counter += counterFromAnimation(serf.animation);
            serf.slopeLength = (1 * serf.counter) >> 5;
            return;
          }

          serf.state = serfState.null;
          serf.counter = 0;
          return;
        }

        // Walk toward the destination flag through the flag graph: pick the
        // connected direction whose other end is closer to the destination
        // (condensed FlagSearch; full flag search lands with transport).
        const direction = this.#directionToward(flag.index, serf.walkingDestination);
        if (direction === null) {
          serf.state = serfState.null;
          serf.counter = 0;
          return;
        }

        if (!this.#changeDirection(serf, direction)) {
          serf.counter = 0;
          return;
        }

        continue;
      }

      // Not at a flag: follow the single road path onward (excluding where we
      // came from).
      const cameFrom = serf.walkingDirection;
      let nextDirection: Direction | null = null;
      for (const direction of directionOrder) {
        if (directionOrder.indexOf(direction) === cameFrom) {
          continue;
        }

        if (this.world.hasPath(serf.position, direction)) {
          nextDirection = direction;
          break;
        }
      }

      if (nextDirection === null) {
        serf.counter = 0;
        serf.state = serfState.null;
        return;
      }

      if (!this.#changeDirection(serf, nextDirection)) {
        serf.counter = 0;
        return;
      }
    }
  }

  // Transporters idle at one end of their road and haul any slot whose route
  // continues over it (condensed Flag scheduling; priorities and multi-serf
  // roads follow with the economy).
  #handleIdleOnPath(serf: WorldSerf, gameTick: number): void {
    serf.tick = gameTick;
    if (serf.roadDirection === null) {
      serf.state = serfState.null;
      return;
    }

    const hereFlag = this.world.flags.get(serf.roadFlagIndex);
    if (hereFlag === undefined) {
      serf.state = serfState.null;
      return;
    }

    const path = hereFlag.paths[serf.roadDirection];
    const otherFlag = this.world.flags.get(path.otherFlagIndex);
    if (!path.hasPath || otherFlag === undefined) {
      serf.state = serfState.null;
      return;
    }

    // The serf stands at one of the two end flags; prefer hauling from there.
    const standsAtHere = serf.position === hereFlag.position;
    const fromFlag = standsAtHere ? hereFlag : otherFlag;
    const toFlag = standsAtHere ? otherFlag : hereFlag;
    const outDirection = standsAtHere
      ? serf.roadDirection
      : (path.otherEndDirection ?? serf.roadDirection);

    for (const slot of fromFlag.slots) {
      if (slot.resource < 0 || slot.destinationFlagIndex === 0) {
        continue;
      }

      const routeDirection = this.#directionToward(fromFlag.index, slot.destinationFlagIndex);
      if (routeDirection !== outDirection) {
        continue;
      }

      // Only haul when the far end can take the hand-over: it is the final
      // destination (buildings and inventories always accept) or it has a
      // free slot. This keeps full hub flags from wedging their own carrier.
      if (
        toFlag.index !== slot.destinationFlagIndex &&
        !toFlag.slots.some((other) => other.resource < 0)
      ) {
        continue;
      }

      // Pick up and carry across the road.
      serf.carriedResource = slot.resource;
      serf.carriedDestination = slot.destinationFlagIndex;
      slot.resource = -1;
      slot.destinationFlagIndex = 0;
      serf.state = serfState.transporting;
      serf.walkingDestination = toFlag.index;
      serf.walkingDirection = 0;
      serf.counter = 0;
      this.serfIndexes[serf.position] = serf.index;
      return;
    }

    // Nothing on this side: if the opposite end has work routed over this
    // road, walk back empty to fetch it.
    const returnDirection = standsAtHere
      ? (path.otherEndDirection ?? serf.roadDirection)
      : serf.roadDirection;
    for (const slot of toFlag.slots) {
      if (slot.resource < 0 || slot.destinationFlagIndex === 0) {
        continue;
      }

      if (this.#directionToward(toFlag.index, slot.destinationFlagIndex) !== returnDirection) {
        continue;
      }

      serf.state = serfState.transporting;
      serf.walkingDestination = toFlag.index;
      serf.walkingDirection = 0;
      serf.counter = 0;
      this.serfIndexes[serf.position] = serf.index;
      return;
    }
  }

  // Transporting reuses the walking mechanics; on arrival the resource is
  // delivered into the destination building or dropped for the next road.
  #handleTransporting(serf: WorldSerf, gameTick: number): void {
    const delta = (gameTick - serf.tick) & 0xffff;
    serf.tick = gameTick;
    serf.counter -= delta;

    while (serf.counter < 0) {
      if (serf.walkingDirection < 0) {
        serf.walkingWaitCounter += 1;
        const direction = directionOrder[serf.walkingDirection + 6]!;
        this.#changeDirection(serf, direction);
        continue;
      }

      if (this.world.hasFlag(serf.position)) {
        const flag = this.world.flagAt(serf.position)!;
        if (flag.index === serf.walkingDestination) {
          if (!this.#deliverCarriedResource(serf, flag)) {
            // No free slot to hand over: wait at the flag and retry.
            serf.counter += 200;
            return;
          }

          serf.state = serfState.idleOnPath;
          serf.counter = 0;
          this.serfIndexes[serf.position] = 0;
          return;
        }

        const direction = this.#directionToward(flag.index, serf.walkingDestination);
        if (direction === null) {
          serf.state = serfState.idleOnPath;
          serf.counter = 0;
          this.serfIndexes[serf.position] = 0;
          return;
        }

        this.#changeDirection(serf, direction);
        continue;
      }

      const cameFrom = serf.walkingDirection;
      let nextDirection: Direction | null = null;
      for (const direction of directionOrder) {
        if (directionOrder.indexOf(direction) === cameFrom) {
          continue;
        }

        if (this.world.hasPath(serf.position, direction)) {
          nextDirection = direction;
          break;
        }
      }

      if (nextDirection === null) {
        serf.counter = 0;
        serf.state = serfState.idleOnPath;
        return;
      }

      this.#changeDirection(serf, nextDirection);
    }
  }

  // Returns false when the flag has no room for a hand-over; the carrier
  // keeps the resource and retries (the reference never destroys cargo).
  #deliverCarriedResource(serf: WorldSerf, flag: import("./game-world.js").WorldFlag): boolean {
    if (serf.carriedResource < 0) {
      return true;
    }

    if (flag.index === serf.carriedDestination && flag.buildingIndex !== null) {
      // Inventory flags store into the castle stock; other buildings tally.
      if (flag.hasInventory) {
        const inventory = this.world.inventoryForPlayer(flag.player);
        if (inventory !== null) {
          inventory.resources[serf.carriedResource] =
            (inventory.resources[serf.carriedResource] ?? 0) + 1;
          serf.carriedResource = -1;
          serf.carriedDestination = 0;
          return true;
        }
      }

      const building = this.world.buildings.get(flag.buildingIndex);
      if (building !== undefined) {
        building.deliveredResources[serf.carriedResource] =
          (building.deliveredResources[serf.carriedResource] ?? 0) + 1;
        if ((building.requestedResources[serf.carriedResource] ?? 0) > 0) {
          building.requestedResources[serf.carriedResource] =
            building.requestedResources[serf.carriedResource]! - 1;
        }

        serf.carriedResource = -1;
        serf.carriedDestination = 0;
        return true;
      }
    }

    // Hand over to the next road's transporter via the flag slots.
    if (!this.world.dropResource(flag.index, serf.carriedResource, serf.carriedDestination)) {
      return false;
    }

    serf.carriedResource = -1;
    serf.carriedDestination = 0;
    return true;
  }

  readonly #staffedBuildings = new Set<number>();

  // Inventory outbound queue: move pending resources onto the inventory flag
  // as slots free up (reference MoveResourceOut scheduling, condensed).
  #drainPendingOut(): void {
    for (const inventory of this.world.inventories.values()) {
      while (inventory.pendingOut.length > 0) {
        const next = inventory.pendingOut[0]!;
        if (!this.world.dropResource(inventory.flagIndex, next.resource, next.destinationFlagIndex)) {
          break;
        }

        inventory.pendingOut.shift();
      }
    }
  }

  #lastMoraleTick = -1;

  // Military upkeep each engine pass: refresh knight morale on the stats
  // cadence and keep the castle's knight stock recruited (Player's
  // CastleKnightsWanted promoting generic serfs with sword + shield).
  #sweepMilitary(gameTick: number): void {
    if (this.#lastMoraleTick < 0 || ((gameTick - this.#lastMoraleTick) & 0xffff) >= 1024) {
      this.#lastMoraleTick = gameTick;
      for (const player of this.world.players) {
        if (player.hasCastle) {
          this.world.updateKnightMorale(player.index);
        }
      }
    }

    for (const inventory of this.world.inventories.values()) {
      const wanted = this.world.players[inventory.player]?.castleKnightsWanted ?? 0;
      while (inventory.knights < wanted && inventoryPromoteSerfToKnight(inventory)) {
        // Promotion consumed a sword, a shield, and a generic serf.
      }
    }

    // Building.UpdateMilitary: completed military buildings request knights
    // up to their occupation level; knights walk the roads to their post.
    for (const building of this.world.buildings.values()) {
      if (!building.isDone || !isMilitaryBuildingType(building.type)) {
        continue;
      }

      const player = this.world.players[building.player];
      const inventory = this.world.inventoryForPlayer(building.player);
      if (player === undefined || player.castlePosition === null || inventory === null) {
        continue;
      }

      const needed = militaryKnightsNeeded(building, player.knightOccupation);
      if (building.knights + building.requestedKnights >= needed) {
        continue;
      }

      const castleFlag = this.world.flagAt(this.world.move(player.castlePosition, "DownRight"));
      const buildingFlag = this.world.flags.get(building.flagIndex);
      if (castleFlag === null || buildingFlag === undefined) {
        continue;
      }

      if (
        castleFlag.index !== buildingFlag.index &&
        this.#directionToward(castleFlag.index, buildingFlag.index) === null
      ) {
        continue;
      }

      while (building.knights + building.requestedKnights < needed) {
        const knight = this.spawnKnightSerf(building.player, gameTick);
        if (knight === null) {
          break;
        }

        knight.garrisonTargetIndex = building.index;
        building.requestedKnights += 1;
        this.callOutSerf(knight, buildingFlag.index, gameTick);
      }
    }
  }

  // Completed production buildings request their profession worker from the
  // castle (condensed Inventory.CallOutSerf profession dispatch).
  #sweepWorkerRequests(gameTick: number): void {
    for (const building of this.world.buildings.values()) {
      if (!building.isDone || building.type === 24 || this.#staffedBuildings.has(building.index)) {
        continue;
      }

      if (!workedBuildingTypes.has(building.type)) {
        continue;
      }

      const worker = this.spawnGenericSerf(building.player, gameTick);
      if (worker === null) {
        continue;
      }

      this.#staffedBuildings.add(building.index);
      worker.workBuildingIndex = building.index;
      this.callOutSerf(worker, building.flagIndex, gameTick);
    }
  }

  // Profession work cycles (condensed model, recorded in the phase docs):
  // the worker stays at the building; map effects target the nearest
  // candidate within the classic spiral; products drop at the building flag
  // routed to demand (consumer buildings first, otherwise the inventory).
  #handleWorking(serf: WorldSerf, gameTick: number): void {
    const delta = (gameTick - serf.tick) & 0xffff;
    serf.tick = gameTick;
    serf.workCounter += delta;

    const building = this.world.buildings.get(serf.workBuildingIndex);
    if (building === undefined) {
      serf.state = serfState.null;
      return;
    }

    switch (building.type) {
      case buildingType.lumberjack:
        this.#workHarvest(serf, building, 400, isTreeObject, mapObject.stub, resourceType.lumber);
        break;
      case buildingType.stonecutter:
        this.#workHarvest(serf, building, 450, isStoneObject, mapObject.none, resourceType.stone);
        break;
      case buildingType.forester:
        if (serf.workCounter >= 500) {
          serf.workCounter = 0;
          this.#plantTree(building);
        }
        break;
      case buildingType.sawmill:
        this.#workConvert(serf, building, 350, resourceType.lumber, resourceType.plank);
        break;
      case buildingType.farm:
        // Farmer: sow a field, then harvest it into wheat (field objects use
        // the reference Seeds/Field values; growth stages are condensed).
        if (serf.workCounter >= 450) {
          serf.workCounter = 0;
          if (serf.workPhase === 0) {
            for (let offset = 1; offset < 151; offset += 1) {
              const candidate = this.world.positionAddSpirally(building.position, offset);
              if (
                this.world.objectAt(candidate) === mapObject.none &&
                this.world.pathsAt(candidate) === 0 &&
                this.world.hasOwner(candidate) &&
                this.world.canBuildSmall(candidate)
              ) {
                this.world.setObject(candidate, 105, null); // Seeds0
                serf.workPhase = 1;
                serf.workTargetPosition = candidate;
                break;
              }
            }
          } else {
            const field = serf.workTargetPosition;
            if (field >= 0 && this.world.objectAt(field) >= 105 && this.world.objectAt(field) <= 126) {
              this.world.setObject(field, mapObject.none, null);
              this.#emitProduct(building, resourceType.wheat);
            }

            serf.workPhase = 0;
            serf.workTargetPosition = -1;
          }
        }
        break;
      case buildingType.mill:
        this.#workConvert(serf, building, 400, resourceType.wheat, resourceType.flour);
        break;
      case buildingType.baker:
        this.#workConvert(serf, building, 400, resourceType.flour, resourceType.bread);
        break;
      case buildingType.fisher:
        // Fisher: catches from adjacent water fish stocks.
        if (serf.workCounter >= 500) {
          serf.workCounter = 0;
          for (let offset = 1; offset < 151; offset += 1) {
            const candidate = this.world.positionAddSpirally(building.position, offset);
            if (
              this.world.minerals[candidate] === 0 &&
              this.world.resourceAmounts[candidate]! > 0 &&
              this.world.typesUp[candidate]! <= 3
            ) {
              this.world.resourceAmounts[candidate] = this.world.resourceAmounts[candidate]! - 1;
              this.#emitProduct(building, resourceType.fish);
              break;
            }
          }
        }
        break;
      case buildingType.pigFarm:
        // Pig farm: wheat feeds pigs (one pig per two wheat, condensed).
        if (serf.workCounter >= 550) {
          const stock = building.deliveredResources[resourceType.wheat] ?? 0;
          if (stock >= 2) {
            serf.workCounter = 0;
            building.deliveredResources[resourceType.wheat] = stock - 2;
            this.#emitProduct(building, resourceType.pig);
          }
        }
        break;
      case buildingType.butcher:
        this.#workConvert(serf, building, 350, resourceType.pig, resourceType.meat);
        break;
      case buildingType.stoneMine:
      case buildingType.coalMine:
      case buildingType.ironMine:
      case buildingType.goldMine:
        this.#workMine(serf, building);
        break;
      case buildingType.steelSmelter:
        this.#workConvertMulti(
          serf, building, 450,
          [resourceType.coal, resourceType.ironOre],
          resourceType.steel,
        );
        break;
      case buildingType.goldSmelter:
        this.#workConvertMulti(
          serf, building, 450,
          [resourceType.coal, resourceType.goldOre],
          resourceType.goldBar,
        );
        break;
      case buildingType.weaponSmith:
        // HandleSerfMakingWeaponState: one coal + one steel make a sword,
        // then a shield "for free" (the reference FreeShieldPossible flip,
        // carried on the worker's phase since one smith works the forge).
        if (serf.workCounter >= 500) {
          if (serf.workPhase % 2 === 1) {
            serf.workCounter = 0;
            serf.workPhase += 1;
            this.#emitProduct(building, resourceType.shield);
          } else {
            const coal = building.deliveredResources[resourceType.coal] ?? 0;
            const steel = building.deliveredResources[resourceType.steel] ?? 0;
            if (coal > 0 && steel > 0) {
              serf.workCounter = 0;
              serf.workPhase += 1;
              building.deliveredResources[resourceType.coal] = coal - 1;
              building.deliveredResources[resourceType.steel] = steel - 1;
              this.#emitProduct(building, resourceType.sword);
            }
          }
        }
        break;
      case buildingType.toolMaker:
        if (serf.workCounter >= 500) {
          const planks = building.deliveredResources[resourceType.plank] ?? 0;
          const steel = building.deliveredResources[resourceType.steel] ?? 0;
          if (planks > 0 && steel > 0) {
            serf.workCounter = 0;
            building.deliveredResources[resourceType.plank] = planks - 1;
            building.deliveredResources[resourceType.steel] = steel - 1;
            const tool = toolOutputs[serf.workPhase % toolOutputs.length]!;
            serf.workPhase += 1;
            this.#emitProduct(building, tool);
          }
        }
        break;
      default:
        break;
    }
  }

  // Mines extract from the generator's deposits, gated on delivered food
  // (one food per extraction, per the reference miner behavior).
  #workMine(serf: WorldSerf, building: WorldBuilding): void {
    if (serf.workCounter < 500) {
      return;
    }

    const deposit = mineDeposits[building.type];
    if (deposit === undefined) {
      return;
    }

    const foodIndex = minerFoods.find(
      (food) => (building.deliveredResources[food] ?? 0) > 0,
    );
    if (foodIndex === undefined) {
      return; // hungry miners stop working
    }

    const [mineralValue, oreResource] = deposit;
    for (let offset = 0; offset < 50; offset += 1) {
      const candidate = this.world.positionAddSpirally(building.position, offset);
      if (
        this.world.minerals[candidate] === mineralValue &&
        this.world.resourceAmounts[candidate]! > 0
      ) {
        serf.workCounter = 0;
        building.deliveredResources[foodIndex] =
          (building.deliveredResources[foodIndex] ?? 0) - 1;
        this.world.resourceAmounts[candidate] = this.world.resourceAmounts[candidate]! - 1;
        this.#emitProduct(building, oreResource);
        return;
      }
    }

    serf.workCounter = 0; // deposit exhausted
  }

  // Converters needing several inputs at once (smelters).
  #workConvertMulti(
    serf: WorldSerf,
    building: WorldBuilding,
    cycleTicks: number,
    inputs: readonly number[],
    output: number,
  ): void {
    if (serf.workCounter < cycleTicks) {
      return;
    }

    if (inputs.every((input) => (building.deliveredResources[input] ?? 0) > 0)) {
      serf.workCounter = 0;
      for (const input of inputs) {
        building.deliveredResources[input] = building.deliveredResources[input]! - 1;
      }

      this.#emitProduct(building, output);
    }
  }

  // Converter buildings: consume one delivered input per work cycle and emit
  // the product (sawmill, mill, baker, butcher).
  #workConvert(
    serf: WorldSerf,
    building: WorldBuilding,
    cycleTicks: number,
    input: number,
    output: number,
  ): void {
    if (serf.workCounter < cycleTicks) {
      return;
    }

    const stock = building.deliveredResources[input] ?? 0;
    if (stock > 0) {
      serf.workCounter = 0;
      building.deliveredResources[input] = stock - 1;
      this.#emitProduct(building, output);
    }
  }

  #workHarvest(
    serf: WorldSerf,
    building: WorldBuilding,
    cycleTicks: number,
    isTarget: (objectValue: number) => boolean,
    remainder: number,
    product: number,
  ): void {
    if (serf.workCounter < cycleTicks) {
      return;
    }

    for (let offset = 1; offset < 151; offset += 1) {
      const candidate = this.world.positionAddSpirally(building.position, offset);
      if (isTarget(this.world.objectAt(candidate))) {
        serf.workCounter = 0;
        this.world.setObject(candidate, remainder, null);
        this.#emitProduct(building, product);
        return;
      }
    }

    // Nothing left to harvest; idle until the map changes.
    serf.workCounter = 0;
  }

  #plantTree(building: WorldBuilding): void {
    for (let offset = 1; offset < 151; offset += 1) {
      const candidate = this.world.positionAddSpirally(building.position, offset);
      if (
        this.world.objectAt(candidate) === mapObject.none &&
        this.world.pathsAt(candidate) === 0 &&
        this.world.hasOwner(candidate) &&
        this.world.canBuildSmall(candidate)
      ) {
        // Condensed growth: the forester's sapling matures immediately
        // (the reference NewTree growth timer is recorded follow-up work).
        this.world.setObject(candidate, mapObject.tree0, null);
        return;
      }
    }
  }

  // Route a product to demand: a connected consumer building wanting this
  // resource first, otherwise the player's inventory flag. Demand counts
  // both delivered stock and in-flight requests (the reference building
  // stock requested/available split), so producers stop pushing once a
  // consumer's pipeline is full instead of flooding the road network.
  #emitProduct(building: WorldBuilding, product: number): void {
    const sourceFlag = this.world.flags.get(building.flagIndex);
    if (sourceFlag === undefined) {
      return;
    }

    this.onProduct?.(building.type, product);

    let destination = 0;
    const consumerTypes = productConsumers[product];
    if (consumerTypes !== undefined) {
      for (const consumer of this.world.buildings.values()) {
        if (!consumer.isDone || !consumerTypes.includes(consumer.type)) {
          continue;
        }

        // Military demand: gold goes only to occupied posts, capped at the
        // reference per-type gold stock (hut 2, tower 4, fortress 8).
        let stockCap = 4;
        if (isMilitaryBuildingType(consumer.type)) {
          if (consumer.knights === 0) {
            continue;
          }

          stockCap = militaryGoldCap(consumer.type);
        }

        if (
          (consumer.deliveredResources[product] ?? 0) +
            (consumer.requestedResources[product] ?? 0) < stockCap &&
          this.#directionToward(building.flagIndex, consumer.flagIndex) !== null
        ) {
          destination = consumer.flagIndex;
          consumer.requestedResources[product] =
            (consumer.requestedResources[product] ?? 0) + 1;
          break;
        }
      }
    }

    if (destination === 0) {
      const inventory = this.world.inventoryForPlayer(building.player);
      if (inventory !== null) {
        destination = inventory.flagIndex;
      }
    }

    if (destination !== 0 && destination !== building.flagIndex) {
      if (!this.world.dropResource(building.flagIndex, product, destination)) {
        // The producer's own flag is full; release the in-flight request so
        // the consumer's pipeline does not stay blocked by a phantom.
        const consumerFlag = this.world.flags.get(destination);
        const consumer =
          consumerFlag?.buildingIndex !== null && consumerFlag !== undefined
            ? this.world.buildings.get(consumerFlag.buildingIndex)
            : undefined;
        if (consumer !== undefined && (consumer.requestedResources[product] ?? 0) > 0) {
          consumer.requestedResources[product] = consumer.requestedResources[product]! - 1;
        }
      }
    } else if (destination === building.flagIndex) {
      // Producing straight onto the inventory flag (rare) stores directly.
      const inventory = this.world.inventoryForPlayer(building.player);
      if (inventory !== null) {
        inventory.resources[product] = (inventory.resources[product] ?? 0) + 1;
      }
    }
  }

  // Builders work their site on the game clock; the world's construction
  // model (leveling, then material consumption) decides progress.
  #handleBuilding(serf: WorldSerf, gameTick: number): void {
    const delta = (gameTick - serf.tick) & 0xffff;
    serf.tick = gameTick;

    const building = this.world.buildings.get(serf.buildTargetIndex);
    if (building === undefined || building.isDone) {
      serf.buildTargetIndex = 0;
      serf.state = serfState.null;
      return;
    }

    this.world.applyBuilderWork(building, delta);
    if (building.isDone) {
      serf.buildTargetIndex = 0;
      serf.state = serfState.null;
    }
  }

  // Construction logistics for a queued building: drop the required
  // materials at the player's inventory flag destined for the site, ensure
  // every road on the route has a transporter, and send out a builder.
  dispatchConstructionLogistics(building: WorldBuilding, gameTick: number): boolean {
    if (this.#dispatchedBuildings.has(building.index) || building.isDone) {
      return false;
    }

    const player = this.world.players[building.player];
    if (player === undefined || player.castlePosition === null) {
      return false;
    }

    const castleFlag = this.world.flagAt(this.world.move(player.castlePosition, "DownRight"));
    const buildingFlag = this.world.flags.get(building.flagIndex);
    if (castleFlag === null || buildingFlag === undefined) {
      return false;
    }

    // No side effects until the site is actually reachable over roads.
    if (
      castleFlag.index !== buildingFlag.index &&
      this.#directionToward(castleFlag.index, buildingFlag.index) === null
    ) {
      return false;
    }

    this.#dispatchedBuildings.add(building.index);

    // Materials come out of the castle inventory's stock.
    const inventory = this.world.inventoryForPlayer(building.player);
    if (inventory === null) {
      return false;
    }

    const [planks, stones] = buildingConstructionCosts[building.type] ?? [0, 0];
    for (let count = 0; count < planks; count += 1) {
      if (inventoryTakeResource(inventory, resourceType.plank)) {
        inventory.pendingOut.push({
          resource: resourceType.plank,
          destinationFlagIndex: buildingFlag.index,
        });
      }
    }

    for (let count = 0; count < stones; count += 1) {
      if (inventoryTakeResource(inventory, resourceType.stone)) {
        inventory.pendingOut.push({
          resource: resourceType.stone,
          destinationFlagIndex: buildingFlag.index,
        });
      }
    }

    // Walk the flag route and staff each unmanned road with a transporter.
    let cursorFlag = castleFlag;
    for (let hop = 0; hop < 64 && cursorFlag.index !== buildingFlag.index; hop += 1) {
      const direction = this.#directionToward(cursorFlag.index, buildingFlag.index);
      if (direction === null) {
        break;
      }

      const path = cursorFlag.paths[direction];
      if (path.freeTransporters === 0) {
        const transporter = this.spawnGenericSerf(building.player, gameTick);
        if (transporter !== null) {
          this.assignTransporter(transporter, cursorFlag.index, direction, gameTick);
        }
      }

      const nextFlag = this.world.flags.get(path.otherFlagIndex);
      if (nextFlag === undefined) {
        break;
      }

      cursorFlag = nextFlag;
    }

    // Send the builder.
    const builder = this.spawnGenericSerf(building.player, gameTick);
    if (builder === null) {
      return false;
    }

    builder.buildTargetIndex = building.index;
    return this.callOutSerf(builder, buildingFlag.index, gameTick);
  }

  // Serf.ChangeDirection: move one tile; on collision, either swap with a
  // serf waiting to cross in the opposite direction (the reference
  // SwitchWaiting) or wait with the reference waiting animation.
  #changeDirection(serf: WorldSerf, direction: Direction): boolean {
    const newPosition = this.world.move(serf.position, direction);

    if (this.hasSerfAt(newPosition)) {
      const other = this.serfAt(newPosition);
      const otherWaitsOpposite =
        other !== null &&
        other.walkingDirection < 0 &&
        directionOrder[other.walkingDirection + 6] === reverseOf[direction];
      if (other !== null && otherWaitsOpposite) {
        // Swap positions, both with switch animations.
        const ourHeight = this.world.heights[serf.position]!;
        const theirHeight = this.world.heights[newPosition]!;
        other.position = serf.position;
        this.serfIndexes[other.position] = other.index;
        other.animation = walkingAnimation(ourHeight - theirHeight, reverseOf[direction], true);
        other.counter = counterFromAnimation(other.animation);
        other.walkingDirection = directionOrder.indexOf(direction);
        other.walkingWaitCounter = 0;

        serf.animation = walkingAnimation(theirHeight - ourHeight, direction, true);
        serf.walkingDirection = directionOrder.indexOf(reverseOf[direction]);
        serf.walkingWaitCounter = 0;
        serf.position = newPosition;
        this.serfIndexes[newPosition] = serf.index;
        serf.counter += counterFromAnimation(serf.animation);
        return true;
      }

      serf.animation = 81 + directionOrder.indexOf(direction);
      serf.counter = counterFromAnimation(serf.animation);
      serf.walkingDirection = directionOrder.indexOf(direction) - 6;
      return true;
    }

    this.serfIndexes[serf.position] = 0;
    serf.animation = walkingAnimation(
      this.world.heights[newPosition]! - this.world.heights[serf.position]!,
      direction,
      false,
    );
    serf.walkingDirection = directionOrder.indexOf(reverseOf[direction]);
    serf.walkingWaitCounter = 0;
    serf.position = newPosition;
    this.serfIndexes[newPosition] = serf.index;
    serf.counter += counterFromAnimation(serf.animation);
    return true;
  }

  // --- combat (Serf.cs fight states + SetFightOutcome) -------------------------------

  // Player attack initiation, condensed: pull knights from the castle and
  // march them on the target building's flag (the reference selects them
  // from nearby military buildings; supply selection lands with the war UI).
  launchAttack(
    playerIndex: number,
    targetBuildingIndex: number,
    knightCount: number,
    gameTick: number,
  ): number {
    const target = this.world.buildings.get(targetBuildingIndex);
    const player = this.world.players[playerIndex];
    if (
      target === undefined ||
      !target.isDone ||
      target.player === playerIndex ||
      player === undefined ||
      player.castlePosition === null ||
      (!isMilitaryBuildingType(target.type) && target.type !== buildingType.castle)
    ) {
      return 0;
    }

    const targetFlag = this.world.flags.get(target.flagIndex);
    if (targetFlag === undefined) {
      return 0;
    }

    let sent = 0;
    while (sent < knightCount) {
      const knight = this.spawnKnightSerf(playerIndex, gameTick);
      if (knight === null) {
        break;
      }

      knight.attackTargetIndex = targetBuildingIndex;
      knight.workTargetPosition = targetFlag.position;
      knight.state = serfState.knightMarching;
      knight.tick = gameTick;
      knight.counter = 0;
      sent += 1;
    }

    return sent;
  }

  // Map.Dist over the wrapped axial grid: opposite-sign deltas share the
  // Down/Up diagonal, same-sign deltas must be walked separately.
  #hexDistance(from: number, to: number): number {
    const dx = this.world.geometry.distanceX(from, to);
    const dy = this.world.geometry.distanceY(from, to);
    if (dx * dy < 0) {
      return Math.max(Math.abs(dx), Math.abs(dy));
    }

    return Math.abs(dx) + Math.abs(dy);
  }

  // Attacking knights march off-road toward the target flag (the reference
  // FreeWalking path, condensed to a greedy descent on map distance).
  #handleKnightMarching(serf: WorldSerf, gameTick: number): void {
    const delta = (gameTick - serf.tick) & 0xffff;
    serf.tick = gameTick;
    serf.counter -= delta;

    while (serf.counter < 0) {
      if (serf.position === serf.workTargetPosition) {
        this.#engageBuilding(serf, gameTick);
        return;
      }

      // Greedy descent with sidestep: take the unblocked neighbor closest
      // to the target, never backtracking onto the previous tile, so the
      // march flows around buildings instead of wedging on them.
      let bestDirection: Direction | null = null;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (const direction of directionOrder) {
        const next = this.world.move(serf.position, direction);
        if (this.world.hasBuilding(next) || next === serf.workPhase) {
          continue;
        }

        const distance = this.#hexDistance(next, serf.workTargetPosition);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestDirection = direction;
        }
      }

      if (bestDirection === null) {
        serf.counter = 0;
        return;
      }

      serf.workPhase = serf.position;

      if (!this.#changeDirection(serf, bestDirection)) {
        serf.counter = 0;
        return;
      }
    }
  }

  // Engage the target: the next defender steps out and the fight begins;
  // an empty garrison leaves the attacker victorious at the flag
  // (capture consequences land with SB-15-04).
  #engageBuilding(serf: WorldSerf, gameTick: number): void {
    const building = this.world.buildings.get(serf.attackTargetIndex);
    if (building === undefined || building.player === serf.player) {
      serf.state = serfState.null;
      serf.counter = 0;
      return;
    }

    if (building.knights <= 0) {
      // No defenders left: the conquering knight takes the post
      // (Game.OccupyEnemyBuilding). A fallen castle means defeat; a
      // military building transfers and the victor garrisons it.
      const wasCastle = building.type === buildingType.castle;
      if (this.world.captureBuilding(building.index, serf.player)) {
        if (wasCastle) {
          serf.state = serfState.null;
          serf.attackTargetIndex = 0;
          serf.counter = 0;
        } else {
          building.knights = 1;
          this.serfIndexes[serf.position] = 0;
          serf.state = serfState.idleInStock;
          serf.position = building.position;
          serf.attackTargetIndex = 0;
        }

        return;
      }

      serf.state = serfState.null;
      serf.counter = 0;
      return;
    }

    building.knights -= 1;
    const defender: WorldSerf = {
      index: this.#nextSerfIndex,
      player: building.player,
      state: serfState.knightDefending,
      position: building.position,
      tick: gameTick,
      animation: 0,
      counter: 0,
      walkingDirection: 0,
      walkingDestination: 0,
      walkingWaitCounter: 0,
      slopeLength: 0,
      nextState: serfState.null,
      roadFlagIndex: 0,
      roadDirection: null,
      carriedResource: -1,
      carriedDestination: 0,
      buildTargetIndex: 0,
      workBuildingIndex: 0,
      workPhase: 0,
      workCounter: 0,
      workTargetPosition: -1,
      isKnight: true,
      garrisonTargetIndex: 0,
      knightRank: 0,
      attackTargetIndex: 0,
      fightOpponentIndex: serf.index,
      fightMove: 0,
      fightWon: false,
    };
    this.#nextSerfIndex += 1;
    this.serfs.set(defender.index, defender);

    serf.fightOpponentIndex = defender.index;
    this.#setFightOutcome(serf, defender);
    serf.state = serfState.knightAttacking;
    serf.counter = 0;
    serf.tick = gameTick;
  }

  // Serf.SetFightOutcome, exact reference math and RandomInt order:
  // rank doubles morale per level; fighting on foreign land swaps the
  // 0x1000 land factor for the player's gold-driven knight morale.
  #setFightOutcome(attacker: WorldSerf, defender: WorldSerf): void {
    const expFactor = 1 << attacker.knightRank;
    let landFactor = 0x1000;
    if (attacker.player !== this.world.owner(attacker.position)) {
      landFactor = this.world.players[attacker.player]?.knightMorale ?? 0x1000;
    }

    const morale = Math.floor((0x400 * expFactor * landFactor) / 0x10000);

    const defenderExpFactor = 1 << defender.knightRank;
    let defenderLandFactor = 0x1000;
    if (defender.player !== this.world.owner(defender.position)) {
      defenderLandFactor = this.world.players[defender.player]?.knightMorale ?? 0x1000;
    }

    const defenderMorale = Math.floor((0x400 * defenderExpFactor * defenderLandFactor) / 0x10000);

    const result = Math.floor(((morale + defenderMorale) * this.random.next()) / 0x10000);
    attacker.fightWon = result < morale;
    attacker.fightMove = this.random.next() & 0x70;
  }

  // Serf.HandleKnightAttacking: the attacker drives both serfs through the
  // fight sequence; a negative move resolves the fight with the outcome
  // decided in SetFightOutcome.
  #handleKnightAttacking(serf: WorldSerf, gameTick: number): void {
    const defender = this.serfs.get(serf.fightOpponentIndex);
    if (defender === undefined) {
      serf.state = serfState.null;
      return;
    }

    const delta = (gameTick - serf.tick) & 0xffff;
    serf.tick = gameTick;
    defender.tick = gameTick;
    serf.counter -= delta;
    defender.counter = serf.counter;

    while (serf.counter < 0) {
      const move = knightAttackMoves[serf.fightMove]!;
      if (move < 0) {
        const building = this.world.buildings.get(serf.attackTargetIndex);
        if (!serf.fightWon) {
          // Defender won: it returns to its building, the attacker dies.
          if (building !== undefined) {
            building.knights += 1;
          }

          this.serfs.delete(defender.index);
          serf.state = serfState.dead;
          serf.animation = 152 + serf.knightRank;
          serf.counter = 255;
          serf.fightOpponentIndex = 0;
        } else {
          // Attacker won: the defender dies, the attacker re-engages once
          // the body is carried off.
          defender.state = serfState.dead;
          defender.animation = 147 + serf.knightRank;
          defender.counter = 255;
          defender.tick = gameTick;
          serf.state = serfState.knightAttackingVictory;
          serf.animation = 168;
          serf.counter = 0;
        }

        return;
      }

      // Next move in the fight sequence; the defender's view mirrors it.
      serf.fightMove += 1;
      const displayMove = serf.fightWon ? move : 4 - move;
      const animationOffset = (this.random.next() * knightFightAnimMax[displayMove]!) >> 16;
      const knightAnimation = knightFightAnim[displayMove * 16 + animationOffset]!;
      serf.animation = 146 + ((knightAnimation >> 4) & 0xf);
      defender.animation = 156 + (knightAnimation & 0xf);
      serf.counter = 72 + (this.random.next() & 0x18);
      defender.counter = serf.counter;
    }
  }

  // Serf.HandleSerfKnightAttackingVictoryState: wait out the defender's
  // death animation, then engage the building again.
  #handleKnightAttackingVictory(serf: WorldSerf, gameTick: number): void {
    const defender = this.serfs.get(serf.fightOpponentIndex);
    if (defender === undefined) {
      this.#engageBuilding(serf, gameTick);
      return;
    }

    const delta = (gameTick - defender.tick) & 0xffff;
    defender.tick = gameTick;
    defender.counter -= delta;

    if (defender.counter < 0) {
      this.serfs.delete(defender.index);
      serf.fightOpponentIndex = 0;
      serf.tick = gameTick;
      this.#engageBuilding(serf, gameTick);
    }
  }

  // Dead serfs play out their death animation and leave the map.
  #handleDead(serf: WorldSerf, gameTick: number): void {
    const delta = (gameTick - serf.tick) & 0xffff;
    serf.tick = gameTick;
    serf.counter -= delta;

    if (serf.counter < 0) {
      if (this.serfIndexes[serf.position] === serf.index) {
        this.serfIndexes[serf.position] = 0;
      }

      this.serfs.delete(serf.index);
    }
  }

  // Greedy flag-graph routing toward the destination flag (condensed
  // reference FlagSearch breadth-first; sufficient for tree road networks,
  // replaced by the full search with transport scheduling).
  #directionToward(fromFlagIndex: number, destinationFlagIndex: number): Direction | null {
    const visited = new Set<number>([fromFlagIndex]);
    const queue: { flagIndex: number; firstDirection: Direction | null }[] = [
      { flagIndex: fromFlagIndex, firstDirection: null },
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const flag = this.world.flags.get(current.flagIndex);
      if (flag === undefined) {
        continue;
      }

      for (const direction of directionOrder) {
        const path = flag.paths[direction];
        if (!path.hasPath || visited.has(path.otherFlagIndex)) {
          continue;
        }

        const firstDirection = current.firstDirection ?? direction;
        if (path.otherFlagIndex === destinationFlagIndex) {
          return firstDirection;
        }

        visited.add(path.otherFlagIndex);
        queue.push({ flagIndex: path.otherFlagIndex, firstDirection });
      }
    }

    return null;
  }
}
