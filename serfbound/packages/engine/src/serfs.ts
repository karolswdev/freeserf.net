import type { Direction } from "./index.js";
import type { SerfboundGameWorld } from "./game-world.js";

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
};

export class SerfboundSerfEngine {
  readonly world: SerfboundGameWorld;
  readonly serfs = new Map<number, WorldSerf>();
  // Map position -> serf index (Map.SetSerfIndex equivalent; 0 = none).
  readonly serfIndexes: Uint32Array;
  #nextSerfIndex = 1;

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

  // Game.UpdateSerfs equivalent.
  update(gameTick: number): void {
    for (const serf of [...this.serfs.values()]) {
      switch (serf.state) {
        case serfState.walking:
          this.#handleWalking(serf, gameTick);
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
