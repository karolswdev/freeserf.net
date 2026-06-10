# Evidence — SB-6-01 — Implement Pointer-To-Map Interaction

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `serfbound/packages/app/src/render-layer-scene.ts` - exports
  `resolveFirstRenderLayerPointer()` so pointer input reuses the Phase 5
  `MapProjectionTransform` and scene projection settings.
- `serfbound/packages/app/src/main.ts` - wires canvas `pointermove`,
  `pointerdown`, and `pointerleave` into hover/selection debug state.
- `serfbound/packages/app/src/styles.css` - marks the WebGL canvas as an
  interaction surface and sets `touch-action: none`.
- `serfbound/tests/ci/app-render-layer-scene.test.mjs` - verifies deterministic
  screen/view/map/tile pointer mapping and clamp behavior.
- `serfbound/tests/browser/static-shell.spec.ts` - verifies browser hover,
  selection, mouse pointer state, and touch-style pointer state over the canvas.
- `pm/roadmap/serfbound/adoption/pointer-input-model.md` - documents the
  pointer input model, projection boundary, and mouse/trackpad/touch viability
  assessment.
- `pm/roadmap/serfbound/phase-6-ui-input-shell/story-01-pointer-map-interaction.md`
  - marks SB-6-01 done.
- `pm/roadmap/serfbound/phase-6-ui-input-shell/current-phase-status.md` - marks
  SB-6-01 done, opens SB-6-02 as ready, and checks the pointer mapping exit
  criterion.

## Behavior protected

- Pointer coordinates are measured relative to the displayed WebGL canvas.
- Pointer mapping returns screen, view, map, and tile coordinates through the
  Phase 5 projection transform.
- Browser hover debug state shows the current tile and map coordinate.
- Browser selection debug state records the selected tile and archive-safe map
  position.
- Mouse/trackpad-style pointer input uses the browser `pointerType: mouse` path.
- Touch-style pointer input uses the same handler with `touch-action: none`.
- No gameplay command or destructive state mutation is routed yet.

## Commands and output

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm test && npm run check:boundaries && npm run test:local:assets'
```

Output summary:

```text
32 unit tests passed.
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
32 unit tests passed.
```

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && npm run test:browser'
```

Output summary:

```text
2 chromium browser tests passed.
```

## Input Viability Notes

Chromium exposes mouse and trackpad interaction through the same Pointer Events
path with `pointerType: mouse`; the browser smoke covers that path via
Playwright movement and click. Touch viability is covered at the Pointer Events
boundary with a touch-style `PointerEvent` and `touch-action: none`.

Physical-device ergonomics are intentionally not claimed here. SB-6-04 owns the
broader manual mouse, trackpad, and touch ergonomics check after command routing
and panels exist.
