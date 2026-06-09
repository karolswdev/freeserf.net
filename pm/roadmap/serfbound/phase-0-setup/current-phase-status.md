# Phase 0 — Rewrite Discovery And Architecture

**Last updated:** 2026-06-09.

## Goal

Phase 0 exists to turn "rewrite freeserf.net for the browser" into an
evidence-backed implementation plan. It must prove the architecture shape,
runtime choice, source boundaries, asset/legal boundary, and parity strategy
before Serfbound starts porting gameplay code. The target is pure browser:
no final .NET code, no desktop deliverable, and no native launcher.

## Scope

- **In:** Repository adoption, project naming, source inventory, browser
  architecture decision, parity-harness design, asset ingestion boundary, and
  a complete gated phase plan.
- **Out:** Shipping gameplay code, rewriting renderer code, bundling original
  game data, multiplayer design, AI improvements, tutorial restoration, or UI
  redesign beyond what is needed to plan the browser shell. Also out: any plan
  that preserves .NET as product code or adds a desktop target.

## Exit criteria (evidence required)

- [ ] `pm/roadmap/serfbound/README.md` names Serfbound and lists all planned
  phases with explicit goals.
- [ ] `pm/roadmap/serfbound/adoption/session-intake.md` captures the user
  direction, constraints, and open questions.
- [ ] A source-inventory artifact maps `Freeserf.Core`, `Freeserf.Renderer`,
  `Freeserf.Audio`, `Freeserf.Network`, `FreeserfNet`, and data-file loading to
  browser rewrite concerns.
- [ ] A runtime architecture decision records TypeScript-first, Rust/WASM-first,
  or hybrid as the initial implementation strategy, with a stop signal.
- [ ] A parity-harness design identifies the first deterministic reference
  outputs to capture from `freeserf.net`.
- [ ] An asset/legal boundary document states how users supply DOS/Amiga data in
  the browser, what the repo will not store, and how the local `SPAU.PA` source
  can be used for verification.
- [ ] Every phase records pure-browser/no-.NET/no-desktop as a non-negotiable
  constraint or dependency.
- [ ] Phase 1 has ready stories for reference-oracle capture.
- [ ] The roadmap explains why reference capture, browser foundation,
  simulation parity, data import, rendering, UI/input, playable slice,
  browser hardening, and release operations are separate gates.

## Story status

| ID | Story | Status | Story file | Evidence |
|---|---|---|---|---|
| SB-0-01 | Name and charter Serfbound | done | [story-01-name-and-charter](./story-01-name-and-charter.md) | [evidence-story-01](./evidence-story-01.md) |
| SB-0-02 | Inventory reference architecture | backlog | [story-02-reference-architecture-inventory](./story-02-reference-architecture-inventory.md) | — |
| SB-0-03 | Decide browser runtime strategy | backlog | [story-03-browser-runtime-decision](./story-03-browser-runtime-decision.md) | — |
| SB-0-04 | Design deterministic parity harness | backlog | [story-04-parity-harness-design](./story-04-parity-harness-design.md) | — |
| SB-0-05 | Define asset and legal boundary | backlog | [story-05-asset-and-legal-boundary](./story-05-asset-and-legal-boundary.md) | — |

## Where we are

Delivery Workbench has been cloned and installed into `freeserf.net`, and the
rewrite track is named Serfbound. The project is currently a planning scaffold:
no web runtime implementation has been chosen yet. User-owned English DOS files
are available locally under ignored `serfbound-local-data/sources/`, including
`SPAU.PA`, so data-import phases can plan against a real local source. The
roadmap has been tightened into proof gates so implementation cannot skip from
"we like the idea" to "we are writing engine code" without oracle, workspace,
data, rendering, UI, and browser-hardening evidence. The next responsible move
is SB-0-02: inventory the reference implementation by subsystem and mark which
parts become engine logic, browser adapters, temporary oracle code, or dropped
desktop-only behavior.

## Active risks

| Risk | Likelihood | Mitigation | Stop signal |
|---|---|---|---|
| Rewriting before understanding the C# behavior | high | Require source inventory and parity harness before Phase 1 | A Phase 1 story cannot name the reference methods/files it preserves |
| Choosing a web stack by preference rather than evidence | medium | SB-0-03 must compare TypeScript, Rust/WASM, and hybrid against project constraints | The chosen stack cannot express deterministic simulation tests cleanly |
| Temporary .NET reference code leaks into product architecture | high | Allow .NET only as an isolated reference oracle during discovery/parity capture | A story proposes shipping .NET, a native launcher, or a browser shell around .NET |
| Desktop thinking leaks into UX or packaging | medium | Treat every filesystem/window/input assumption as a browser API replacement | Normal play requires a desktop app, local executable, or native companion |
| Copyright/data handling drift | high | Keep original data user-supplied and document import/storage rules | Any story proposes committing original DOS/Amiga assets |
| Renderer work masks engine uncertainty | medium | Defer visual polish until deterministic core spike proves map/game ticks | UI work starts before a reference-state capture exists |

## Decisions made (this phase)

- 2026-06-09 — Name the browser rewrite track `Serfbound` — short, web-safe,
  not a direct original-game title, and accepted by the user — user direction.
- 2026-06-09 — Treat `freeserf.net` as behavioral reference, not product
  runtime — user wants a browser-native platform and the repository already
  isolates much of the game behavior in `Freeserf.Core` — user direction plus
  repository inspection.
- 2026-06-09 — Final Serfbound has no .NET code and no desktop target — user
  explicitly ruled out .NET and desktop deliverables — user direction.
- 2026-06-09 — Local/procured original assets are allowed for development and
  play, but not committed or redistributed — supports practical verification
  while keeping the repo boundary clean — user direction plus copyright risk.
- 2026-06-09 — Treat the local English DOS asset set as the current verification
  source — user provided previously purchased files under ignored
  `serfbound-local-data/sources/`, including `SPAU.PA` — user direction plus
  local inspection.
- 2026-06-09 — Split the roadmap into stricter delivery gates — the previous
  five-phase plan hid too much risk between discovery, engine work, rendering,
  and release — user concern plus roadmap review.

## Decisions deferred

- Runtime implementation strategy — resolve in SB-0-03 — default to a hybrid
  plan only if pure TypeScript or pure Rust/WASM fails a concrete criterion;
  .NET is not an option for final product code.
- First playable scope — resolve before Phase 7 — default to local single-player
  with the ignored local English DOS `SPAU.PA` source unless Phase 4 discovers a
  blocker.
- Browser persistence model — revisit in Phase 4 and harden in Phase 8 —
  default to IndexedDB for imported data and saves unless the browser API
  evidence says otherwise.
