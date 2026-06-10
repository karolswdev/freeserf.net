import { isSerfboundWorldAction } from "./world-commands.js";
import type { SerfboundWorldAction } from "./world-commands.js";
import type { LockstepTurnBundle } from "./lockstep.js";

// The session wire protocol (SB-22-03): the serialized form of a
// lockstep session — handshake (protocol/app version + the settings
// that must match for determinism), turn bundles, checksum exchange,
// and clean leave — independent of the transport that carries it
// (loopback now, WebRTC in Phase 23). The wire carries world actions
// and fingerprints only: original game data never crosses it (each
// player imports their own assets).

export const sessionProtocolVersion = 1;

export type SessionGameSettings = {
  readonly seedString: string;
  readonly mapSize: number;
  readonly playerCount: number;
  readonly initialSupplies: number;
  readonly playerSupplies: readonly number[] | null;
};

export type SessionHelloMessage = {
  readonly type: "hello";
  readonly protocolVersion: number;
  readonly appVersion: string;
  readonly player: number;
  readonly settings: SessionGameSettings;
  readonly turnTicks: number;
  readonly inputDelayTurns: number;
};

export type SessionTurnMessage = {
  readonly type: "turn";
  readonly player: number;
  readonly turn: number;
  readonly actions: readonly SerfboundWorldAction[];
};

export type SessionChecksumMessage = {
  readonly type: "checksum";
  readonly player: number;
  readonly tick: number;
  readonly checksum: number;
};

export type SessionLeaveMessage = {
  readonly type: "leave";
  readonly player: number;
  readonly reason: string;
};

// Correspondence play (SB-23-01): one session window's move — the
// active player's tick-stamped action segment plus the end checksum.
export type SessionWindowMoveMessage = {
  readonly type: "window-move";
  readonly player: number;
  readonly window: number;
  readonly endTick: number;
  readonly endChecksum: number;
  readonly actions: readonly {
    readonly tick: number;
    readonly action: SerfboundWorldAction;
  }[];
};

export type SessionMessage =
  | SessionHelloMessage
  | SessionTurnMessage
  | SessionChecksumMessage
  | SessionLeaveMessage
  | SessionWindowMoveMessage;

// Decode failures carry a stable reason for recoverable handling; a
// malformed message must never take the engine loop down.
export class SessionProtocolError extends Error {
  readonly reason: string;

  constructor(reason: string, message: string) {
    super(message);
    this.name = "SessionProtocolError";
    this.reason = reason;
  }
}

export function encodeSessionMessage(message: SessionMessage): string {
  return JSON.stringify(message);
}

export function decodeSessionMessage(text: string): SessionMessage {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new SessionProtocolError("malformed-json", "Session message is not valid JSON.");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new SessionProtocolError("malformed-shape", "Session message must be an object.");
  }

  const message = parsed as Record<string, unknown>;
  switch (message["type"]) {
    case "hello":
      return decodeHello(message);
    case "turn":
      return decodeTurn(message);
    case "window-move":
      return decodeWindowMove(message);
    case "checksum": {
      const player = requireInt(message, "player");
      const tick = requireInt(message, "tick");
      const checksum = requireInt(message, "checksum");
      return { type: "checksum", player, tick, checksum };
    }
    case "leave": {
      const player = requireInt(message, "player");
      const reason = message["reason"];
      if (typeof reason !== "string") {
        throw new SessionProtocolError("malformed-field", "leave.reason must be a string.");
      }

      return { type: "leave", player, reason };
    }
    default:
      throw new SessionProtocolError(
        "unknown-type",
        `Unknown session message type '${String(message["type"])}'.`,
      );
  }
}

// The handshake verdict: peers must run the same protocol and the same
// deterministic game definition before a single tick executes.
export type SessionHandshakeVerdict =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: string; readonly message: string };

export function verifySessionHandshake(
  local: SessionHelloMessage,
  remote: SessionHelloMessage,
): SessionHandshakeVerdict {
  if (remote.protocolVersion !== local.protocolVersion) {
    return {
      ok: false,
      reason: "protocol-version-mismatch",
      message: `Peer runs session protocol v${remote.protocolVersion}, this build v${local.protocolVersion}.`,
    };
  }

  if (remote.appVersion !== local.appVersion) {
    return {
      ok: false,
      reason: "app-version-mismatch",
      message: `Peer runs Serfbound ${remote.appVersion}, this build ${local.appVersion} — identical builds are required for determinism.`,
    };
  }

  if (remote.player === local.player) {
    return {
      ok: false,
      reason: "player-collision",
      message: `Both peers claim player ${local.player}.`,
    };
  }

  if (remote.turnTicks !== local.turnTicks || remote.inputDelayTurns !== local.inputDelayTurns) {
    return {
      ok: false,
      reason: "lockstep-config-mismatch",
      message: "Peers disagree on turn length or input delay.",
    };
  }

  const settingsEqual =
    remote.settings.seedString === local.settings.seedString &&
    remote.settings.mapSize === local.settings.mapSize &&
    remote.settings.playerCount === local.settings.playerCount &&
    remote.settings.initialSupplies === local.settings.initialSupplies &&
    JSON.stringify(remote.settings.playerSupplies) ===
      JSON.stringify(local.settings.playerSupplies);
  if (!settingsEqual) {
    return {
      ok: false,
      reason: "settings-mismatch",
      message: "Peers disagree on the game settings (seed, map size, players, or supplies).",
    };
  }

  return { ok: true };
}

// Bridge helpers between the lockstep session and the wire.
export function turnMessageFromBundle(bundle: LockstepTurnBundle): SessionTurnMessage {
  return { type: "turn", player: bundle.player, turn: bundle.turn, actions: bundle.actions };
}

export function bundleFromTurnMessage(message: SessionTurnMessage): LockstepTurnBundle {
  return { player: message.player, turn: message.turn, actions: message.actions };
}

function requireInt(message: Record<string, unknown>, field: string): number {
  const value = message[field];
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value)) {
    throw new SessionProtocolError("malformed-field", `${field} must be an integer.`);
  }

  return value;
}

function decodeHello(message: Record<string, unknown>): SessionHelloMessage {
  const protocolVersion = requireInt(message, "protocolVersion");
  const player = requireInt(message, "player");
  const turnTicks = requireInt(message, "turnTicks");
  const inputDelayTurns = requireInt(message, "inputDelayTurns");
  const appVersion = message["appVersion"];
  if (typeof appVersion !== "string") {
    throw new SessionProtocolError("malformed-field", "hello.appVersion must be a string.");
  }

  const settings = message["settings"];
  if (typeof settings !== "object" || settings === null) {
    throw new SessionProtocolError("malformed-field", "hello.settings must be an object.");
  }

  const record = settings as Record<string, unknown>;
  const seedString = record["seedString"];
  if (typeof seedString !== "string" || !/^[1-8]{16}$/.test(seedString)) {
    throw new SessionProtocolError(
      "malformed-field",
      "hello.settings.seedString must be 16 digits from 1 to 8.",
    );
  }

  const mapSize = requireInt(record, "mapSize");
  const playerCount = requireInt(record, "playerCount");
  const initialSupplies = requireInt(record, "initialSupplies");
  const playerSupplies = record["playerSupplies"];
  if (
    playerSupplies !== null &&
    (!Array.isArray(playerSupplies) ||
      playerSupplies.some((value) => typeof value !== "number" || !Number.isInteger(value)))
  ) {
    throw new SessionProtocolError(
      "malformed-field",
      "hello.settings.playerSupplies must be null or an integer array.",
    );
  }

  return {
    type: "hello",
    protocolVersion,
    appVersion,
    player,
    settings: {
      seedString,
      mapSize,
      playerCount,
      initialSupplies,
      playerSupplies: playerSupplies as readonly number[] | null,
    },
    turnTicks,
    inputDelayTurns,
  };
}

function decodeWindowMove(message: Record<string, unknown>): SessionWindowMoveMessage {
  const player = requireInt(message, "player");
  const window = requireInt(message, "window");
  const endTick = requireInt(message, "endTick");
  const endChecksum = requireInt(message, "endChecksum");
  const actions = message["actions"];
  if (!Array.isArray(actions)) {
    throw new SessionProtocolError("malformed-field", "window-move.actions must be an array.");
  }

  for (const stamped of actions) {
    if (
      typeof stamped !== "object" ||
      stamped === null ||
      !Number.isInteger((stamped as Record<string, unknown>)["tick"]) ||
      !isSerfboundWorldAction((stamped as Record<string, unknown>)["action"])
    ) {
      throw new SessionProtocolError(
        "malformed-action",
        "window-move.actions carries a malformed stamped action.",
      );
    }
  }

  return {
    type: "window-move",
    player,
    window,
    endTick,
    endChecksum,
    actions: actions as SessionWindowMoveMessage["actions"],
  };
}

function decodeTurn(message: Record<string, unknown>): SessionTurnMessage {
  const player = requireInt(message, "player");
  const turn = requireInt(message, "turn");
  const actions = message["actions"];
  if (!Array.isArray(actions)) {
    throw new SessionProtocolError("malformed-field", "turn.actions must be an array.");
  }

  for (const action of actions) {
    if (!isSerfboundWorldAction(action)) {
      throw new SessionProtocolError(
        "malformed-action",
        "turn.actions carries an unrecognized world action.",
      );
    }
  }

  return { type: "turn", player, turn, actions: actions as SerfboundWorldAction[] };
}
