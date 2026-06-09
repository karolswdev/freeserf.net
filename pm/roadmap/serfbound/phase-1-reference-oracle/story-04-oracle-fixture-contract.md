# SB-1-04 — Define Oracle Fixture Contract

- **Project:** serfbound
- **Phase:** 1
- **Status:** ready
- **Depends on:** SB-1-02, SB-1-03
- **Unblocks:** SB-2-02, SB-3-04, SB-4-02
- **Owner:** unassigned

## Problem

Reference outputs only help if later phases can consume them consistently.
Serfbound needs a fixture contract that separates CI-safe facts from local-only
asset checks and prevents reference tooling from becoming product architecture.

## Scope

- **In:** Fixture directory policy, schema/version fields, checksum rules,
  local-only markers, command naming, and product-code import restrictions.
- **Out:** Full parser implementation, browser test runner implementation, or
  large fixture capture.

## Acceptance criteria

- [ ] `pm/roadmap/serfbound/adoption/oracle-fixture-contract.md` exists.
- [ ] The contract defines where CI-safe fixtures live.
- [ ] The contract defines where local/manual outputs live or how they are
  ignored.
- [ ] The contract forbids product code importing .NET capture helpers.
- [ ] The contract includes validation rules for fixture schema version,
  checksum, source target, and local-data requirement.

## Test plan

- **Unit:** n/a - contract artifact.
- **Integration / Cypress:** n/a.
- **Manual / device:** Review SB-1-02 and SB-1-03 outputs against the contract.
- **Design handoff:** n/a - non-visual.

## Notes / open questions

This contract should be boring and strict. Later phases should not invent new
fixture conventions unless they update this file.
