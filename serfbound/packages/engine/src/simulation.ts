import {
  FreeserfRandom,
  MapGeometry,
  type RandomState,
  uint16,
  uint32,
} from "./index.js";

export const defaultGameSpeed = 2;
export const tickLengthMs = 20;
export const ticksPerSecond = 1000 / tickLengthMs;

export type SerfboundTickEvent =
  | "knight-morale-scheduled"
  | "inventory-scheduled";

export type SerfboundGameSnapshot = {
  readonly schemaVersion: 1;
  readonly kind: "serfbound.game-state-skeleton";
  readonly map: {
    readonly size: number;
    readonly columns: number;
    readonly rows: number;
    readonly tileCount: number;
  };
  readonly clock: {
    readonly tick: number;
    readonly constTick: number;
    readonly gameTimeTicksOfSecond: number;
    readonly gameTime: number;
    readonly gameSpeed: number;
    readonly nextGameTime: number;
    readonly tickDifference: number;
  };
  readonly random: {
    readonly state: RandomState;
    readonly seedString: string;
  };
  readonly counters: {
    readonly knightMoraleCounter: number;
    readonly inventoryScheduleCounter: number;
  };
  readonly builtStructures: readonly SerfboundBuiltStructure[];
  readonly worldActions?: readonly unknown[];
};

export type SerfboundBuiltStructureKind = "flag";

export type SerfboundBuiltStructure = {
  readonly id: number;
  readonly kind: SerfboundBuiltStructureKind;
  readonly tile: {
    readonly column: number;
    readonly row: number;
    readonly position: number;
  };
  readonly placedAtTick: number;
};

export type SerfboundGameStateOptions = {
  readonly mapSize?: number;
  readonly tick?: number;
  readonly constTick?: number;
  readonly gameTimeTicksOfSecond?: number;
  readonly gameTime?: number;
  readonly gameSpeed?: number;
  readonly random?: FreeserfRandom;
  readonly knightMoraleCounter?: number;
  readonly inventoryScheduleCounter?: number;
  readonly tickDifference?: number;
  readonly builtStructures?: readonly SerfboundBuiltStructure[];
  readonly worldActions?: readonly unknown[];
};

export class SerfboundGameState {
  readonly mapGeometry: MapGeometry;

  #tick: number;
  #constTick: number;
  #gameTimeTicksOfSecond: number;
  #gameTime: number;
  #gameSpeed: number;
  #random: FreeserfRandom;
  #tickDifference = 0;
  #knightMoraleCounter: number;
  #inventoryScheduleCounter: number;
  #builtStructures: SerfboundBuiltStructure[];
  #worldActions: unknown[] = [];

  constructor(options: SerfboundGameStateOptions = {}) {
    this.mapGeometry = new MapGeometry(options.mapSize ?? 3);
    this.#tick = uint16(options.tick ?? 0);
    this.#constTick = uint32(options.constTick ?? 0);
    this.#gameTimeTicksOfSecond = uint16(options.gameTimeTicksOfSecond ?? 0);
    this.#gameTime = uint32(options.gameTime ?? 0);
    this.#gameSpeed = uint16(options.gameSpeed ?? defaultGameSpeed);
    this.#random = options.random?.clone() ?? FreeserfRandom.fromWord(0);
    this.#tickDifference = Math.trunc(options.tickDifference ?? 0);
    this.#knightMoraleCounter = Math.trunc(options.knightMoraleCounter ?? 0);
    this.#inventoryScheduleCounter = Math.trunc(options.inventoryScheduleCounter ?? 0);
    this.#worldActions = [...(options.worldActions ?? [])];
    this.#builtStructures = (options.builtStructures ?? []).map((structure) => ({
      id: Math.trunc(structure.id),
      kind: structure.kind,
      tile: { ...structure.tile },
      placedAtTick: uint32(structure.placedAtTick),
    }));
  }

  static fromSnapshot(snapshot: SerfboundGameSnapshot): SerfboundGameState {
    if (snapshot.schemaVersion !== 1 || snapshot.kind !== "serfbound.game-state-skeleton") {
      throw new Error("Unsupported Serfbound game snapshot.");
    }

    return new SerfboundGameState({
      mapSize: snapshot.map.size,
      tick: snapshot.clock.tick,
      constTick: snapshot.clock.constTick,
      gameTimeTicksOfSecond: snapshot.clock.gameTimeTicksOfSecond,
      gameTime: snapshot.clock.gameTime,
      gameSpeed: snapshot.clock.gameSpeed,
      random: FreeserfRandom.fromState(...snapshot.random.state),
      tickDifference: snapshot.clock.tickDifference,
      knightMoraleCounter: snapshot.counters.knightMoraleCounter,
      inventoryScheduleCounter: snapshot.counters.inventoryScheduleCounter,
      builtStructures: snapshot.builtStructures,
      worldActions: snapshot.worldActions ?? [],
    });
  }

  get tick(): number {
    return this.#tick;
  }

  get constTick(): number {
    return this.#constTick;
  }

  get gameTime(): number {
    return this.#gameTime;
  }

  get nextGameTime(): number {
    return uint32(
      this.#gameTime +
        Math.floor((this.#gameTimeTicksOfSecond + this.#gameSpeed) / ticksPerSecond),
    );
  }

  get random(): FreeserfRandom {
    return this.#random.clone();
  }

  nextRandomInt(): number {
    return this.#random.next();
  }

  // A monotonic tick counter for window/turn bookkeeping (SB-23-02):
  // the uint16 game tick wraps every 65536 ticks; game time (uint32
  // seconds plus the sub-second tick remainder) does not. Increments by
  // gameSpeed per advance, exactly like the wrapped tick.
  get monotonicTick(): number {
    return this.gameTime * ticksPerSecond + this.#gameTimeTicksOfSecond;
  }

  advanceTick(): readonly SerfboundTickEvent[] {
    this.#constTick = this.#constTick === 0xffffffff ? 0 : uint32(this.#constTick + 1);

    const lastTick = this.#tick;
    this.#tick = uint16(this.#tick + this.#gameSpeed);
    this.#gameTimeTicksOfSecond = uint16(this.#gameTimeTicksOfSecond + this.#gameSpeed);

    while (this.#gameTimeTicksOfSecond >= ticksPerSecond) {
      this.#gameTimeTicksOfSecond = uint16(this.#gameTimeTicksOfSecond - ticksPerSecond);
      this.#gameTime = uint32(this.#gameTime + 1);
    }

    this.#tickDifference =
      lastTick > this.#tick ? this.#tick + 0xffff - lastTick : this.#tick - lastTick;

    const events: SerfboundTickEvent[] = [];
    this.#knightMoraleCounter -= this.#tickDifference;
    if (this.#knightMoraleCounter < 0) {
      this.#knightMoraleCounter += 256;
      events.push("knight-morale-scheduled");
    }

    this.#inventoryScheduleCounter -= this.#tickDifference;
    if (this.#inventoryScheduleCounter < 0) {
      this.#inventoryScheduleCounter += 64;
      events.push("inventory-scheduled");
    }

    return events;
  }

  advanceTicks(count: number): readonly SerfboundTickEvent[] {
    const events: SerfboundTickEvent[] = [];

    for (let index = 0; index < Math.trunc(count); index += 1) {
      events.push(...this.advanceTick());
    }

    return events;
  }

  get worldActions(): readonly unknown[] {
    return [...this.#worldActions];
  }

  recordWorldAction(action: unknown): void {
    this.#worldActions.push(action);
  }

  get builtStructures(): readonly SerfboundBuiltStructure[] {
    return this.#builtStructures.map((structure) => ({
      ...structure,
      tile: { ...structure.tile },
    }));
  }

  buildFlag(tile: SerfboundBuiltStructure["tile"]): SerfboundBuiltStructure {
    const existing = this.#builtStructures.find(
      (structure) => structure.tile.position === tile.position,
    );
    if (existing !== undefined) {
      throw new Error("A structure already exists at this tile.");
    }

    const structure: SerfboundBuiltStructure = {
      id: this.#builtStructures.length + 1,
      kind: "flag",
      tile: { ...tile },
      placedAtTick: this.#constTick,
    };
    this.#builtStructures.push(structure);

    return {
      ...structure,
      tile: { ...structure.tile },
    };
  }

  snapshot(): SerfboundGameSnapshot {
    return {
      schemaVersion: 1,
      kind: "serfbound.game-state-skeleton",
      map: {
        size: this.mapGeometry.size,
        columns: this.mapGeometry.columns,
        rows: this.mapGeometry.rows,
        tileCount: this.mapGeometry.tileCount,
      },
      clock: {
        tick: this.#tick,
        constTick: this.#constTick,
        gameTimeTicksOfSecond: this.#gameTimeTicksOfSecond,
        gameTime: this.#gameTime,
        gameSpeed: this.#gameSpeed,
        nextGameTime: this.nextGameTime,
        tickDifference: this.#tickDifference,
      },
      random: {
        state: this.#random.state,
        seedString: this.#random.toString(),
      },
      counters: {
        knightMoraleCounter: this.#knightMoraleCounter,
        inventoryScheduleCounter: this.#inventoryScheduleCounter,
      },
      builtStructures: this.builtStructures,
      worldActions: this.worldActions,
    };
  }
}
