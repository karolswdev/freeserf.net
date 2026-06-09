# Evidence — SB-5-01 — Choose Browser Renderer API

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `pm/roadmap/serfbound/adoption/renderer-api-decision.md` - records the WebGL2
  renderer baseline, rejected alternatives, browser support position, testing
  implications, and stop signals.
- `pm/roadmap/serfbound/phase-5-renderer-projection/story-01-browser-renderer-api.md`
  - marks SB-5-01 done and links the decision.
- `pm/roadmap/serfbound/phase-5-renderer-projection/current-phase-status.md` -
  marks SB-5-01 done and SB-5-02 ready.
- `pm/roadmap/serfbound/README.md` - records the current renderer baseline.

## Behavior protected

- Phase 5 has a concrete browser renderer API baseline: first-party WebGL2.
- Canvas2D, WebGPU, library-backed renderers, and desktop/native renderer reuse
  have explicit dispositions.
- The decision preserves normal play as pure browser with no desktop/native
  renderer or .NET runtime.
- Later renderer work has test obligations: generated CI path, optional local
  `SPAU.PA` path, layer ordering, projection handoff, and viewport proof.
- Stop signals define when to reopen the decision instead of drifting silently.

## Sources reviewed

- `Freeserf.Core/Rendering.txt`
- `Freeserf.Renderer/*`
- `pm/roadmap/serfbound/adoption/runtime-module-boundaries.md`
- MDN WebGL2RenderingContext:
  https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext
- MDN Canvas API:
  https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- MDN WebGPU API:
  https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API
- web.dev WebGPU support update:
  https://web.dev/blog/webgpu-supported-major-browsers

## Commands and output

Command:

```bash
zsh -lc 'source ~/.nvm/nvm.sh && cd serfbound && nvm use && env -u SERFBOUND_RUN_LOCAL_ASSET_TESTS -u SERFBOUND_LOCAL_DATA -u SERFBOUND_SPAU_PA npm test && npm run check:boundaries && npm run test:local:assets'
```

Output summary:

```text
26 unit tests passed.
1 chromium browser smoke passed.
serfbound-boundaries-ok
serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.
```
