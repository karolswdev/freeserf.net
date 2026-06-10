# SB-9-02 — Define Static Hosting Release Path

- **Project:** serfbound
- **Phase:** 9
- **Status:** done
- **Depends on:** SB-2-04, SB-9-01
- **Unblocks:** SB-9-04
- **Owner:** unassigned

## Problem

Serfbound should release like a browser product. The hosting path must not
introduce a desktop runtime, server dependency for normal play, or bundled
original assets.

## Scope

- **In:** Static build artifact, hosting target decision, asset import behavior
  under hosted origin, cache/update policy, and release artifact inspection.
- **Out:** Desktop installers, server-side asset hosting, accounts, cloud saves,
  or production operations beyond first release path.

## Acceptance criteria

- [x] Static build artifact can be produced.
- [x] Artifact contains no original game data and no .NET/desktop runtime.
- [x] Hosted-origin behavior for file import and storage is documented.
- [x] Cache/update strategy is documented enough for player troubleshooting.
- [x] Release path names exact commands.

## Test plan

- **Unit:** Run static build command.
- **Integration / Cypress:** Serve built artifact locally and run browser smoke
  test.
- **Manual / device:** Inspect build output for forbidden artifacts.
- **Design handoff:** n/a - packaging evidence.

## Notes / open questions

Static hosting is the release path. The artifact is `serfbound/dist/`, built by
`npm run release:static`, verified by `npm run test:release:static`, and
documented in `serfbound/docs/static-hosting-release.md`.
