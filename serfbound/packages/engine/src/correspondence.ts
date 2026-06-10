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

export type CorrespondenceMatchOptions = {
  readonly game: SerfboundLocalGameStartOptions;
  readonly windowTicks?: number;
  readonly playerCount?: number;
};

export class CorrespondenceMatch {
  readonly windowTicks: number;
  readonly playerCount: number;
  #gameOptions: SerfboundLocalGameStartOptions;
  #game: SerfboundLocalGame;
  #pendingActions: SerfboundWorldAction[] = [];
  #capturedActions: StampedAction[] = [];
  #acceptedMoves: CorrespondenceWindowMove[] = [];

  constructor(options: CorrespondenceMatchOptions) {
    this.windowTicks = Math.max(64, Math.trunc(options.windowTicks ?? defaultWindowTicks));
    this.playerCount = Math.max(2, Math.trunc(options.playerCount ?? 2));
    this.#gameOptions = {
      ...options.game,
      playerCount: this.playerCount,
    };
    this.#game = this.#freshGame();
  }

  // The current window index; the simulation always rests at a window
  // boundary between moves.
  get currentWindow(): number {
    return Math.floor(this.#game.state.tick / this.windowTicks);
  }

  // Windows alternate players (chess-like): window N belongs to player
  // N mod playerCount.
  get activePlayer(): number {
    return this.currentWindow % this.playerCount;
  }

  get tick(): number {
    return this.#game.state.tick;
  }

  get world(): ReturnType<SerfboundLocalGame["world"]> {
    return this.#game.world();
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
    return this.#game.state.tick === (this.#acceptedMoves.length + 1) * this.windowTicks;
  }

  checksum(): number {
    return computeGameChecksum({
      world: this.#game.world(),
      serfEngine: this.#game.serfEngine(),
    });
  }

  // Queue a local command during the active window; it applies at the
  // next tick (the canonical order live and on replay).
  queue(action: SerfboundWorldAction): void {
    this.#pendingActions.push(action);
  }

  // Live play: advance the active window up to deltaTicks, applying
  // queued actions at tick boundaries and capturing the accepted ones.
  // Stops exactly at the window end.
  advance(deltaTicks: number): void {
    const windowEnd = (this.currentWindow + 1) * this.windowTicks;
    let remaining = Math.max(0, Math.trunc(deltaTicks));
    while (remaining > 0 && this.#game.state.tick < windowEnd) {
      this.#game.state.advanceTick();
      const tick = this.#game.state.tick;
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

      remaining -= 1;
    }
  }

  // At the window end the captured segment becomes the move; the match
  // records it and the next window begins (the opponent's).
  takeMove(): CorrespondenceWindowMove {
    const window = this.currentWindow - 1;
    if (!this.windowComplete || window !== this.#acceptedMoves.length) {
      throw new Error("Correspondence match: no fully played window awaits its move.");
    }

    const move: CorrespondenceWindowMove = {
      window,
      player: window % this.playerCount,
      endTick: this.#game.state.tick,
      endChecksum: this.checksum(),
      actions: this.#capturedActions,
    };
    this.#capturedActions = [];
    this.#acceptedMoves.push(move);
    return move;
  }

  // Apply the opponent's move by trustless re-simulation. Any
  // out-of-bounds stamp, wrong player, rules-rejected action, or
  // checksum mismatch rejects the move and restores the pre-move state
  // (by replaying the accepted history — resume is replay).
  applyMove(move: CorrespondenceWindowMove): CorrespondenceMoveVerdict {
    const window = this.currentWindow;
    const windowStart = window * this.windowTicks;
    const windowEnd = windowStart + this.windowTicks;
    if (this.#game.state.tick !== windowStart) {
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
        return this.#rejectAndRestore(
          "invalid-action",
          "The move carries an action outside its window or player.",
        );
      }
    }

    // Re-simulate the window applying the actions at their stamps.
    const actionsByTick = new Map<number, SerfboundWorldAction[]>();
    for (const stamped of move.actions) {
      const list = actionsByTick.get(stamped.tick) ?? [];
      list.push(stamped.action);
      actionsByTick.set(stamped.tick, list);
    }

    const world = this.#game.world();
    while (this.#game.state.tick < windowEnd) {
      this.#game.state.advanceTick();
      const tick = this.#game.state.tick;
      for (const action of actionsByTick.get(tick) ?? []) {
        const outcome = applyWorldAction(world, action);
        if (!outcome.ok) {
          return this.#rejectAndRestore(
            "rules-rejected",
            `An action in the move violates the rules (${outcome.reason}).`,
          );
        }

        this.#game.state.recordWorldAction(action);
      }

      if (tick % 16 === 0) {
        this.#game.serfEngine().update(tick);
      }
    }

    if (this.checksum() !== move.endChecksum) {
      return this.#rejectAndRestore(
        "checksum-mismatch",
        "The re-simulated window does not match the claimed checksum.",
      );
    }

    this.#acceptedMoves.push(move);
    return { ok: true };
  }

  // Resume is replay: rebuild the simulation from tick 0 through the
  // accepted move history (the canonical way to open a match anywhere).
  #rebuildFromHistory(): void {
    this.#game = this.#freshGame();
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

  #rejectAndRestore(reason: string, message: string): CorrespondenceMoveVerdict {
    this.#rebuildFromHistory();
    return { ok: false, reason, message };
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

function invalid(reason: string, message: string): CorrespondenceMoveVerdict {
  return { ok: false, reason, message };
}
