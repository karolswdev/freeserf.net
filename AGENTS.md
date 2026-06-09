# Agent Notes

## Serfbound Direction

This repository now carries a Delivery Workbench roadmap for `Serfbound`, the
browser-native rewrite track for `freeserf.net`.

Start here:

- `pm/roadmap/serfbound/README.md`
- `pm/roadmap/serfbound/phase-0-setup/current-phase-status.md`
- `pm/roadmap/serfbound/adoption/session-intake.md`

Treat the existing C# code as the behavioral reference implementation. The
target product runtime is browser-native; .NET may be useful as a temporary
oracle for parity evidence, but it is not the intended shipping runtime.

The roadmap is gate-based, not vibe-based. Do not skip from discovery to engine
code. The intended sequence is reference oracle, browser foundation, simulation,
data/assets, renderer, UI/input, playable slice, browser hardening, then release
operations.

Hard constraints:

- Final Serfbound product code is not .NET.
- Normal play is pure browser: no desktop app, native launcher, local executable,
  or hidden companion process.
- Original DOS/Amiga data may be used locally for development and play, but must
  not be committed, hosted, bundled, or redistributed by this repo.

Current local asset inventory:

- `pm/roadmap/serfbound/adoption/local-asset-inventory.md`
- Local files live under ignored `serfbound-local-data/sources/`.
- The current loader-relevant DOS file is `SPAU.PA`.

## PMO Hygiene Gate

This repo uses Delivery Workbench / `pmo-roadmap`. Before every commit:

1. Write `.tmp/CONTRACT.md` from `pm/roadmap/PMO-CONTRACT.md`.
2. Check every rule honestly for the staged change.
3. Keep story, phase status, and evidence files in sync with the work shipped.

The pre-commit hook validates the contract and deletes it after a successful
commit. If the hook blocks a commit, read its stderr and fix the named issue.

## Git Remotes

This checkout is fork-based:

- `upstream` is `https://github.com/Pyrdacor/freeserf.net.git` and has push
  disabled.
- `origin` is `https://github.com/karolswdev/freeserf.net.git`.
- Serfbound work should happen on `serfbound/*` topic branches and push to
  `origin`.

Current bootstrap branch:

```bash
git switch serfbound/pmo-bootstrap
git push
```

One-time setup per fresh clone:

```bash
git config core.hooksPath .githooks
```
