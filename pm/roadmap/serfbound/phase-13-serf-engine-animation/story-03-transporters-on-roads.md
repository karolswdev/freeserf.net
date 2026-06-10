# SB-13-03 — Transporters Move Resources Along Roads

- **Project:** serfbound
- **Phase:** 13
- **Status:** done
- **Depends on:** SB-13-02
- **Unblocks:** SB-13-04
- **Owner:** unassigned

## Problem

Transporters are the economy's bloodstream: assigned to road segments, they
wait at flags, pick up queued resources by priority, and hand them across the
graph. Flag resource queues and transporter states make roads functional.

## Scope

- **In:** Flag resource slots/queues, transporter assignment to roads,
  pickup/delivery states with carrying animations per resource, and transport
  priority rules.
- **Out:** Production/consumption of resources (Phase 14 — this phase seeds
  test resources from the castle stock).

## Acceptance criteria

- [x] Transport scenarios match reference fixtures (which resource moves
  when, over which edges).
- [x] Carrying serfs render the correct resource-carry animation frames.
- [x] Roads visibly carry seeded resources castle → building site.

## Test plan

- **Unit:** Queue/priority fixture parity.
- **Integration / Cypress:** Browser test asserts a delivery completes.
- **Manual / device:** Real-data capture of transporters working.
- **Design handoff:** Screenshots under phase artifacts.

## Notes / open questions

- Preserves: reference flag queue sizes and priority order.
- Browser boundary: none new.
- .NET reference use: read-only porting reference.
- Phase gate advanced: roads become logistics.
