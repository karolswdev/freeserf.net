# Phase 8 Worker And Threading Decision

**Story:** SB-8-02 - Decide Worker And Threading Model
**Status:** decided
**Decision date:** 2026-06-09

## Decision

Serfbound stays main-thread-first for the current playable browser slice. Web
Workers are explicitly deferred until measured browser pressure crosses the
stop signals below.

Normal play remains pure browser: TypeScript engine code, app shell,
IndexedDB persistence, local file import, and WebGL2 rendering run inside the
browser. No .NET runtime, desktop wrapper, native launcher, local companion
process, or local-server dependency is introduced by this decision.

## Evidence Used

SB-8-01 established the first Phase 8 performance baseline in
`performance-budgets.md` and
`artifacts/story-01-performance-baseline-local.json`.

Measured local Chromium baseline:

| Area | Budget | Baseline | Result |
|---|---:|---:|---|
| Simulation tick average | <= 0.05 ms | 0.000067 ms | pass |
| Desktop Chromium frame p95 | <= 20 ms | 9.700 ms | pass |
| Local `SPAU.PA` import | <= 1000 ms | 203.855 ms | pass |
| Save current game | <= 100 ms | 87.651 ms | pass |
| Reload and load saved game | <= 1000 ms | 225.290 ms | pass |

Additional browser state in the same artifact:

- Nonblank WebGL pixels after load: 144,941
- Rendered primitive count after load: 1,046
- Restored built structures: 1
- Renderer: WebGL2
- Browser: Playwright Chromium 148.0.7778.96
- Viewport: 1280x900
- Local asset checksum:
  `4a652471c4185d324b16fadd736f2464210df5d8938136aaa0ccc4a43c790ca2`

The current simulation tick is far below the first-slice budget, and frame
cadence is under the desktop Chromium budget. A worker would add state-copying,
message scheduling, determinism, and test complexity before the product has a
measured main-thread problem.

## Options Considered

| Option | Result | Reason |
|---|---|---|
| Main-thread simulation, rendering, app state, and persistence | chosen | Matches current code, keeps determinism inspectable, and is under the measured budgets. |
| Dedicated simulation Worker | deferred | No measured tick pressure yet; command/snapshot serialization would be complexity without a proven gain. |
| OffscreenCanvas render Worker | deferred | The current WebGL2 render path meets frame budget; browser compatibility must be proven in SB-8-04 before depending on OffscreenCanvas. |
| Import or persistence Worker | deferred | Import and reload/load are well under budget. Save is below the current budget but close enough that SB-8-03 should harden recovery before adding threading. |
| WASM/threaded simulation | rejected for this story | Phase 0 runtime decision already keeps WASM as an evidence-triggered escape hatch, not the default runtime. No Phase 8 evidence trips that hatch. |

## Main-Thread Boundary For Now

The current browser runtime keeps these responsibilities on the main thread:

- Engine tick and command application in `@serfbound/engine`.
- App orchestration, input routing, panels, and player-visible state in
  `@serfbound/app`.
- WebGL2 rendering and pointer coordinate resolution in the app render path.
- Local file import and IndexedDB persistence through browser APIs.
- Performance measurement through `npm run measure:performance`.

This is a conscious baseline, not an accident. The PMO rule is: keep the
simple browser path until the measured cost of keeping it simple exceeds the
measured cost of moving state across a worker boundary.

## Deferred Worker Boundary

If a later stop signal trips, the first worker candidate is a deterministic
simulation Worker, not a broad app Worker.

The worker would own:

- `SerfboundGameState` creation, tick advancement, and command application.
- Deterministic command validation results.
- Snapshot production for save/load and rendering summaries.

The main thread would continue to own:

- DOM, panels, controls, and pointer events.
- WebGL2/WebGPU rendering until a separate renderer-worker decision is proven.
- User file selection and user-facing recovery UI.
- IndexedDB writes unless SB-8-03 evidence shows persistence work needs its own
  boundary.

Initial message contracts would be versioned structured-clone payloads:

```ts
type SerfboundWorkerMessage =
  | {
      schemaVersion: 1;
      type: "initialize";
      requestId: string;
      source: "generated" | "dos-pa-catalog";
      snapshot?: unknown;
    }
  | {
      schemaVersion: 1;
      type: "command";
      requestId: string;
      commandId: string;
      command: unknown;
    }
  | {
      schemaVersion: 1;
      type: "tick";
      requestId: string;
      ticks: number;
    }
  | {
      schemaVersion: 1;
      type: "snapshot";
      requestId: string;
    };

type SerfboundWorkerReply =
  | {
      schemaVersion: 1;
      type: "ready";
      requestId: string;
      snapshot: unknown;
    }
  | {
      schemaVersion: 1;
      type: "command-result";
      requestId: string;
      accepted: boolean;
      snapshot: unknown;
      rejection?: unknown;
    }
  | {
      schemaVersion: 1;
      type: "tick-result";
      requestId: string;
      snapshot: unknown;
      tickCount: number;
    }
  | {
      schemaVersion: 1;
      type: "error";
      requestId: string;
      message: string;
    };
```

Before enabling any worker path, a future story must test:

- Main-thread baseline versus worker baseline on the same scripted playable
  loop.
- Structured-clone or transfer cost for representative command batches and
  snapshots.
- Deterministic equality between direct engine execution and worker execution.
- Browser support in the SB-8-04 compatibility matrix.
- Recoverability when the worker fails, restarts, or returns a schema mismatch.

## Stop Signals For Revisit

Revisit this decision when any of these happens:

- Average simulation tick exceeds 0.05 ms on the current first playable slice.
- Desktop Chromium requestAnimationFrame p95 exceeds 20 ms.
- Import, save, or reload/load timings exceed the SB-8-01 budgets in repeated
  local runs.
- Normal play records user-visible stalls or future long-task measurement shows
  repeated tasks over 50 ms during interaction, import, save, or rendering.
- SB-8-04 finds that lower-end/mobile browsers miss the agreed frame budget in
  normal play.
- Phase 9 release-readiness review finds browser responsiveness risk that
  cannot be solved by smaller main-thread optimizations.
- Future gameplay scale, such as pathfinding, economy simulation, AI, or large
  map updates, produces measured state or frame pressure that main-thread code
  cannot keep under budget.

If a stop signal trips, the next PMO story must decide the smallest worker
boundary that solves that measured issue. It must not move rendering,
persistence, and simulation together unless evidence shows they share the same
bottleneck.

## Browser Support Notes

Workers are available in modern browsers, but the relevant details are not
free:

- Worker module loading has bundler and browser-matrix implications.
- OffscreenCanvas support is browser-specific and should not be assumed until
  SB-8-04 records it.
- Structured-clone behavior and transfer costs depend on payload shape.
- IndexedDB can be used from workers in many browsers, but recovery UX still
  belongs on the main thread.

Deferring workers keeps the current release path simpler and keeps SB-8-04
focused on measuring the actual browser matrix instead of validating an
unneeded concurrency design.
