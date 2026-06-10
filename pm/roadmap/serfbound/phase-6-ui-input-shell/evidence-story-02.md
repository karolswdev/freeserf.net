# Evidence — SB-6-02 — Add Command Routing Shell

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `serfbound/packages/engine/src/commands.ts` - adds the DOM-free
  `SerfboundCommandRouter`, typed command payloads, validation, deterministic
  route snapshots, command logging, and structured rejection reasons.
- `serfbound/packages/engine/src/index.ts` - exports the command routing API
  from `@serfbound/engine`.
- `serfbound/packages/app/src/main.ts` - creates one engine command router for
  the browser shell and routes canvas tile selection through
  `debug.inspect-map-tile`.
- `serfbound/tests/ci/engine-command-routing.test.mjs` - verifies accepted
  debug commands, structured invalid-command rejections, deterministic logging,
  and the deferred Phase 7 build route.
- `serfbound/tests/browser/static-shell.spec.ts` - verifies that a browser
  canvas click dispatches a command and exposes accepted command state.
- `pm/roadmap/serfbound/phase-6-ui-input-shell/story-02-command-routing-shell.md`
  - marks SB-6-02 done.
- `pm/roadmap/serfbound/phase-6-ui-input-shell/story-03-basic-panels-states.md`
  - opens SB-6-03 as ready.
- `pm/roadmap/serfbound/phase-6-ui-input-shell/current-phase-status.md` and
  `pm/roadmap/serfbound/README.md` - record the command routing baseline and
  keyboard shortcut decision.

## Behavior protected

- UI commands are semantic payloads, not raw DOM events.
- Browser tile selection crosses a single `@serfbound/engine` command boundary.
- `debug.inspect-map-tile` proves an accepted no-op/debug route end to end.
- Invalid commands return structured rejected results with deterministic command
  IDs, reasons, messages, snapshots, and log entries.
- `game.build` has an explicit route for Phase 7 and currently rejects with
  `build-command-deferred`.
- Command routing is deterministic and testable without a DOM.
- Exact keyboard shortcuts are deferred until visible action panels exist;
  command payloads already support `source: "keyboard"`, and Phase 6 will avoid
  browser navigation/find/reload/text-editing/assistive-technology conflicts.

## Commands and output

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm test && npm run check:boundaries && npm run test:local:assets'
```

Output summary:

```text
35 unit tests passed.
2 chromium browser tests passed.
serfbound-boundaries-ok
serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
```

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && npm run test:unit'
```

Output summary:

```text
35 unit tests passed.
```

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && npm run test:browser'
```

Output summary:

```text
2 chromium browser tests passed.
```
