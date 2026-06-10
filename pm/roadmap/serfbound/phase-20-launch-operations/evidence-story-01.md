# Evidence — SB-20-01 — Public Release Pipeline and Versioning

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `.github/workflows/serfbound-pages.yml` — the public release pipeline:
  tags matching `serfbound-v*` run the full data-free release gates
  (tests, boundary checks, static-hosting verification, docs checks),
  build the artifact with a `version.json` stamp (tag + commit), and
  deploy to GitHub Pages. Only the app shell publishes — the original
  data boundary holds by construction.
- `serfbound/CHANGELOG.md` — the versioned changelog, opening with
  `serfbound-v0.1.0` (the complete game summarized by capability).
- `serfbound/package.json` — version 0.1.0.
- `serfbound/docs/static-hosting-release.md` — the Pages release path
  documented (subpath serving verified by the standing
  `test:release:static` gate; the one-time Pages settings toggle is
  recorded as the maintainer step).

## Verification artifacts

```text
npm run test:release:static ->
  serfbound-release-artifact-ok: inspected 6 static files in dist/.
  serfbound-static-hosting-ok: served dist at /serfbound/, imported
  generated SPAU.PA, and restored IndexedDB state after reload.
npm run test:docs -> serfbound-docs-ok
```

The artifact's relative URLs make it subpath-correct for the Pages URL
(https://<owner>.github.io/<repo>/), exactly the configuration the
static-hosting gate exercises.

## Deviations from plan

- The public URL goes live when the repository's Pages setting selects
  "GitHub Actions" — a one-click maintainer toggle outside this
  codebase's reach; the pipeline, gates, versioning, and artifact are
  shipped and verified. Recorded as the activation step.

## Follow-ups

- SB-20-02: error reporting and issue intake.
