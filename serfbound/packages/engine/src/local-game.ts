import { FreeserfRandom, uint16 } from "./index.js";
import { SerfboundGameState, type SerfboundGameSnapshot } from "./simulation.js";

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
};

export type SerfboundLocalGameStartOptions = {
  readonly data?: SerfboundLocalGameDataSource;
  readonly mapSize?: number;
  readonly seedString?: string;
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

export class SerfboundLocalGame {
  readonly mode = "local-single-player";
  readonly status = "running";
  readonly data: SerfboundLocalGameDataSource;
  readonly settings: SerfboundLocalGameSettings;
  readonly state: SerfboundGameState;

  constructor(
    data: SerfboundLocalGameDataSource,
    settings: SerfboundLocalGameSettings,
    state: SerfboundGameState,
  ) {
    this.data = data;
    this.settings = settings;
    this.state = state;
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
  const game = new SerfboundLocalGame(
    options.data,
    {
      mapSize,
      seedString,
    },
    state,
  );

  return {
    status: "started",
    game,
    snapshot: game.snapshot(),
  };
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
