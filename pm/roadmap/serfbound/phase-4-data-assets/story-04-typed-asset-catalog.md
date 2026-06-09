# SB-4-04 — Expose Typed Asset Catalog

- **Project:** serfbound
- **Phase:** 4
- **Status:** ready
- **Depends on:** SB-4-02, SB-4-03
- **Unblocks:** SB-5-03, SB-6-03, SB-7-01
- **Owner:** unassigned

## Problem

Rendering, UI, and audio should not consume raw archive offsets directly. They
need a typed catalog that says which resources exist and how later decoders can
request them.

## Scope

- **In:** Catalog types for map ground, objects, serfs, UI/font assets, sound,
  music, availability status, and resource lookup by semantic name.
- **Out:** Full texture atlas generation, full audio decoding, final UI skins,
  or broad asset conversion.

## Acceptance criteria

- [ ] Catalog exposes semantic groups aligned with `Freeserf.Core/Data/Data.cs`.
- [ ] Catalog can be built from generated CI fixtures and local `SPAU.PA`.
- [ ] Missing groups are represented explicitly.
- [ ] Renderer stories can request map and object assets through the catalog.
- [ ] Audio/UI consumers have placeholder catalog paths even if decoding is
  deferred.

## Test plan

- **Unit:** Catalog construction tests with generated fixtures.
- **Integration / Cypress:** Optional local/manual catalog check from imported
  `SPAU.PA`.
- **Manual / device:** Inspect catalog output for local source availability.
- **Design handoff:** n/a - asset API only.

## Notes / open questions

The catalog is an API boundary. Keep raw archive details behind it.
