# SB-0-04 — Design Deterministic Parity Harness

- **Project:** serfbound
- **Phase:** 0
- **Status:** done
- **Depends on:** SB-0-02, SB-0-03
- **Unblocks:** SB-1-01, SB-1-02, SB-1-03
- **Owner:** Codex

## Problem

A rewrite without parity evidence will silently become a different game.
Serfbound needs a small, repeatable way to capture reference behavior from
`freeserf.net` and compare browser implementation output against it.

## Scope

- **In:** Identify the first reference captures, output formats, fixture policy,
  commands, tolerance rules, and how the browser-side tests consume them.
- **Out:** Implementing the harness, porting game logic, or requiring original
  copyrighted data in the repo.

## Acceptance criteria

- [x] Add `pm/roadmap/serfbound/adoption/parity-harness-design.md`.
- [x] The design names the first three parity targets, with source files and
  expected output shape.
- [x] The design distinguishes data-free tests from tests requiring
  user-provided original data.
- [x] The design defines where generated reference outputs may live and what
  must be excluded from Git.
- [x] The design includes at least one map/generator target and one state/tick
  or serialization target.

## Test plan

- **Unit:** n/a - harness design story.
- **Integration / Cypress:** n/a.
- **Manual / device:** Verify every proposed parity target maps back to real
  source files in `Freeserf.Core`.

## Notes / open questions

Early parity should favor stable, text or JSON-like outputs over screenshots.
Rendering screenshots matter later, but game-rule drift is the first risk.
