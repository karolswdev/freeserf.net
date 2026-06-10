import type { Direction } from "./index.js";
import {
  buildingConstructionCosts,
  type SerfboundGameWorld,
  type WorldBuilding,
} from "./game-world.js";

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
} as const;

export type SerfStateValue = (typeof serfState)[keyof typeof serfState];

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
};

export class SerfboundSerfEngine {
  readonly world: SerfboundGameWorld;
  readonly serfs = new Map<number, WorldSerf>();
  // Map position -> serf index (Map.SetSerfIndex equivalent; 0 = none).
  readonly serfIndexes: Uint32Array;
  #nextSerfIndex = 1;
  readonly #dispatchedBuildings = new Set<number>();

  constructor(world: SerfboundGameWorld) {
    this.world = world;
    this.serfIndexes = new Uint32Array(world.tileCount);
  }

  hasSerfAt(position: number): boolean {
    return this.serfIndexes[position] !== 0;
  }

  serfAt(position: number): WorldSerf | null {
    const index = this.serfIndexes[position]!;
    return index === 0 ? null : (this.serfs.get(index) ?? null);
  }

  // Serf.InitGeneric: spawn inside the castle inventory.
  spawnGenericSerf(player: number, gameTick: number): WorldSerf | null {
    const castlePosition = this.world.players[player]?.castlePosition;
    if (castlePosition === undefined || castlePosition === null) {
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
    };
    this.#nextSerfIndex += 1;
    this.serfs.set(serf.index, serf);
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
        case serfState.leavingBuilding:
          this.#handleLeavingBuilding(serf, gameTick);
          break;
        case serfState.enteringBuilding:
          this.#handleEnteringBuilding(serf, gameTick);
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
          // any building entry.
          if (serf.roadDirection !== null && flag.index === serf.roadFlagIndex) {
            serf.state = serfState.idleOnPath;
            serf.counter = 0;
            return;
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
          this.#deliverCarriedResource(serf, flag);
          serf.state = serfState.idleOnPath;
          serf.counter = 0;
          return;
        }

        const direction = this.#directionToward(flag.index, serf.walkingDestination);
        if (direction === null) {
          serf.state = serfState.idleOnPath;
          serf.counter = 0;
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

  #deliverCarriedResource(serf: WorldSerf, flag: import("./game-world.js").WorldFlag): void {
    if (serf.carriedResource < 0) {
      return;
    }

    if (flag.index === serf.carriedDestination && flag.buildingIndex !== null) {
      const building = this.world.buildings.get(flag.buildingIndex);
      if (building !== undefined) {
        building.deliveredResources[serf.carriedResource] =
          (building.deliveredResources[serf.carriedResource] ?? 0) + 1;
        serf.carriedResource = -1;
        serf.carriedDestination = 0;
        return;
      }
    }

    // Hand over to the next road's transporter via the flag slots.
    this.world.dropResource(flag.index, serf.carriedResource, serf.carriedDestination);
    serf.carriedResource = -1;
    serf.carriedDestination = 0;
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

    // Materials: planks are resource 7, stones resource 9 (reference order).
    const [planks, stones] = buildingConstructionCosts[building.type] ?? [0, 0];
    for (let count = 0; count < planks; count += 1) {
      this.world.dropResource(castleFlag.index, 7, buildingFlag.index);
    }

    for (let count = 0; count < stones; count += 1) {
      this.world.dropResource(castleFlag.index, 9, buildingFlag.index);
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

  // Serf.ChangeDirection: move one tile; on collision, wait with the
  // reference waiting animation (81 + direction) and negative direction.
  #changeDirection(serf: WorldSerf, direction: Direction): boolean {
    const newPosition = this.world.move(serf.position, direction);

    if (this.hasSerfAt(newPosition)) {
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
