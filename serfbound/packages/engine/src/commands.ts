import type { MapPoint, MapTile } from "./index.js";
import type { SerfboundGameWorld } from "./game-world.js";
import { findShortestRoad } from "./pathfinder.js";
import { SerfboundGameState, type SerfboundBuiltStructure } from "./simulation.js";
import {
  applyWorldAction,
  buildingTypeFromKind,
  type SerfboundWorldAction,
} from "./world-commands.js";

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

export type SerfboundWorldCommandType =
  | "game.build-castle"
  | "game.build-flag"
  | "game.build-road"
  | "game.build-building"
  | "game.demolish-flag";

export type SerfboundWorldCommand = {
  readonly type: SerfboundWorldCommandType;
  readonly tile: MapTile;
  // Road target flag (game.build-road paths from tile to toTile).
  readonly toTile?: MapTile;
  // Building kind name for game.build-building (e.g. "lumberjack").
  readonly buildingKind?: string;
  readonly source?: SerfboundCommandSource;
};

export type SerfboundCommand =
  | SerfboundDebugInspectTileCommand
  | SerfboundBuildCommand
  | SerfboundWorldCommand;

export type SerfboundCommandRejectReason =
  | "unsupported-command"
  | "invalid-command"
  | "invalid-command-source"
  | "invalid-tile"
  | "invalid-map-coordinate"
  | "invalid-build-target"
  | "tile-occupied"
  | "build-command-deferred"
  | "world-required"
  | "invalid-build-position"
  | "no-road-found";

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
  readonly builtStructures: readonly SerfboundBuiltStructure[];
  readonly world?: {
    readonly hasCastle: boolean;
    readonly castlePosition: number | null;
    readonly flagCount: number;
    readonly buildingCount: number;
  };
};

export type SerfboundAcceptedCommandResult = {
  readonly status: "accepted";
  readonly commandId: number;
  readonly command: SerfboundCommand;
  readonly effect:
    | "debug-inspection-recorded"
    | "flag-built"
    | "castle-built"
    | "world-flag-built"
    | "road-built"
    | "building-built"
    | "flag-demolished"
    // Lockstep mode (SB-22-04): the action is queued for its scheduled
    // turn instead of applying immediately.
    | "queued-for-lockstep";
  readonly builtStructure?: SerfboundBuiltStructure;
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

const worldCommandTypes = new Set<SerfboundWorldCommandType>([
  "game.build-castle",
  "game.build-flag",
  "game.build-road",
  "game.build-building",
  "game.demolish-flag",
]);

export class SerfboundCommandRouter {
  readonly state: SerfboundGameState;
  readonly world: SerfboundGameWorld | undefined;

  #nextCommandId = 1;
  #log: SerfboundCommandLogEntry[] = [];
  #lastInspectedTile: MapTile | undefined;

  // Lockstep mode (SB-22-04): world-mutating actions stamp this player
  // and, when the hook is set, queue into the session instead of
  // applying immediately — both peers apply them at the scheduled turn.
  localPlayer = 0;
  onWorldAction: ((action: SerfboundWorldAction) => void) | undefined;

  constructor(state: SerfboundGameState = new SerfboundGameState(), world?: SerfboundGameWorld) {
    this.state = state;
    this.world = world;
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

    if (worldCommandTypes.has(parsed.command.type as SerfboundWorldCommandType)) {
      return this.dispatchWorldCommand(commandId, parsed.command as SerfboundWorldCommand);
    }

    if (parsed.command.type === "game.build" && parsed.command.building !== "flag") {
      const result: SerfboundRejectedCommandResult = {
        status: "rejected",
        commandId,
        reason: "build-command-deferred",
        message: "Only flag building is implemented in this playable slice.",
        commandType: parsed.command.type,
        command: parsed.command,
        snapshot: this.snapshot(this.#log.length + 1),
      };
      this.#log.push(logEntryFromResult(result));
      return result;
    }

    if (parsed.command.type === "game.build") {
      let builtStructure: SerfboundBuiltStructure;
      try {
        builtStructure = this.state.buildFlag(parsed.command.tile);
      } catch {
        const result: SerfboundRejectedCommandResult = {
          status: "rejected",
          commandId,
          reason: "tile-occupied",
          message: "This tile already has a structure.",
          commandType: parsed.command.type,
          command: parsed.command,
          snapshot: this.snapshot(this.#log.length + 1),
        };
        this.#log.push(logEntryFromResult(result));
        return result;
      }

      const result: SerfboundAcceptedCommandResult = {
        status: "accepted",
        commandId,
        command: parsed.command,
        effect: "flag-built",
        builtStructure,
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

  private dispatchWorldCommand(
    commandId: number,
    command: SerfboundWorldCommand,
  ): SerfboundCommandResult {
    const reject = (
      reason: SerfboundCommandRejectReason,
      message: string,
    ): SerfboundRejectedCommandResult => {
      const result: SerfboundRejectedCommandResult = {
        status: "rejected",
        commandId,
        reason,
        message,
        commandType: command.type,
        command,
        snapshot: this.snapshot(this.#log.length + 1),
      };
      this.#log.push(logEntryFromResult(result));
      return result;
    };

    const world = this.world;
    if (world === undefined) {
      return reject("world-required", "This command needs a running game world.");
    }

    let action: SerfboundWorldAction;
    switch (command.type) {
      case "game.build-castle":
        action = {
          kind: "build-castle",
          position: command.tile.position,
          player: this.localPlayer,
        };
        break;
      case "game.build-flag":
        action = { kind: "build-flag", position: command.tile.position, player: this.localPlayer };
        break;
      case "game.build-road": {
        if (command.toTile === undefined) {
          return reject("invalid-command", "Road commands need a target tile.");
        }

        const road = findShortestRoad(world, command.tile.position, command.toTile.position);
        if (road === null) {
          return reject("no-road-found", "No valid road connects these positions.");
        }

        action = {
          kind: "build-road",
          start: road.start,
          directions: road.directions,
          player: this.localPlayer,
        };
        break;
      }
      case "game.build-building": {
        const building = buildingTypeFromKind(command.buildingKind ?? "");
        if (building === null) {
          return reject("invalid-build-target", "Unknown building kind.");
        }

        action = {
          kind: "build-building",
          position: command.tile.position,
          building,
          player: this.localPlayer,
          atTick: this.state.tick,
        };
        break;
      }
      case "game.demolish-flag":
        action = {
          kind: "demolish-flag",
          position: command.tile.position,
          player: this.localPlayer,
        };
        break;
    }

    // Lockstep mode: queue for the scheduled turn instead of applying;
    // the session applies it on every peer identically.
    if (this.onWorldAction !== undefined) {
      this.onWorldAction(action);
      const result: SerfboundAcceptedCommandResult = {
        status: "accepted",
        commandId,
        command,
        effect: "queued-for-lockstep",
        snapshot: this.snapshot(this.#log.length + 1),
      };
      this.#log.push(logEntryFromResult(result));
      return result;
    }

    const outcome = applyWorldAction(world, action);
    if (!outcome.ok) {
      return reject(outcome.reason as SerfboundCommandRejectReason, outcome.message);
    }

    this.state.recordWorldAction(action);
    const result: SerfboundAcceptedCommandResult = {
      status: "accepted",
      commandId,
      command,
      effect: outcome.effect as SerfboundAcceptedCommandResult["effect"],
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
      case "game.build-castle":
      case "game.build-flag":
      case "game.build-road":
      case "game.build-building":
      case "game.demolish-flag":
        return this.parseWorldCommand(input);
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

  private parseWorldCommand(input: Record<string, unknown>): CommandParseResult {
    const tile = this.parseTile(input.tile);
    if (tile.status === "invalid") {
      return tile;
    }

    const source = parseOptionalSource(input.source);
    if (source.status === "invalid") {
      return source;
    }

    let toTile: MapTile | undefined;
    if (input.toTile !== undefined) {
      const parsedTo = this.parseTile(input.toTile);
      if (parsedTo.status === "invalid") {
        return parsedTo;
      }

      toTile = parsedTo.tile;
    }

    return {
      status: "valid",
      command: {
        type: input.type as SerfboundWorldCommandType,
        tile: tile.tile,
        ...(toTile === undefined ? {} : { toTile }),
        ...(typeof input.buildingKind === "string" ? { buildingKind: input.buildingKind } : {}),
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
      builtStructures: game.builtStructures,
      ...(this.world === undefined
        ? {}
        : {
            world: {
              hasCastle: this.world.players[0]?.hasCastle ?? false,
              castlePosition: this.world.players[0]?.castlePosition ?? null,
              flagCount: this.world.flags.size,
              buildingCount: this.world.buildings.size,
            },
          }),
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
