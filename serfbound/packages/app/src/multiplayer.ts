import {
  LockstepSession,
  bundleFromTurnMessage,
  computeGameChecksum,
  decodeSessionMessage,
  encodeSessionMessage,
  firstChecksumDivergence,
  sessionProtocolVersion,
  turnMessageFromBundle,
  verifySessionHandshake,
  type ChecksumRecord,
  type SerfboundGameState,
  type SerfboundGameWorld,
  type SerfboundSerfEngine,
  type SerfboundWorldAction,
  type SessionGameSettings,
  type SessionHelloMessage,
} from "@serfbound/engine";

// Two-tab loopback multiplayer (SB-22-04): the Phase 22 gate. A
// BroadcastChannel carries the session protocol between two browsing
// contexts on this origin — multiplayer with zero servers. The same
// orchestration runs over any text transport (WebRTC lands in Phase
// 23 behind the same seam).

export type LoopbackTextChannel = {
  postMessage(text: string): void;
  close(): void;
  onmessage: ((event: { data: unknown }) => void) | null;
};

export const loopbackChannelName = "serfbound-loopback-session";

export type MultiplayerRole = "host" | "join";

export type MultiplayerStatus = {
  readonly role: MultiplayerRole;
  readonly localPlayer: number;
  readonly phase: "waiting" | "running" | "rejected" | "ended";
  readonly rejectReason: string | null;
  readonly localTurn: number;
  readonly executedTurn: number;
  readonly stalled: boolean;
  readonly lastChecksumTick: number | null;
  readonly checksumAgreed: boolean | null;
  readonly desyncTick: number | null;
};

export type MultiplayerPumpHooks = {
  readonly state: SerfboundGameState;
  readonly world: SerfboundGameWorld;
  readonly engine: SerfboundSerfEngine;
  readonly deltaTicks: number;
};

// 512 ticks ≈ 11 seconds at the shell's 1x tick rate: frequent enough
// for the e2e gate to observe agreement, cheap per SB-22-01's guard.
const checksumCadenceTicks = 512;

export class SerfboundLoopbackMultiplayer {
  readonly role: MultiplayerRole;
  readonly localPlayer: number;
  readonly appVersion: string;
  #channel: LoopbackTextChannel;
  #settings: SessionGameSettings;
  #session: LockstepSession | undefined;
  #phase: MultiplayerStatus["phase"] = "waiting";
  #rejectReason: string | null = null;
  #stalled = false;
  #pendingActions: SerfboundWorldAction[] = [];
  #localChecksums: ChecksumRecord[] = [];
  #remoteChecksums: ChecksumRecord[] = [];
  #lastChecksumTick: number | null = null;
  #desyncTick: number | null = null;
  #onReady: ((settings: SessionGameSettings, localPlayer: number) => void) | undefined;

  constructor(options: {
    role: MultiplayerRole;
    settings: SessionGameSettings;
    appVersion: string;
    channel?: LoopbackTextChannel;
    onReady?: (settings: SessionGameSettings, localPlayer: number) => void;
  }) {
    this.role = options.role;
    this.localPlayer = options.role === "host" ? 0 : 1;
    this.appVersion = options.appVersion;
    this.#settings = options.settings;
    this.#onReady = options.onReady;
    this.#channel =
      options.channel ?? (new BroadcastChannel(loopbackChannelName) as LoopbackTextChannel);
    this.#channel.onmessage = (event) => {
      if (typeof event.data === "string") {
        this.#receive(event.data);
      }
    };
    // Announce. The host re-announces whenever a join hello arrives, so
    // ordering between the two button presses does not matter.
    this.#send(this.#hello());
  }

  get status(): MultiplayerStatus {
    return {
      role: this.role,
      localPlayer: this.localPlayer,
      phase: this.#phase,
      rejectReason: this.#rejectReason,
      localTurn: this.#session?.localTurn ?? 0,
      executedTurn: this.#session?.executedTurn ?? -1,
      stalled: this.#stalled,
      lastChecksumTick: this.#lastChecksumTick,
      checksumAgreed:
        this.#lastChecksumTick === null ? null : this.#desyncTick === null,
      desyncTick: this.#desyncTick,
    };
  }

  get settings(): SessionGameSettings {
    return this.#settings;
  }

  // The command router's lockstep hook: local world actions queue here
  // and execute at their scheduled turn on every peer.
  submitAction(action: SerfboundWorldAction): void {
    this.#pendingActions.push(action);
  }

  // One step of the lockstep loop, called from the shell's game timer.
  // Closes local input turns, executes ready turns (recording their
  // actions for saves), advances the simulation tick by tick — holding
  // at turn boundaries whose inputs are missing — and exchanges
  // checksums.
  pump(hooks: MultiplayerPumpHooks): void {
    const session = this.#session;
    if (session === undefined || this.#phase !== "running") {
      return;
    }

    // Close local input turns slightly ahead of the simulation so the
    // bundle for turn N+delay is on the wire before turn N ends.
    const simTurn = Math.floor(hooks.state.monotonicTick / session.turnTicks);
    while (session.localTurn <= simTurn + 1) {
      for (const action of this.#pendingActions) {
        session.submit(action);
      }

      this.#pendingActions = [];
      this.#send(encodeSessionMessage(turnMessageFromBundle(session.completeTurn())));
    }

    this.#stalled = false;
    for (let step = 0; step < hooks.deltaTicks; step += 1) {
      const turnOfNextTick = Math.floor(hooks.state.monotonicTick / session.turnTicks);
      if (session.executedTurn < turnOfNextTick) {
        if (session.readyThroughTurn() < turnOfNextTick) {
          this.#stalled = true;
          break;
        }

        while (session.executedTurn < turnOfNextTick) {
          for (const executed of session.executeNextTurn(hooks.world)) {
            if (executed.outcome.ok) {
              hooks.state.recordWorldAction(executed.action);
            }
          }
        }
      }

      hooks.state.advanceTick();
      const tick = hooks.state.monotonicTick;
      if (tick % 16 === 0) {
        hooks.engine.update(tick);
      }

      if (tick % checksumCadenceTicks === 0) {
        const checksum = computeGameChecksum({
          world: hooks.world,
          serfEngine: hooks.engine,
        });
        this.#localChecksums.push({ tick, checksum });
        this.#lastChecksumTick = tick;
        this.#send(
          encodeSessionMessage({ type: "checksum", player: this.localPlayer, tick, checksum }),
        );
        this.#compareChecksums();
      }
    }
  }

  leave(reason: string): void {
    this.#send(encodeSessionMessage({ type: "leave", player: this.localPlayer, reason }));
    this.#phase = "ended";
    this.#channel.close();
  }

  #hello(): string {
    const message: SessionHelloMessage = {
      type: "hello",
      protocolVersion: sessionProtocolVersion,
      appVersion: this.appVersion,
      player: this.localPlayer,
      settings: this.#settings,
      turnTicks: 64,
      inputDelayTurns: 2,
    };
    return encodeSessionMessage(message);
  }

  #send(text: string): void {
    this.#channel.postMessage(text);
  }

  #receive(text: string): void {
    let message;
    try {
      message = decodeSessionMessage(text);
    } catch {
      // Malformed frames are dropped recoverably; the loop survives.
      return;
    }

    switch (message.type) {
      case "hello": {
        if (message.player === this.localPlayer) {
          return;
        }

        if (this.role === "join" && this.#phase === "waiting") {
          // Adopt the host's deterministic game definition, then
          // announce the matching hello the host verifies.
          this.#settings = message.settings;
        }

        const verdict = verifySessionHandshake(
          JSON.parse(this.#hello()) as SessionHelloMessage,
          message,
        );
        if (this.role === "join" && this.#phase === "waiting") {
          this.#send(this.#hello());
        }

        if (!verdict.ok) {
          if (this.role === "host") {
            // Re-announce so a late joiner can adopt and retry.
            this.#send(this.#hello());
          }

          if (verdict.reason !== "settings-mismatch") {
            this.#phase = "rejected";
            this.#rejectReason = verdict.reason;
          }

          return;
        }

        if (this.#phase === "waiting") {
          this.#session = new LockstepSession({
            localPlayer: this.localPlayer,
            players: [0, 1],
            turnTicks: 64,
            inputDelayTurns: 2,
          });
          this.#phase = "running";
          if (this.role === "host") {
            this.#send(this.#hello());
          }

          this.#onReady?.(this.#settings, this.localPlayer);
        }

        return;
      }
      case "turn":
        this.#session?.receive(bundleFromTurnMessage(message));
        return;
      case "checksum":
        if (message.player !== this.localPlayer) {
          this.#remoteChecksums.push({ tick: message.tick, checksum: message.checksum });
          this.#compareChecksums();
        }

        return;
      case "leave":
        if (message.player !== this.localPlayer) {
          this.#phase = "ended";
        }

        return;
    }
  }

  #compareChecksums(): void {
    if (this.#desyncTick === null) {
      this.#desyncTick = firstChecksumDivergence(this.#localChecksums, this.#remoteChecksums);
    }
  }
}
