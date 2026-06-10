import { computeGameChecksum } from "./checksum.js";
import {
  startSerfboundLocalGame,
  type SerfboundLocalGame,
  type SerfboundLocalGameStartOptions,
} from "./local-game.js";
import { applyWorldAction, isSerfboundWorldAction } from "./world-commands.js";
import type { SerfboundWorldAction } from "./world-commands.js";

// Correspondence play (SB-23-01): async multiplayer is lockstep with
// giant turns. A match is (settings, seed, the accepted move history);
// a move is the active player's tick-stamped action segment for one
// session window plus the end-of-window checksum. The receiving client
// re-simulates the window from shared deterministic state — the rules
// and the checksum are the referee; no client is ever believed.
//
// Canonical tick order (identical live and on replay, by construction):
// advance to tick t, apply the actions stamped t in submission order,
// then run the serf engine at 16-tick boundaries. Live commands
// therefore queue for the next tick instead of applying mid-tick.

export const defaultWindowTicks = 4096;

export type StampedAction = {
  readonly tick: number;
  readonly action: SerfboundWorldAction;
};

export type CorrespondenceWindowMove = {
  readonly window: number;
  readonly player: number;
  readonly endTick: number;
  readonly endChecksum: number;
  readonly actions: readonly StampedAction[];
};

export type CorrespondenceMoveVerdict =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: string; readonly message: string };

// What a window changed, per player (SB-23-02): the "while you waited,
// your opponent did X" record. Computed deterministically from state
// before/after the window — both peers derive identical digests.
export type PlayerWindowDigest = {
  readonly player: number;
  readonly buildingsCompleted: number;
  readonly buildingsStarted: number;
  readonly flagsBuilt: number;
  readonly landAreaDelta: number;
  readonly stockDelta: number;
  readonly serfsDelta: number;
};

export type WindowDigest = {
  readonly window: number;
  readonly activePlayer: number;
  readonly players: readonly PlayerWindowDigest[];
};

type PlayerStats = {
  buildingsDone: number;
  buildingsTotal: number;
  flags: number;
  landArea: number;
  stockTotal: number;
  serfs: number;
};

// A move replay the shell can drive frame by frame (the high-speed
// recap): advance in chunks, render between chunks, finish() verifies
// the checksum and commits — or rejects and restores like applyMove.
export type CorrespondenceMoveReplay = {
  readonly move: CorrespondenceWindowMove;
  advance(ticks: number): void;
  readonly done: boolean;
  readonly tick: number;
  finish(): CorrespondenceMoveVerdict;
};

export type CorrespondenceMatchOptions = {
  readonly game: SerfboundLocalGameStartOptions;
  readonly windowTicks?: number;
  readonly playerCount?: number;
};

export type CorrespondenceReplayStart =
  | { readonly ok: true; readonly replay: CorrespondenceMoveReplay }
  | { readonly ok: false; readonly reason: string; readonly message: string };

export class CorrespondenceMatch {
  readonly windowTicks: number;
  readonly playerCount: number;
  #gameOptions: SerfboundLocalGameStartOptions;
  #game: SerfboundLocalGame;
  #pendingActions: SerfboundWorldAction[] = [];
  #capturedActions: StampedAction[] = [];
  #acceptedMoves: CorrespondenceWindowMove[] = [];
  #windowStartStats: PlayerStats[] = [];
  #lastDigest: WindowDigest | null = null;
  #replayActive = false;

  constructor(options: CorrespondenceMatchOptions) {
    this.windowTicks = Math.max(64, Math.trunc(options.windowTicks ?? defaultWindowTicks));
    this.playerCount = Math.max(2, Math.trunc(options.playerCount ?? 2));
    this.#gameOptions = {
      ...options.game,
      playerCount: this.playerCount,
    };
    this.#game = this.#freshGame();
    this.#windowStartStats = this.#captureStats();
  }

  // The current window index; the simulation always rests at a window
  // boundary between moves. All window math uses the monotonic tick —
  // the uint16 game tick wraps every 65536 ticks, far inside a
  // day-scale match.
  get currentWindow(): number {
    return Math.floor(this.#game.state.monotonicTick / this.windowTicks);
  }

  // Windows alternate players (chess-like): window N belongs to player
  // N mod playerCount.
  get activePlayer(): number {
    return this.currentWindow % this.playerCount;
  }

  get tick(): number {
    return this.#game.state.monotonicTick;
  }

  get world(): ReturnType<SerfboundLocalGame["world"]> {
    return this.#game.world();
  }

  get state(): SerfboundLocalGame["state"] {
    return this.#game.state;
  }

  get serfEngine(): ReturnType<SerfboundLocalGame["serfEngine"]> {
    return this.#game.serfEngine();
  }

  get moves(): readonly CorrespondenceWindowMove[] {
    return this.#acceptedMoves;
  }

  // True when a fully played window awaits takeMove(): the simulation
  // reached the boundary one window past the accepted history.
  get windowComplete(): boolean {
    return this.#game.state.monotonicTick === (this.#acceptedMoves.length + 1) * this.windowTicks;
  }

  checksum(): number {
    return computeGameChecksum({
      world: this.#game.world(),
      serfEngine: this.#game.serfEngine(),
    });
  }

  // The digest of the most recently completed window (computed at the
  // boundary on both sides, deterministically identical).
  get lastWindowDigest(): WindowDigest | null {
    return this.#lastDigest;
  }

  // Queue a local command during the active window; it applies at the
  // next tick (the canonical order live and on replay).
  queue(action: SerfboundWorldAction): void {
    this.#assertNoReplay();
    this.#pendingActions.push(action);
  }

  // Live play: advance the active window up to deltaTicks, applying
  // queued actions at tick boundaries and capturing the accepted ones.
  // Stops exactly at the window end.
  advance(deltaTicks: number): void {
    this.#assertNoReplay();
    const windowEnd = (this.currentWindow + 1) * this.windowTicks;
    const target = Math.min(
      windowEnd,
      this.#game.state.monotonicTick + Math.max(0, Math.trunc(deltaTicks)),
    );
    while (this.#game.state.monotonicTick < target) {
      this.#game.state.advanceTick();
      const tick = this.#game.state.monotonicTick;
      if (this.#pendingActions.length > 0) {
        const world = this.#game.world();
        for (const action of this.#pendingActions) {
          const outcome = applyWorldAction(world, action);
          if (outcome.ok) {
            this.#game.state.recordWorldAction(action);
            this.#capturedActions.push({ tick, action });
          }
        }

        this.#pendingActions = [];
      }

      if (tick % 16 === 0) {
        this.#game.serfEngine().update(tick);
      }
    }
  }

  // At the window end the captured segment becomes the move; the match
  // records it and the next window begins (the opponent's).
  takeMove(): CorrespondenceWindowMove {
    this.#assertNoReplay();
    const window = this.currentWindow - 1;
    if (!this.windowComplete || window !== this.#acceptedMoves.length) {
      throw new Error("Correspondence match: no fully played window awaits its move.");
    }

    const move: CorrespondenceWindowMove = {
      window,
      player: window % this.playerCount,
      endTick: this.#game.state.monotonicTick,
      endChecksum: this.checksum(),
      actions: this.#capturedActions,
    };
    this.#capturedActions = [];
    this.#acceptedMoves.push(move);
    this.#commitBoundary(move.window, move.player);
    return move;
  }

  // Apply the opponent's move by trustless re-simulation (the atomic
  // form of beginMoveReplay + finish). Any out-of-bounds stamp, wrong
  // player, rules-rejected action, or checksum mismatch rejects the
  // move and restores the pre-move state (by replaying the accepted
  // history — resume is replay).
  applyMove(move: CorrespondenceWindowMove): CorrespondenceMoveVerdict {
    const start = this.beginMoveReplay(move);
    if (!start.ok) {
      return start;
    }

    return start.replay.finish();
  }

  // The recap form (SB-23-02): the shell drives the re-simulation in
  // chunks, rendering the world between them — the opponent's window
  // replayed before your eyes at high speed — then finish() verifies
  // the checksum and commits (or rejects and restores).
  beginMoveReplay(move: CorrespondenceWindowMove): CorrespondenceReplayStart {
    if (this.#replayActive) {
      return invalid("replay-active", "Another move replay is in progress.");
    }

    const window = this.currentWindow;
    const windowStart = window * this.windowTicks;
    const windowEnd = windowStart + this.windowTicks;
    if (this.#game.state.monotonicTick !== windowStart) {
      return invalid("out-of-turn", "The simulation is not at this window's start.");
    }

    if (move.window !== window) {
      return invalid("wrong-window", `Expected window ${window}, received ${move.window}.`);
    }

    if (move.player !== this.activePlayer) {
      return invalid("wrong-player", `Window ${window} belongs to player ${this.activePlayer}.`);
    }

    if (move.endTick !== windowEnd) {
      return invalid("wrong-end-tick", `Window ${window} ends at tick ${windowEnd}.`);
    }

    for (const stamped of move.actions) {
      if (
        !Number.isInteger(stamped.tick) ||
        stamped.tick <= windowStart ||
        stamped.tick > windowEnd ||
        !isSerfboundWorldAction(stamped.action) ||
        stamped.action.player !== move.player
      ) {
        return invalid(
          "invalid-action",
          "The move carries an action outside its window or player.",
        );
      }
    }

    const actionsByTick = new Map<number, SerfboundWorldAction[]>();
    for (const stamped of move.actions) {
      const list = actionsByTick.get(stamped.tick) ?? [];
      list.push(stamped.action);
      actionsByTick.set(stamped.tick, list);
    }

    this.#replayActive = true;
    let failure: CorrespondenceMoveVerdict | null = null;
    const stepTo = (limitTicks: number): void => {
      const world = this.#game.world();
      const target = Math.min(
        windowEnd,
        this.#game.state.monotonicTick + Math.max(0, Math.trunc(limitTicks)),
      );
      while (failure === null && this.#game.state.monotonicTick < target) {
        this.#game.state.advanceTick();
        const tick = this.#game.state.monotonicTick;
        for (const action of actionsByTick.get(tick) ?? []) {
          const outcome = applyWorldAction(world, action);
          if (!outcome.ok) {
            failure = invalid(
              "rules-rejected",
              `An action in the move violates the rules (${outcome.reason}).`,
            );
            return;
          }

          this.#game.state.recordWorldAction(action);
        }

        if (tick % 16 === 0) {
          this.#game.serfEngine().update(tick);
        }
      }
    };

    const match = this;
    const replay: CorrespondenceMoveReplay = {
      move,
      advance(ticks: number): void {
        stepTo(ticks);
      },
      get done(): boolean {
        return failure !== null || match.#game.state.monotonicTick >= windowEnd;
      },
      get tick(): number {
        return match.#game.state.monotonicTick;
      },
      finish(): CorrespondenceMoveVerdict {
        stepTo(Number.MAX_SAFE_INTEGER);
        match.#replayActive = false;
        if (failure !== null) {
          match.#rebuildFromHistory();
          return failure;
        }

        if (match.checksum() !== move.endChecksum) {
          match.#rebuildFromHistory();
          return invalid(
            "checksum-mismatch",
            "The re-simulated window does not match the claimed checksum.",
          );
        }

        match.#acceptedMoves.push(move);
        match.#commitBoundary(move.window, move.player);
        return { ok: true };
      },
    };
    return { ok: true, replay };
  }

  // Resume is replay: rebuild the simulation from tick 0 through the
  // accepted move history (the canonical way to open a match anywhere).
  #rebuildFromHistory(): void {
    this.#game = this.#freshGame();
    this.#windowStartStats = this.#captureStats();
    this.#lastDigest = null;
    const moves = this.#acceptedMoves;
    this.#acceptedMoves = [];
    this.#capturedActions = [];
    this.#pendingActions = [];
    for (const move of moves) {
      const verdict = this.applyMove(move);
      if (!verdict.ok) {
        throw new Error(`Correspondence match: accepted history failed to replay (${verdict.reason}).`);
      }
    }
  }

  #assertNoReplay(): void {
    if (this.#replayActive) {
      throw new Error("Correspondence match: a move replay is in progress.");
    }
  }

  #captureStats(): PlayerStats[] {
    const world = this.#game.world();
    const engine = this.#game.serfEngine();
    return world.players.map((player) => {
      let buildingsDone = 0;
      let buildingsTotal = 0;
      for (const building of world.buildings.values()) {
        if (building.player === player.index) {
          buildingsTotal += 1;
          if (building.isDone) {
            buildingsDone += 1;
          }
        }
      }

      let flags = 0;
      for (const flag of world.flags.values()) {
        if (flag.player === player.index) {
          flags += 1;
        }
      }

      let stockTotal = 0;
      for (const inventory of world.inventories.values()) {
        if (inventory.player === player.index) {
          for (const count of inventory.resources) {
            stockTotal += count;
          }
        }
      }

      let serfs = 0;
      for (const serf of engine.serfs.values()) {
        if (serf.player === player.index) {
          serfs += 1;
        }
      }

      return {
        buildingsDone,
        buildingsTotal,
        flags,
        landArea: player.landArea,
        stockTotal,
        serfs,
      };
    });
  }

  // At a window boundary: derive the digest from the start-of-window
  // stats, then rebase for the next window.
  #commitBoundary(window: number, activePlayer: number): void {
    const after = this.#captureStats();
    this.#lastDigest = {
      window,
      activePlayer,
      players: after.map((stats, index) => {
        const before = this.#windowStartStats[index] ?? stats;
        return {
          player: index,
          buildingsCompleted: stats.buildingsDone - before.buildingsDone,
          buildingsStarted: stats.buildingsTotal - before.buildingsTotal,
          flagsBuilt: stats.flags - before.flags,
          landAreaDelta: stats.landArea - before.landArea,
          stockDelta: stats.stockTotal - before.stockTotal,
          serfsDelta: stats.serfs - before.serfs,
        };
      }),
    };
    this.#windowStartStats = after;
  }

  #freshGame(): SerfboundLocalGame {
    const started = startSerfboundLocalGame(this.#gameOptions);
    if (started.status !== "started") {
      throw new Error(`Correspondence match: the game did not start (${started.reason}).`);
    }

    return started.game;
  }
}

// Open a match from its durable form: settings plus the accepted move
// history, replayed and re-verified from tick 0.
export function resumeCorrespondenceMatch(
  options: CorrespondenceMatchOptions,
  moves: readonly CorrespondenceWindowMove[],
): { match: CorrespondenceMatch; verdict: CorrespondenceMoveVerdict } {
  const match = new CorrespondenceMatch(options);
  for (const move of moves) {
    const verdict = match.applyMove(move);
    if (!verdict.ok) {
      return { match, verdict };
    }
  }

  return { match, verdict: { ok: true } };
}

function invalid(
  reason: string,
  message: string,
): { readonly ok: false; readonly reason: string; readonly message: string } {
  return { ok: false, reason, message };
}
