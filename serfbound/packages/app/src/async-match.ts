import {
  CorrespondenceMatch,
  decodeSessionMessage,
  encodeSessionMessage,
  sessionProtocolVersion,
  verifySessionHandshake,
  type CorrespondenceWindowMove,
  type SerfboundLocalGameStartOptions,
  type SerfboundWorldAction,
  type SessionGameSettings,
  type SessionHelloMessage,
  type WindowDigest,
} from "@serfbound/engine";
import { createRecapDriver, type RecapDriver } from "./recap.js";
import { loopbackChannelName, type LoopbackTextChannel } from "./multiplayer.js";

// Two-tab async correspondence (SB-23-04): each tab runs its own full
// CorrespondenceMatch; window moves cross a BroadcastChannel standing
// in for the Phase 24 mailbox. Tabs act at their own pace — that is the
// point: while you were away, your opponent moved; pick it up, watch
// the recap, play your window.

export type AsyncMatchMode =
  | "waiting-peer"
  | "your-window"
  | "awaiting-move"
  | "move-arrived"
  | "recap"
  | "rejected"
  | "failed";

export type AsyncMatchStatus = {
  readonly role: "host" | "join";
  readonly localPlayer: number;
  readonly mode: AsyncMatchMode;
  readonly window: number;
  readonly checksum: number;
  // The last verified window boundary's checksum — identical on both
  // sides by construction, stable while live ticks advance.
  readonly boundaryChecksum: number | null;
  readonly digest: WindowDigest | null;
  readonly failureReason: string | null;
};

export class SerfboundAsyncLoopbackMatch {
  readonly role: "host" | "join";
  readonly localPlayer: number;
  readonly appVersion: string;
  readonly windowTicks: number;
  #channel: LoopbackTextChannel;
  #settings: SessionGameSettings;
  #match: CorrespondenceMatch | undefined;
  #gameData: NonNullable<SerfboundLocalGameStartOptions["data"]>;
  #mode: AsyncMatchMode = "waiting-peer";
  #pendingMove: CorrespondenceWindowMove | null = null;
  #recap: RecapDriver | null = null;
  #failureReason: string | null = null;
  #onReady: (() => void) | undefined;

  constructor(options: {
    role: "host" | "join";
    settings: SessionGameSettings;
    data: NonNullable<SerfboundLocalGameStartOptions["data"]>;
    windowTicks: number;
    appVersion: string;
    channel?: LoopbackTextChannel;
    onReady?: () => void;
  }) {
    this.role = options.role;
    this.localPlayer = options.role === "host" ? 0 : 1;
    this.appVersion = options.appVersion;
    this.windowTicks = options.windowTicks;
    this.#settings = options.settings;
    this.#gameData = options.data;
    this.#onReady = options.onReady;
    this.#channel =
      options.channel ?? (new BroadcastChannel(loopbackChannelName) as LoopbackTextChannel);
    this.#channel.onmessage = (event) => {
      if (typeof event.data === "string") {
        this.#receive(event.data);
      }
    };
    this.#send(this.#hello());
  }

  get match(): CorrespondenceMatch | undefined {
    return this.#match;
  }

  get status(): AsyncMatchStatus {
    return {
      role: this.role,
      localPlayer: this.localPlayer,
      mode: this.#mode,
      window: this.#match?.currentWindow ?? 0,
      checksum: this.#match?.checksum() ?? 0,
      boundaryChecksum: this.#match?.moves.at(-1)?.endChecksum ?? null,
      digest: this.#match?.lastWindowDigest ?? null,
      failureReason: this.#failureReason,
    };
  }

  queue(action: SerfboundWorldAction): void {
    if (this.#mode === "your-window") {
      this.#match?.queue(action);
    }
  }

  // One shell-timer step: play your window (sending the move at its
  // boundary) or drive the recap of a received one.
  tick(deltaTicks: number): void {
    const match = this.#match;
    if (match === undefined) {
      return;
    }

    if (this.#mode === "your-window") {
      match.advance(deltaTicks);
      if (match.windowComplete) {
        const move = match.takeMove();
        this.#send(
          encodeSessionMessage({
            type: "window-move",
            player: move.player,
            window: move.window,
            endTick: move.endTick,
            endChecksum: move.endChecksum,
            actions: move.actions,
          }),
        );
        this.#mode = "awaiting-move";
      }

      return;
    }

    if (this.#mode === "recap") {
      const recap = this.#recap;
      if (recap === null) {
        return;
      }

      if (recap.advanceFrame()) {
        const verdict = recap.finish();
        this.#recap = null;
        if (!verdict.ok) {
          this.#mode = "failed";
          this.#failureReason = verdict.reason;
          return;
        }

        this.#mode = "your-window";
      }
    }
  }

  // The waiting player picks the arrived move up: recap, verify, then
  // their window.
  pickup(): void {
    if (this.#mode !== "move-arrived" || this.#pendingMove === null || this.#match === undefined) {
      return;
    }

    const start = createRecapDriver(this.#match, this.#pendingMove);
    this.#pendingMove = null;
    if (!start.ok) {
      this.#mode = "failed";
      this.#failureReason = start.reason;
      return;
    }

    this.#recap = start.driver;
    this.#mode = "recap";
  }

  leave(reason: string): void {
    this.#send(encodeSessionMessage({ type: "leave", player: this.localPlayer, reason }));
    this.#channel.close();
  }

  #hello(): string {
    const message: SessionHelloMessage = {
      type: "hello",
      protocolVersion: sessionProtocolVersion,
      appVersion: this.appVersion,
      player: this.localPlayer,
      settings: this.#settings,
      turnTicks: this.windowTicks,
      inputDelayTurns: 1,
    };
    return encodeSessionMessage(message);
  }

  #send(text: string): void {
    this.#channel.postMessage(text);
  }

  #startMatch(): void {
    this.#match = new CorrespondenceMatch({
      game: {
        data: this.#gameData,
        seedString: this.#settings.seedString,
        mapSize: this.#settings.mapSize,
        initialSupplies: this.#settings.initialSupplies,
        ...(this.#settings.playerSupplies === null
          ? {}
          : { playerSupplies: [...this.#settings.playerSupplies] }),
      },
      windowTicks: this.windowTicks,
      playerCount: this.#settings.playerCount,
    });
    // Window 0 belongs to player 0 (the host); the joiner waits.
    this.#mode = this.localPlayer === 0 ? "your-window" : "awaiting-move";
    this.#onReady?.();
  }

  #receive(text: string): void {
    let message;
    try {
      message = decodeSessionMessage(text);
    } catch {
      return;
    }

    switch (message.type) {
      case "hello": {
        if (message.player === this.localPlayer || this.#mode !== "waiting-peer") {
          if (this.role === "host" && message.player !== this.localPlayer) {
            // Re-announce for late joiners.
            this.#send(this.#hello());
          }

          return;
        }

        if (this.role === "join") {
          this.#settings = message.settings;
        }

        const verdict = verifySessionHandshake(
          JSON.parse(this.#hello()) as SessionHelloMessage,
          message,
        );
        if (!verdict.ok) {
          if (verdict.reason !== "settings-mismatch") {
            this.#mode = "rejected";
            this.#failureReason = verdict.reason;
          } else if (this.role === "host") {
            // Re-announce so the joiner can adopt and retry.
            this.#send(this.#hello());
          }

          return;
        }

        // Start BEFORE the confirming hello goes out: synchronous
        // transports (tests) re-enter this handler from #send, and a
        // peer still in 'waiting-peer' would ping-pong forever.
        this.#startMatch();
        this.#send(this.#hello());
        return;
      }
      case "window-move": {
        if (message.player === this.localPlayer || this.#match === undefined) {
          return;
        }

        this.#pendingMove = {
          window: message.window,
          player: message.player,
          endTick: message.endTick,
          endChecksum: message.endChecksum,
          actions: message.actions,
        };
        if (this.#mode === "awaiting-move") {
          this.#mode = "move-arrived";
        }

        return;
      }
      case "leave":
        if (message.player !== this.localPlayer) {
          this.#mode = "failed";
          this.#failureReason = "peer-left";
        }

        return;
      default:
        return;
    }
  }
}
