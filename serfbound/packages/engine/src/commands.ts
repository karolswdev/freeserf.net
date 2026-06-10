import type { MapPoint, MapTile } from "./index.js";
import { SerfboundGameState } from "./simulation.js";

export type SerfboundCommandSource = "pointer" | "keyboard" | "system";

export type SerfboundBuildTarget = "flag" | "road" | "hut";

export type SerfboundDebugInspectTileCommand = {
  readonly type: "debug.inspect-map-tile";
  readonly tile: MapTile;
  readonly map?: MapPoint;
  readonly source?: SerfboundCommandSource;
};

export type SerfboundBuildCommand = {
  readonly type: "game.build";
  readonly tile: MapTile;
  readonly building: SerfboundBuildTarget;
  readonly source?: SerfboundCommandSource;
};

export type SerfboundCommand =
  | SerfboundDebugInspectTileCommand
  | SerfboundBuildCommand;

export type SerfboundCommandRejectReason =
  | "unsupported-command"
  | "invalid-command"
  | "invalid-command-source"
  | "invalid-tile"
  | "invalid-map-coordinate"
  | "invalid-build-target"
  | "build-command-deferred";

export type SerfboundCommandRouteSnapshot = {
  readonly schemaVersion: 1;
  readonly kind: "serfbound.command-router";
  readonly commandLogLength: number;
  readonly game: {
    readonly tick: number;
    readonly constTick: number;
    readonly gameTime: number;
  };
  readonly map: {
    readonly size: number;
    readonly columns: number;
    readonly rows: number;
    readonly tileCount: number;
  };
  readonly debug: {
    readonly lastInspectedTile?: MapTile;
  };
};

export type SerfboundAcceptedCommandResult = {
  readonly status: "accepted";
  readonly commandId: number;
  readonly command: SerfboundCommand;
  readonly effect: "debug-inspection-recorded";
  readonly snapshot: SerfboundCommandRouteSnapshot;
};

export type SerfboundRejectedCommandResult = {
  readonly status: "rejected";
  readonly commandId: number;
  readonly reason: SerfboundCommandRejectReason;
  readonly message: string;
  readonly commandType?: string;
  readonly command?: SerfboundCommand;
  readonly snapshot: SerfboundCommandRouteSnapshot;
};

export type SerfboundCommandResult =
  | SerfboundAcceptedCommandResult
  | SerfboundRejectedCommandResult;

export type SerfboundCommandLogEntry = {
  readonly commandId: number;
  readonly status: SerfboundCommandResult["status"];
  readonly commandType?: string;
  readonly reason?: SerfboundCommandRejectReason;
  readonly tile?: MapTile;
  readonly source?: SerfboundCommandSource;
};

type CommandParseResult =
  | { readonly status: "valid"; readonly command: SerfboundCommand }
  | {
      readonly status: "invalid";
      readonly reason: SerfboundCommandRejectReason;
      readonly message: string;
      readonly commandType?: string;
    };

type TileParseResult =
  | { readonly status: "valid"; readonly tile: MapTile }
  | {
      readonly status: "invalid";
      readonly reason: "invalid-tile";
      readonly message: string;
    };

const commandSources = new Set<SerfboundCommandSource>([
  "pointer",
  "keyboard",
  "system",
]);
const buildTargets = new Set<SerfboundBuildTarget>(["flag", "road", "hut"]);

export class SerfboundCommandRouter {
  readonly state: SerfboundGameState;

  #nextCommandId = 1;
  #log: SerfboundCommandLogEntry[] = [];
  #lastInspectedTile: MapTile | undefined;

  constructor(state: SerfboundGameState = new SerfboundGameState()) {
    this.state = state;
  }

  get log(): readonly SerfboundCommandLogEntry[] {
    return this.#log.map((entry) => ({ ...entry }));
  }

  dispatch(input: unknown): SerfboundCommandResult {
    const commandId = this.#nextCommandId;
    this.#nextCommandId += 1;

    const parsed = this.parseCommand(input);
    if (parsed.status === "invalid") {
      const result: SerfboundRejectedCommandResult = {
        status: "rejected",
        commandId,
        reason: parsed.reason,
        message: parsed.message,
        ...(parsed.commandType === undefined ? {} : { commandType: parsed.commandType }),
        snapshot: this.snapshot(this.#log.length + 1),
      };
      this.#log.push(logEntryFromResult(result));
      return result;
    }

    if (parsed.command.type === "game.build") {
      const result: SerfboundRejectedCommandResult = {
        status: "rejected",
        commandId,
        reason: "build-command-deferred",
        message: "Build command route is reserved for Phase 7 build-action semantics.",
        commandType: parsed.command.type,
        command: parsed.command,
        snapshot: this.snapshot(this.#log.length + 1),
      };
      this.#log.push(logEntryFromResult(result));
      return result;
    }

    this.#lastInspectedTile = parsed.command.tile;
    const result: SerfboundAcceptedCommandResult = {
      status: "accepted",
      commandId,
      command: parsed.command,
      effect: "debug-inspection-recorded",
      snapshot: this.snapshot(this.#log.length + 1),
    };
    this.#log.push(logEntryFromResult(result));
    return result;
  }

  private parseCommand(input: unknown): CommandParseResult {
    if (!isRecord(input)) {
      return invalidCommand("Command must be an object.");
    }

    if (typeof input.type !== "string") {
      return invalidCommand("Command type must be a string.");
    }

    switch (input.type) {
      case "debug.inspect-map-tile":
        return this.parseDebugInspectCommand(input);
      case "game.build":
        return this.parseBuildCommand(input);
      default:
        return {
          status: "invalid",
          reason: "unsupported-command",
          message: `Unsupported command type: ${input.type}.`,
          commandType: input.type,
        };
    }
  }

  private parseDebugInspectCommand(input: Record<string, unknown>): CommandParseResult {
    const tile = this.parseTile(input.tile);
    if (tile.status === "invalid") {
      return tile;
    }

    const map = parseOptionalMapPoint(input.map);
    if (map.status === "invalid") {
      return map;
    }

    const source = parseOptionalSource(input.source);
    if (source.status === "invalid") {
      return source;
    }

    return {
      status: "valid",
      command: {
        type: "debug.inspect-map-tile",
        tile: tile.tile,
        ...(map.point === undefined ? {} : { map: map.point }),
        ...(source.source === undefined ? {} : { source: source.source }),
      },
    };
  }

  private parseBuildCommand(input: Record<string, unknown>): CommandParseResult {
    const tile = this.parseTile(input.tile);
    if (tile.status === "invalid") {
      return tile;
    }

    if (
      typeof input.building !== "string" ||
      !buildTargets.has(input.building as SerfboundBuildTarget)
    ) {
      return {
        status: "invalid",
        reason: "invalid-build-target",
        message: "Build command target must be flag, road, or hut.",
        commandType: "game.build",
      };
    }

    const source = parseOptionalSource(input.source);
    if (source.status === "invalid") {
      return source;
    }

    return {
      status: "valid",
      command: {
        type: "game.build",
        tile: tile.tile,
        building: input.building as SerfboundBuildTarget,
        ...(source.source === undefined ? {} : { source: source.source }),
      },
    };
  }

  private parseTile(input: unknown): TileParseResult {
    if (!isRecord(input)) {
      return {
        status: "invalid",
        reason: "invalid-tile",
        message: "Command tile must include column, row, and position.",
      };
    }

    const { column, row, position } = input;
    if (
      !isInteger(column) ||
      !isInteger(row) ||
      !isInteger(position) ||
      column < 0 ||
      row < 0 ||
      column >= this.state.mapGeometry.columns ||
      row >= this.state.mapGeometry.rows ||
      position < 0 ||
      position >= this.state.mapGeometry.tileCount
    ) {
      return {
        status: "invalid",
        reason: "invalid-tile",
        message: "Command tile is outside the current map geometry.",
      };
    }

    const expectedPosition = this.state.mapGeometry.position(column, row);
    if (position !== expectedPosition) {
      return {
        status: "invalid",
        reason: "invalid-tile",
        message: `Command tile position ${position} does not match column ${column}, row ${row}.`,
      };
    }

    return {
      status: "valid",
      tile: { column, row, position },
    };
  }

  private snapshot(commandLogLength: number): SerfboundCommandRouteSnapshot {
    const game = this.state.snapshot();
    return {
      schemaVersion: 1,
      kind: "serfbound.command-router",
      commandLogLength,
      game: {
        tick: game.clock.tick,
        constTick: game.clock.constTick,
        gameTime: game.clock.gameTime,
      },
      map: game.map,
      debug: {
        ...(this.#lastInspectedTile === undefined
          ? {}
          : { lastInspectedTile: this.#lastInspectedTile }),
      },
    };
  }
}

function logEntryFromResult(result: SerfboundCommandResult): SerfboundCommandLogEntry {
  const command = result.status === "accepted" ? result.command : result.command;
  return {
    commandId: result.commandId,
    status: result.status,
    ...(result.status === "accepted"
      ? { commandType: result.command.type }
      : result.commandType === undefined
        ? {}
        : { commandType: result.commandType }),
    ...(result.status === "rejected" ? { reason: result.reason } : {}),
    ...(command === undefined ? {} : { tile: command.tile }),
    ...(command?.source === undefined ? {} : { source: command.source }),
  };
}

function invalidCommand(message: string): CommandParseResult {
  return {
    status: "invalid",
    reason: "invalid-command",
    message,
  };
}

function parseOptionalSource(
  input: unknown,
):
  | { readonly status: "valid"; readonly source: SerfboundCommandSource | undefined }
  | {
      readonly status: "invalid";
      readonly reason: "invalid-command-source";
      readonly message: string;
    } {
  if (input === undefined) {
    return { status: "valid", source: undefined };
  }

  if (typeof input === "string" && commandSources.has(input as SerfboundCommandSource)) {
    return { status: "valid", source: input as SerfboundCommandSource };
  }

  return {
    status: "invalid",
    reason: "invalid-command-source",
    message: "Command source must be pointer, keyboard, or system.",
  };
}

function parseOptionalMapPoint(
  input: unknown,
):
  | { readonly status: "valid"; readonly point: MapPoint | undefined }
  | {
      readonly status: "invalid";
      readonly reason: "invalid-map-coordinate";
      readonly message: string;
    } {
  if (input === undefined) {
    return { status: "valid", point: undefined };
  }

  if (!isRecord(input)) {
    return {
      status: "invalid",
      reason: "invalid-map-coordinate",
      message: "Command map coordinate must include finite x and y values.",
    };
  }

  const { x, y } = input;
  if (typeof x !== "number" || typeof y !== "number" || !Number.isFinite(x) || !Number.isFinite(y)) {
    return {
      status: "invalid",
      reason: "invalid-map-coordinate",
      message: "Command map coordinate must include finite x and y values.",
    };
  }

  return {
    status: "valid",
    point: {
      x,
      y,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}
