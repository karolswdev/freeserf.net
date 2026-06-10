import type { Direction } from "./index.js";
import { buildingType, type BuildingTypeValue, type SerfboundGameWorld } from "./game-world.js";

// Serializable world actions: the accepted-command log a saved game replays
// over a freshly generated world to restore identical state.

export type SerfboundWorldAction =
  | { readonly kind: "build-castle"; readonly position: number; readonly player: number }
  | { readonly kind: "build-flag"; readonly position: number; readonly player: number }
  | {
      readonly kind: "build-road";
      readonly start: number;
      readonly directions: readonly Direction[];
      readonly player: number;
    }
  | {
      readonly kind: "build-building";
      readonly position: number;
      readonly building: BuildingTypeValue;
      readonly player: number;
      readonly atTick: number;
    }
  | { readonly kind: "demolish-flag"; readonly position: number; readonly player: number };

export type SerfboundWorldActionOutcome =
  | { readonly ok: true; readonly effect: string }
  | { readonly ok: false; readonly reason: string; readonly message: string };

export function applyWorldAction(
  world: SerfboundGameWorld,
  action: SerfboundWorldAction,
): SerfboundWorldActionOutcome {
  switch (action.kind) {
    case "build-castle":
      if (world.buildCastle(action.position, action.player) === null) {
        return {
          ok: false,
          reason: "invalid-build-position",
          message: "The castle needs open, unowned, buildable land.",
        };
      }

      return { ok: true, effect: "castle-built" };
    case "build-flag":
      if (world.buildFlag(action.position, action.player) === null) {
        return {
          ok: false,
          reason: "invalid-build-position",
          message: "A flag needs open land inside your territory, away from other flags.",
        };
      }

      return { ok: true, effect: "world-flag-built" };
    case "build-road":
      if (!world.buildRoad({ start: action.start, directions: action.directions }, action.player)) {
        return {
          ok: false,
          reason: "invalid-build-position",
          message: "The road must connect two flags over valid territory.",
        };
      }

      return { ok: true, effect: "road-built" };
    case "build-building":
      if (
        world.buildBuilding(action.position, action.building, action.player, action.atTick) === null
      ) {
        return {
          ok: false,
          reason: "invalid-build-position",
          message: "The building site is not valid for this building type.",
        };
      }

      return { ok: true, effect: "building-built" };
    case "demolish-flag":
      if (!world.demolishFlag(action.position, action.player)) {
        return {
          ok: false,
          reason: "invalid-build-position",
          message: "This flag cannot be demolished.",
        };
      }

      return { ok: true, effect: "flag-demolished" };
  }
}

export function replayWorldActions(
  world: SerfboundGameWorld,
  actions: readonly SerfboundWorldAction[],
): number {
  let applied = 0;
  for (const action of actions) {
    const outcome = applyWorldAction(world, action);
    if (!outcome.ok) {
      // Deterministic replays should never fail; stopping here surfaces a
      // corrupted action log instead of silently diverging.
      break;
    }

    applied += 1;
  }

  return applied;
}

const buildingKindNames = Object.fromEntries(
  Object.entries(buildingType).map(([name, value]) => [name, value]),
) as Record<string, BuildingTypeValue>;

export function buildingTypeFromKind(kind: string): BuildingTypeValue | null {
  const value = buildingKindNames[kind];
  return value === undefined || value === buildingType.none || value === buildingType.castle
    ? null
    : value;
}

export function isSerfboundWorldAction(input: unknown): input is SerfboundWorldAction {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  const action = input as Partial<SerfboundWorldAction> & { kind?: unknown };
  switch (action.kind) {
    case "build-castle":
    case "build-flag":
    case "demolish-flag":
      return Number.isInteger((action as { position?: unknown }).position);
    case "build-road": {
      const road = action as { start?: unknown; directions?: unknown };
      return Number.isInteger(road.start) && Array.isArray(road.directions);
    }
    case "build-building": {
      const build = action as { position?: unknown; building?: unknown };
      return Number.isInteger(build.position) && typeof build.building === "number";
    }
    default:
      return false;
  }
}
