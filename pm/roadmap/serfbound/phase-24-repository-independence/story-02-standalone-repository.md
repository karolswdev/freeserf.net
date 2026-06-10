# SB-24-02 — Create and Populate the Standalone Repository

- **Project:** serfbound
- **Phase:** 24
- **Status:** backlog
- **Depends on:** SB-24-01
- **Unblocks:** SB-24-03
- **Owner:** unassigned

## Problem

Execute the extraction: create the repository with `gh`, build the
export tree per the inventory (the workspace at the repository root,
the PMO record, workflows, conventions), write the standalone
README/LICENSE/attribution, and prove the full local gate set in the
export before the first push.

## Scope

- **In:** `gh repo create`, the export tree assembly (workspace
  promoted to the root, paths adjusted), standalone README with the
  GPL-3.0 license and derivation notice, .gitignore/local-data
  conventions carried over, the full local gate run inside the export
  tree, the provenance-stamped initial commit, the push.
- **Out:** CI/Pages activation in the new repo (SB-24-03).

## Acceptance criteria

- [ ] The repository exists under the recorded name/visibility with
  LICENSE (GPL-3.0) and the derivation notice in the README.
- [ ] The full local gate set passes inside the export tree before the
  push (unit, browser, boundaries, docs, static).
- [ ] No .NET file exists anywhere in the pushed tree.

## Test plan

- **Unit:** The export tree's own `npm run test:unit`.
- **Integration / e2e:** The export tree's `npx playwright test`.
- **Manual / device:** n/a.
- **Design handoff:** The new repository URL in the evidence.

## Notes / open questions

- Preserves: GPL continuity, the asset boundary, the PMO record.
- Browser boundary: none new.
- .NET reference use: none.
- Phase gate advanced: exit criterion 2.
