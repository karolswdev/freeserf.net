import { applyWorldAction } from "./world-commands.js";
import type { SerfboundWorldAction, SerfboundWorldActionOutcome } from "./world-commands.js";
import type { SerfboundGameWorld } from "./game-world.js";

// The lockstep session core (SB-22-02): time divides into input turns
// of `turnTicks` engine ticks. Commands a player issues during their
// local turn N are stamped for turn N + inputDelayTurns and broadcast;
// a peer may execute turn T only once it holds every player's bundle
// for every turn up to T. Missing bundles hold the simulation (stall)
// — determinism is never traded for progress. Within a turn, actions
// execute in player order, then submission order: identical on every
// peer regardless of arrival order.

export const defaultTurnTicks = 64;
export const defaultInputDelayTurns = 2;

export type LockstepTurnBundle = {
  readonly player: number;
  readonly turn: number;
  readonly actions: readonly SerfboundWorldAction[];
};

export type LockstepSessionOptions = {
  readonly localPlayer: number;
  readonly players: readonly number[];
  readonly turnTicks?: number;
  readonly inputDelayTurns?: number;
};

export type LockstepExecutedAction = {
  readonly action: SerfboundWorldAction;
  readonly outcome: SerfboundWorldActionOutcome;
};

export class LockstepSession {
  readonly localPlayer: number;
  readonly players: readonly number[];
  readonly turnTicks: number;
  readonly inputDelayTurns: number;
  #pendingLocal: SerfboundWorldAction[] = [];
  readonly #bundles = new Map<string, LockstepTurnBundle>();
  #localTurn = 0;
  #executedTurn = -1;

  constructor(options: LockstepSessionOptions) {
    this.localPlayer = options.localPlayer;
    this.players = [...options.players].sort((a, b) => a - b);
    this.turnTicks = Math.max(16, Math.trunc(options.turnTicks ?? defaultTurnTicks));
    this.inputDelayTurns = Math.max(1, Math.trunc(options.inputDelayTurns ?? defaultInputDelayTurns));
    if (!this.players.includes(this.localPlayer)) {
      throw new Error("Lockstep session: localPlayer must be one of players.");
    }
  }

  // The next local input turn to close.
  get localTurn(): number {
    return this.#localTurn;
  }

  // The last turn whose actions executed.
  get executedTurn(): number {
    return this.#executedTurn;
  }

  // First engine tick of a turn (turn 0 starts after tick 0; engine
  // updates run in 16-tick steps inside the turn).
  turnStartTick(turn: number): number {
    return turn * this.turnTicks;
  }

  // Queue a local command; it executes at localTurn + inputDelayTurns
  // on every peer.
  submit(action: SerfboundWorldAction): void {
    this.#pendingLocal.push(action);
  }

  // Close the local input turn: the pending commands become the bundle
  // for turn (localTurn + delay), recorded locally and returned for
  // broadcast.
  completeTurn(): LockstepTurnBundle {
    const bundle: LockstepTurnBundle = {
      player: this.localPlayer,
      turn: this.#localTurn + this.inputDelayTurns,
      actions: this.#pendingLocal,
    };
    this.#pendingLocal = [];
    this.#bundles.set(bundleKey(bundle.turn, bundle.player), bundle);
    this.#localTurn += 1;
    return bundle;
  }

  // A remote player's bundle arrives (any order, duplicates idempotent).
  receive(bundle: LockstepTurnBundle): void {
    if (!this.players.includes(bundle.player)) {
      throw new Error(`Lockstep session: unknown player ${bundle.player}.`);
    }

    const key = bundleKey(bundle.turn, bundle.player);
    const existing = this.#bundles.get(key);
    if (existing !== undefined && !bundlesEqual(existing, bundle)) {
      throw new Error(
        `Lockstep session: conflicting bundle for turn ${bundle.turn} player ${bundle.player}.`,
      );
    }

    this.#bundles.set(key, bundle);
  }

  // The highest turn that may execute: every player's bundle is present
  // for every turn from the first scheduled turn through it. The
  // bootstrap turns (below the input delay) are implicitly empty — no
  // one could schedule into them.
  readyThroughTurn(): number {
    let turn = this.#executedTurn;
    for (;;) {
      const next = turn + 1;
      if (next < this.inputDelayTurns) {
        turn = next;
        continue;
      }

      const complete = this.players.every(
        (player) => this.#bundles.get(bundleKey(next, player)) !== undefined,
      );
      if (!complete) {
        return turn;
      }

      turn = next;
    }
  }

  // True when the simulation cannot advance to the next turn yet.
  get stalled(): boolean {
    return this.readyThroughTurn() <= this.#executedTurn;
  }

  // The deterministic action list for a turn: player order, then
  // submission order within each player's bundle.
  actionsForTurn(turn: number): SerfboundWorldAction[] {
    const actions: SerfboundWorldAction[] = [];
    for (const player of this.players) {
      const bundle = this.#bundles.get(bundleKey(turn, player));
      if (bundle !== undefined) {
        actions.push(...bundle.actions);
      }
    }

    return actions;
  }

  // Execute the next turn's actions against the world. Turns execute
  // strictly in order and only when ready; rejected actions are a valid
  // deterministic outcome (every peer rejects them identically).
  executeNextTurn(world: SerfboundGameWorld): LockstepExecutedAction[] {
    const turn = this.#executedTurn + 1;
    if (this.readyThroughTurn() < turn) {
      throw new Error(`Lockstep session: turn ${turn} is not ready (stall — hold the simulation).`);
    }

    const executed: LockstepExecutedAction[] = [];
    for (const action of this.actionsForTurn(turn)) {
      executed.push({ action, outcome: applyWorldAction(world, action) });
    }

    this.#executedTurn = turn;
    // Executed bundles are no longer needed.
    for (const player of this.players) {
      this.#bundles.delete(bundleKey(turn, player));
    }

    return executed;
  }
}

function bundleKey(turn: number, player: number): string {
  return `${turn}:${player}`;
}

function bundlesEqual(left: LockstepTurnBundle, right: LockstepTurnBundle): boolean {
  return (
    left.player === right.player &&
    left.turn === right.turn &&
    JSON.stringify(left.actions) === JSON.stringify(right.actions)
  );
}
