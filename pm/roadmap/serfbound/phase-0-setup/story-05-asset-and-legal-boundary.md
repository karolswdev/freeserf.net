# SB-0-05 — Define Asset And Legal Boundary

- **Project:** serfbound
- **Phase:** 0
- **Status:** done
- **Depends on:** SB-0-02
- **Unblocks:** SB-2-01, SB-2-02, SB-4-01
- **Owner:** Codex

## Problem

The existing project explicitly does not provide copyrighted original graphics,
music, or data. A browser version must preserve that repository/distribution
boundary while still giving developers and players a practical way to use
locally procured DOS or Amiga files.

## Scope

- **In:** Browser data import model, local/procured asset handling, allowed
  fixtures, Git exclusions, persistence choice, UX requirements for missing
  data, and test-data policy.
- **Out:** Legal advice, distributing original game data, asset conversion
  implementation, or final UI design.

## Acceptance criteria

- [x] Add `pm/roadmap/serfbound/adoption/asset-and-legal-boundary.md`.
- [x] The document quotes or paraphrases the existing repo's data-file
  constraint and maps it to browser behavior.
- [x] The document states which files may be committed, which must be ignored,
  and how local developer/user data is stored.
- [x] The document references
  `pm/roadmap/serfbound/adoption/local-asset-inventory.md` and identifies
  `SPAU.PA` as the current local DOS source for verification.
- [x] The document states that "abandonware" is not a redistribution permission
  for this repo.
- [x] The document chooses an initial import path: upload, drag/drop, directory
  picker, dev fixture, or a staged combination.
- [x] The document records how Phase 4 tests can run without committing
  copyrighted assets.

## Test plan

- **Unit:** n/a - policy/design story.
- **Integration / Cypress:** n/a.
- **Manual / device:** Review `.gitignore` and proposed asset paths for
  consistency with the boundary.

## Notes / open questions

The initial browser UX should probably support user upload/import, directory
picker import, and IndexedDB storage, but this story must check browser support
and developer-test needs before locking that in. Local assets are available;
committed assets are not.
