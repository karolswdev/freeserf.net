# Evidence — SB-24-03 — CI and Pages in the New Repository

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## What shipped

Both workflows verified by real runs in `karolswdev/serfbound`:

- **CI** (`.github/workflows/ci.yml`, push/PR on main): run
  `27301179999` — **success** (2m32s), the full data-free
  `ci:release` gate set on the Ubuntu runner.
- **Pages** (`.github/workflows/pages.yml`, tags `v*` +
  workflow_dispatch): run `27301409644` — **success** (2m45s); Pages
  was enabled with `build_type=workflow` via `gh api`, and
  **https://karolswdev.github.io/serfbound/ serves HTTP 200** with
  `version.json` = `{"version": "main", "commit": "128e33d…"}`.

Two real-run findings fixed (each its own contract-gated commit in the
new repository):

1. `94eef0a` — the mobile e2e silently ran on WebKit everywhere
   (the iPhone 13 device descriptor sets `defaultBrowserType: webkit`,
   and local machines had WebKit installed from the compatibility
   suite); CI installs Chromium only. The spec now pins
   `browserName: "chromium"` — one engine everywhere.
2. `128e33d` — the pages workflow lacked the pinned-npm step the CI
   workflow has, so its `npm ci` resolved the lockfile differently and
   failed; aligned.

## Verification artifacts

```text
gh run watch 27301179999 -> CI: completed success (2m32s)
gh api -X POST repos/karolswdev/serfbound/pages -f build_type=workflow
gh run watch 27301409644 -> pages: completed success (2m45s)
curl https://karolswdev.github.io/serfbound/ -> 200
curl .../version.json -> {"version": "main", "commit": "128e33d..."}
```

## Deviations from plan

- The Pages verification used `workflow_dispatch` rather than a version
  tag (the first `v*` tag is a release decision, not a plumbing test);
  the tag path is the same job.
- The WebKit discovery means earlier local "mobile" runs exercised a
  different engine than CI will — pinned now; recorded for honesty.

## Follow-ups

- SB-24-04: the zero-.NET guard, the old-repo handoff, and the phase
  close (the cutover point).
