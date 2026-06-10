# Evidence — SB-24-02 — Create and Populate the Standalone Repository

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## What shipped

**https://github.com/karolswdev/serfbound** — public, GPL-3.0,
provenance initial commit `c5f4fe9` ("extracted from
karolswdev/freeserf.net@65cb039"), branch `main`, zero .NET artifacts.

The export per the SB-24-01 inventory:

- The workspace promoted to the repository root (packages, tests,
  scripts, docs, public, configs, CHANGELOG, .nvmrc).
- `pm/**` minus `reference-tools` (stays in the archive — it inspects
  C# sources) and minus historical `artifacts/` directories (a recorded
  refinement: 127MB of visual-evidence PNGs stay in the archive
  repository; the textual record moves verbatim; future artifacts land
  in the new repository normally).
- `.githooks/**` with `core.hooksPath` configured — the contract gated
  the initial commit itself (the 106 historical story flips used the
  hook's own `BUNDLE-OK` mechanism with the rationale recorded).
- Workflows rewritten for the root layout: `ci.yml` (push/PR on main)
  and `pages.yml` (tags `v*`); the issue template.
- New root `README.md` (standalone, with the GPL-3.0 lineage section
  naming freeserf.net and freeserf and the archive pointer), `LICENSE`
  (GPLv3), `.gitignore` (including the `serfbound-local-data/` asset
  boundary).
- Path adjustments: every workspace-relative `../pm`,
  `../serfbound-local-data`, and `../.tmp` reference reduced one level
  (scripts, specs, fixture loaders, package.json, docs); the
  `repositoryRoot` indirection in five fixture tests collapsed (the
  workspace root IS the repository root now); docs' `cd serfbound`
  steps removed.

## Verification artifacts

All gates ran inside the export tree before the push:

```text
npm run test:unit -> # tests 208 / pass 208 / fail 0
npx playwright test -> 13 passed (1.2m)
npm run check:boundaries -> serfbound-boundaries-ok
npm run test:docs -> serfbound-docs-ok
npm run test:release:static -> serfbound-static-hosting-ok
find: no *.cs / *.csproj / *.sln anywhere in the tree
gh repo create karolswdev/serfbound --public --source . --push
  -> new branch main pushed
```

## Deviations from plan

- Historical evidence artifacts (PNGs/JSON measurements) stay in the
  archive repository: 127MB of binary history would bloat the fresh
  repo for no functional gain. The evidence markdown that cites them
  moves; the archive link in the new README covers retrieval.
- Two path rewrites needed second passes (a multiline `repositoryRoot`
  URL indirection and one double-reduced fixture path) — both caught by
  the in-export gate run, which is why the gates run before the push.

## Follow-ups

- SB-24-03 verifies CI and Pages by real runs in the new repository.
