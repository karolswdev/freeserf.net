# SB-4-04 — Expose Typed Asset Catalog

- **Project:** serfbound
- **Phase:** 4
- **Status:** done
- **Depends on:** SB-4-02, SB-4-03
- **Unblocks:** SB-5-03, SB-6-03, SB-7-01
- **Owner:** Codex

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

- [x] Catalog exposes semantic groups aligned with `Freeserf.Core/Data/Data.cs`.
- [x] Catalog can be built from generated CI fixtures and local `SPAU.PA`.
- [x] Missing groups are represented explicitly.
- [x] Renderer stories can request map and object assets through the catalog.
- [x] Audio/UI consumers have placeholder catalog paths even if decoding is
  deferred.

## Test plan

- **Unit:** Catalog construction tests with generated fixtures.
- **Integration / Cypress:** Optional local/manual catalog check from imported
  `SPAU.PA`.
- **Manual / device:** Inspect catalog output for local source availability.
- **Design handoff:** n/a - asset API only.

## Notes / open questions

Shipped `buildTypedAssetCatalog`, which maps parsed DOS catalog resources into
terrain, objects, serfs, UI, and audio groups. Consumer-facing references use
semantic DOS resource handles and intentionally hide raw archive offsets.

Renderer requests now have named handles for map ground, path ground, map
objects, game objects, and map shadows. UI and audio placeholders expose fonts,
icons, cursor, sound effects, and music while decoding remains deferred.
