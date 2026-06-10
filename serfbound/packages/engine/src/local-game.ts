import { FreeserfRandom, uint16 } from "./index.js";
import { SerfboundGameWorld } from "./game-world.js";
import { SerfboundSerfEngine } from "./serfs.js";
import { generateClassicMap, type ClassicMapLandscape } from "./map-generator.js";
import { SerfboundGameState, type SerfboundGameSnapshot } from "./simulation.js";
import { isSerfboundWorldAction, replayWorldActions } from "./world-commands.js";

export type SerfboundLocalGameDataSource = {
  readonly kind: "imported-dos-pa-catalog";
  readonly archiveName: string;
  readonly byteLength: number;
  readonly entryCount: number;
  readonly definedArchiveEntries: number;
  readonly fixupCount: number;
};

export type SerfboundLocalGameSettings = {
  readonly mapSize: number;
  readonly seedString: string;
  // GameInitBox player supplies (0..40, reference custom-game slider).
  readonly initialSupplies: number;
  // Mission play: total player slots and per-player supplies presets.
  readonly playerCount?: number;
  readonly playerSupplies?: readonly number[];
};

export type SerfboundLocalGameStartOptions = {
  readonly data?: SerfboundLocalGameDataSource;
  readonly mapSize?: number;
  readonly seedString?: string;
  readonly initialSupplies?: number;
  readonly playerCount?: number;
  readonly playerSupplies?: readonly number[];
};

export type SerfboundLocalGameSnapshot = {
  readonly schemaVersion: 1;
  readonly kind: "serfbound.local-game";
  readonly mode: "local-single-player";
  readonly status: "running";
  readonly data: SerfboundLocalGameDataSource;
  readonly settings: SerfboundLocalGameSettings;
  readonly state: SerfboundGameSnapshot;
  readonly renderer: {
    readonly sceneSource: "dos-pa-catalog";
  };
};

export type SerfboundLocalGameStartRejectionReason =
  | "missing-imported-data"
  | "invalid-map-size"
  | "invalid-seed";
export type SerfboundLocalGameRestoreRejectionReason =
  | "invalid-snapshot"
  | "invalid-map-size"
  | "invalid-seed";

export type SerfboundLocalGameStarted = {
  readonly status: "started";
  readonly game: SerfboundLocalGame;
  readonly snapshot: SerfboundLocalGameSnapshot;
};

export type SerfboundLocalGameRejected = {
  readonly status: "rejected";
  readonly reason: SerfboundLocalGameStartRejectionReason;
  readonly message: string;
};

export type SerfboundLocalGameStartResult =
  | SerfboundLocalGameStarted
  | SerfboundLocalGameRejected;
export type SerfboundLocalGameRestoreRejected = {
  readonly status: "rejected";
  readonly reason: SerfboundLocalGameRestoreRejectionReason;
  readonly message: string;
};
export type SerfboundLocalGameRestoreResult =
  | SerfboundLocalGameStarted
  | SerfboundLocalGameRestoreRejected;

export class SerfboundLocalGame {
  readonly mode = "local-single-player";
  readonly status = "running";
  readonly data: SerfboundLocalGameDataSource;
  readonly settings: SerfboundLocalGameSettings;
  readonly state: SerfboundGameState;
  #landscape: ClassicMapLandscape | undefined;
  #world: SerfboundGameWorld | undefined;
  #serfEngine: SerfboundSerfEngine | undefined;

  constructor(
    data: SerfboundLocalGameDataSource,
    settings: SerfboundLocalGameSettings,
    state: SerfboundGameState,
  ) {
    this.data = data;
    this.settings = settings;
    this.state = state;
  }

  // The landscape regenerates deterministically from the settings, so saves
  // stay small and restored games rebuild the identical world.
  landscape(): ClassicMapLandscape {
    this.#landscape ??= landscapeForLocalGameSettings(this.settings);
    return this.#landscape;
  }

  // The game world rebuilds from the landscape plus the accepted world-action
  // log (saved in the game state), so restores replay to identical state.
  world(): SerfboundGameWorld {
    if (this.#world === undefined) {
      this.#world = new SerfboundGameWorld(this.landscape(), this.settings.playerCount ?? 1);
      this.#world.initialSupplies = this.settings.initialSupplies ?? 20;
      if (this.settings.playerSupplies !== undefined) {
        this.#world.playerSupplies = [...this.settings.playerSupplies];
      }
      replayWorldActions(
        this.#world,
        this.state.worldActions.filter(isSerfboundWorldAction),
      );
    }

    return this.#world;
  }

  // The serf engine lives on the same world. In-flight serf state is not yet
  // serialized (recorded Phase 13 limitation): restored games re-dispatch
  // construction logistics for unfinished buildings.
  serfEngine(): SerfboundSerfEngine {
    if (this.#serfEngine === undefined) {
      // Combat randomness is seeded from the game seed so identical games
      // resolve identical fights.
      this.#serfEngine = new SerfboundSerfEngine(
        this.world(),
        FreeserfRandom.fromStringSeed(this.settings.seedString),
      );
      for (const building of this.world().buildings.values()) {
        if (!building.isDone) {
          this.#serfEngine.dispatchConstructionLogistics(building, this.state.tick);
        }
      }
    }

    return this.#serfEngine;
  }

  snapshot(): SerfboundLocalGameSnapshot {
    return {
      schemaVersion: 1,
      kind: "serfbound.local-game",
      mode: this.mode,
      status: this.status,
      data: this.data,
      settings: this.settings,
      state: this.state.snapshot(),
      renderer: {
        sceneSource: "dos-pa-catalog",
      },
    };
  }
}

export function startSerfboundLocalGame(
  options: SerfboundLocalGameStartOptions,
): SerfboundLocalGameStartResult {
  if (options.data === undefined) {
    return {
      status: "rejected",
      reason: "missing-imported-data",
      message: "A local Serfbound game requires imported SPAU.PA catalog data.",
    };
  }

  const mapSize = Math.trunc(options.mapSize ?? 3);
  if (!Number.isInteger(mapSize) || mapSize < 1 || mapSize > 23) {
    return {
      status: "rejected",
      reason: "invalid-map-size",
      message: "Local game map size must be an integer from 1 through 23.",
    };
  }

  const seedString = options.seedString ?? deriveLocalGameSeedString(options.data, mapSize);
  let random: FreeserfRandom;
  try {
    random = FreeserfRandom.fromStringSeed(seedString);
  } catch {
    return {
      status: "rejected",
      reason: "invalid-seed",
      message: "Local game seed must contain 16 digits from 1 to 8.",
    };
  }

  const state = new SerfboundGameState({
    mapSize,
    random,
  });
  const initialSupplies = Math.max(0, Math.min(40, Math.trunc(options.initialSupplies ?? 20)));
  const game = new SerfboundLocalGame(
    options.data,
    {
      mapSize,
      seedString,
      initialSupplies,
      ...(options.playerCount === undefined ? {} : { playerCount: options.playerCount }),
      ...(options.playerSupplies === undefined
        ? {}
        : { playerSupplies: [...options.playerSupplies] }),
    },
    state,
  );

  return {
    status: "started",
    game,
    snapshot: game.snapshot(),
  };
}

export function restoreSerfboundLocalGame(
  snapshot: unknown,
): SerfboundLocalGameRestoreResult {
  if (!isLocalGameSnapshotShape(snapshot)) {
    return {
      status: "rejected",
      reason: "invalid-snapshot",
      message: "Saved local game data is not a Serfbound local game snapshot.",
    };
  }

  if (
    !Number.isInteger(snapshot.settings.mapSize) ||
    snapshot.settings.mapSize < 1 ||
    snapshot.settings.mapSize > 23 ||
    snapshot.state.map.size !== snapshot.settings.mapSize
  ) {
    return {
      status: "rejected",
      reason: "invalid-map-size",
      message: "Saved local game map size is invalid.",
    };
  }

  try {
    FreeserfRandom.fromStringSeed(snapshot.settings.seedString);
  } catch {
    return {
      status: "rejected",
      reason: "invalid-seed",
      message: "Saved local game seed is invalid.",
    };
  }

  let state: SerfboundGameState;
  try {
    state = SerfboundGameState.fromSnapshot(snapshot.state);
  } catch {
    return {
      status: "rejected",
      reason: "invalid-snapshot",
      message: "Saved local game state could not be restored.",
    };
  }

  const game = new SerfboundLocalGame(
    { ...snapshot.data },
    { ...snapshot.settings },
    state,
  );

  return {
    status: "started",
    game,
    snapshot: game.snapshot(),
  };
}

export function landscapeForLocalGameSettings(
  settings: SerfboundLocalGameSettings,
): ClassicMapLandscape {
  const [seed0, seed1, seed2] = FreeserfRandom.fromStringSeed(settings.seedString).state;
  return generateClassicMap(settings.mapSize, [seed0, seed1, seed2]);
}

export function deriveLocalGameSeedString(
  data: SerfboundLocalGameDataSource,
  mapSize = 3,
): string {
  const fields = [
    data.kind,
    data.archiveName,
    data.byteLength,
    data.entryCount,
    data.definedArchiveEntries,
    data.fixupCount,
    Math.trunc(mapSize),
  ];
  let hash = 0x811c9dc5;
  const seedDigits: string[] = [];

  for (const field of fields) {
    for (const char of String(field)) {
      hash ^= char.charCodeAt(0);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    hash ^= 0xff;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }

  for (let index = 0; index < 16; index += 1) {
    hash ^= index + 0x9e3779b9;
    hash = Math.imul(hash, 0x85ebca6b) >>> 0;
    seedDigits.push(String((uint16(hash) & 0x07) + 1));
  }

  return seedDigits.join("");
}

function isLocalGameSnapshotShape(input: unknown): input is SerfboundLocalGameSnapshot {
  if (!isRecord(input)) {
    return false;
  }

  const snapshot = input as Partial<SerfboundLocalGameSnapshot>;
  return (
    snapshot.schemaVersion === 1 &&
    snapshot.kind === "serfbound.local-game" &&
    snapshot.mode === "local-single-player" &&
    snapshot.status === "running" &&
    isLocalGameDataSource(snapshot.data) &&
    isLocalGameSettings(snapshot.settings) &&
    isGameStateSnapshotShape(snapshot.state) &&
    isRecord(snapshot.renderer) &&
    snapshot.renderer.sceneSource === "dos-pa-catalog"
  );
}

function isLocalGameDataSource(input: unknown): input is SerfboundLocalGameDataSource {
  if (!isRecord(input)) {
    return false;
  }

  const data = input as Partial<SerfboundLocalGameDataSource>;
  return (
    data.kind === "imported-dos-pa-catalog" &&
    typeof data.archiveName === "string" &&
    isNonNegativeInteger(data.byteLength) &&
    isNonNegativeInteger(data.entryCount) &&
    isNonNegativeInteger(data.definedArchiveEntries) &&
    isNonNegativeInteger(data.fixupCount)
  );
}

function isLocalGameSettings(input: unknown): input is SerfboundLocalGameSettings {
  if (!isRecord(input)) {
    return false;
  }

  const settings = input as Partial<SerfboundLocalGameSettings>;
  return (
    Number.isInteger(settings.mapSize) &&
    typeof settings.seedString === "string" &&
    (settings.initialSupplies === undefined || Number.isInteger(settings.initialSupplies))
  );
}

function isGameStateSnapshotShape(input: unknown): input is SerfboundGameSnapshot {
  if (!isRecord(input)) {
    return false;
  }

  const snapshot = input as Partial<SerfboundGameSnapshot>;
  return (
    snapshot.schemaVersion === 1 &&
    snapshot.kind === "serfbound.game-state-skeleton" &&
    isRecord(snapshot.map) &&
    isRecord(snapshot.clock) &&
    isRecord(snapshot.random) &&
    isRecord(snapshot.counters) &&
    Array.isArray(snapshot.builtStructures)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === "number" && value >= 0;
}
