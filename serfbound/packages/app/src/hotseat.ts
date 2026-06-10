import {
  CorrespondenceMatch,
  type CorrespondenceWindowMove,
  type SerfboundLocalGameStartOptions,
  type SerfboundWorldAction,
  type WindowDigest,
} from "@serfbound/engine";
import { createRecapDriver, type RecapDriver } from "./recap.js";

// Hot-seat correspondence (SB-23-03): two players, one machine, pass
// the seat. The active player plays their window on the live match; at
// the boundary the move transfers to the verify match — the same
// trustless re-simulation a remote opponent runs — and the incoming
// player watches it as the high-speed recap before their own window
// begins. The pickup countdown surfaces (enforcement with real
// deadlines is Phase 24's mailbox).

export type HotseatMode = "your-window" | "handover" | "recap" | "failed";

export type HotseatOptions = {
  readonly game: SerfboundLocalGameStartOptions;
  readonly windowTicks: number;
  readonly pickupSeconds?: number;
  // Injected clock (milliseconds) so the countdown is testable.
  readonly now?: () => number;
};

export class HotseatController {
  // Where windows are played live.
  readonly live: CorrespondenceMatch;
  // The receiving side: every move re-simulates here (rendered during
  // the recap), so one machine still exercises the full trustless path.
  readonly verify: CorrespondenceMatch;
  readonly pickupSeconds: number;
  #mode: HotseatMode = "your-window";
  #pendingMove: CorrespondenceWindowMove | null = null;
  #recap: RecapDriver | null = null;
  #handoverStartedAtMs: number | null = null;
  #now: () => number;
  failureReason: string | null = null;

  constructor(options: HotseatOptions) {
    this.live = new CorrespondenceMatch({
      game: options.game,
      windowTicks: options.windowTicks,
    });
    this.verify = new CorrespondenceMatch({
      game: options.game,
      windowTicks: options.windowTicks,
    });
    this.pickupSeconds = Math.max(5, Math.trunc(options.pickupSeconds ?? 60));
    this.#now = options.now ?? (() => Date.now());
  }

  get mode(): HotseatMode {
    return this.#mode;
  }

  // The player whose window is (or is next) being played.
  get activePlayer(): number {
    return this.live.activePlayer;
  }

  get currentWindow(): number {
    return this.live.currentWindow;
  }

  // The match the shell should render right now: the verifier during a
  // recap (the incoming player watches the received window), the live
  // match otherwise.
  get renderMatch(): CorrespondenceMatch {
    return this.#mode === "recap" ? this.verify : this.live;
  }

  get lastDigest(): WindowDigest | null {
    return this.verify.lastWindowDigest ?? this.live.lastWindowDigest;
  }

  // Seconds left to pick the turn up (handover only); 0 once expired.
  get countdownSeconds(): number | null {
    if (this.#mode !== "handover" || this.#handoverStartedAtMs === null) {
      return null;
    }

    const elapsed = (this.#now() - this.#handoverStartedAtMs) / 1000;
    return Math.max(0, Math.ceil(this.pickupSeconds - elapsed));
  }

  get pickupExpired(): boolean {
    return this.countdownSeconds === 0;
  }

  // Local commands during the active window (the canonical
  // queue-for-next-tick path).
  queue(action: SerfboundWorldAction): void {
    if (this.#mode === "your-window") {
      this.live.queue(action);
    }
  }

  // One shell-timer step. Plays the live window, transfers the move at
  // the boundary, and drives the recap one chunk per call.
  tick(deltaTicks: number): void {
    switch (this.#mode) {
      case "your-window": {
        this.live.advance(deltaTicks);
        if (this.live.windowComplete) {
          this.#pendingMove = this.live.takeMove();
          this.#mode = "handover";
          this.#handoverStartedAtMs = this.#now();
        }

        return;
      }
      case "recap": {
        const recap = this.#recap;
        if (recap === null) {
          return;
        }

        if (recap.advanceFrame()) {
          const verdict = recap.finish();
          this.#recap = null;
          if (!verdict.ok) {
            this.#mode = "failed";
            this.failureReason = verdict.reason;
            return;
          }

          this.#mode = "your-window";
        }

        return;
      }
      default:
        return;
    }
  }

  // The incoming player picks the turn up: the received window replays
  // before their eyes (recap), then their window begins.
  pickup(): void {
    if (this.#mode !== "handover" || this.#pendingMove === null) {
      return;
    }

    const start = createRecapDriver(this.verify, this.#pendingMove);
    this.#pendingMove = null;
    this.#handoverStartedAtMs = null;
    if (!start.ok) {
      this.#mode = "failed";
      this.failureReason = start.reason;
      return;
    }

    this.#recap = start.driver;
    this.#mode = "recap";
  }
}
