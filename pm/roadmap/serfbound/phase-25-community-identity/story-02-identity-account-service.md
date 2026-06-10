# SB-25-02 — Identity Decision and Account Service

- **Project:** serfbound
- **Phase:** 25
- **Status:** backlog
- **Depends on:** SB-25-01
- **Unblocks:** SB-25-03
- **Owner:** unassigned

## Problem

Hosted identity is a posture change for a zero-telemetry project. Before
any code: a decision record naming what an account is for (stable
identity across devices, ladder integrity), the auth mechanism, exactly
what is stored, retention/deletion, and what is never stored. Then a
minimal service implementing exactly that.

## Scope

- **In:** The identity decision record, a minimal account service
  (deployment story recorded), client linking of the local profile to an
  account, account deletion end-to-end, data-minimization contract tests
  pinning the stored schema to the record.
- **Out:** Matchmaking (SB-25-03), any profile data beyond the record.

## Acceptance criteria

- [ ] The decision record ships before/with the service and the stored
  schema matches it exactly (contract-tested).
- [ ] Sign-in links a local profile; sign-out and accountless play lose
  nothing.
- [ ] Account deletion removes server-side data verifiably.

## Test plan

- **Unit:** Service API and schema contract tests in CI.
- **Integration / e2e:** Link/unlink/delete flows against a local
  service instance.
- **Manual / device:** Deployed-service smoke recorded in evidence.
- **Design handoff:** Decision record + auth UX screenshots.

## Notes / open questions

- Preserves: accountless play as first-class; privacy posture from
  Phase 20.
- Browser boundary: network (auth flows).
- .NET reference use: none.
- Phase gate advanced: exit criterion 2.
