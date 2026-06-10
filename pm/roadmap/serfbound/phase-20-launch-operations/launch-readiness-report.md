# Serfbound Launch Readiness Report — serfbound-v0.1.0

**Reviewed:** 2026-06-10, at the release commit on `serfbound/pmo-bootstrap`.

## Standing gates, rerun at this commit

| Gate | Result |
|---|---|
| Boundary checks (`check:boundaries`) | serfbound-boundaries-ok |
| CI unit suites (`test:unit`) | 171 tests, 171 pass, 0 fail |
| Browser suites (`test:browser`) | 9 passed (founding e2e through the authentic UI, mobile touch, PWA offline, shell recovery, error intake) |
| Docs gate (`test:docs`) | serfbound-docs-ok |
| Static hosting (`test:release:static`) | artifact inspected; served at a subpath; IndexedDB restore proven |
| Real-data decode (opt-in, local SPAU.PA) | catalog/oracle parity, palettes, terrain, masks, objects, 200 animations, torsos, 39 SFX, XMI track 0 (10,409 events) |
| Scale baseline (`measure:scale`) | size-6 full sim 2,012,240 ticks/s; scene builds 2.2–2.9 ms |

## Asset/legal boundary at launch

- No original data is committed, hosted, bundled, or cached; the release
  workflow publishes only the app shell; the service worker refuses `.PA`
  caching; imports live in the player's IndexedDB.
- The GPL lineage of freeserf/freeserf.net is respected: this repository
  carries the reference implementation and its license; Serfbound's
  browser rewrite lives in the same repository under the same terms.

## Known limitations at launch (all recorded in phase evidence)

- PYRDACOR mission seed alphabet; real original `.SAV` corpus evidence;
  live browser conquest awaits visible AI war UI; polish backlog
  (pinch-zoom, mission list, volume steppers, music looping).

## Go decision

**Go.** Every exit criterion of phases 0–20 is checked with on-disk
evidence; the release pipeline is verified end to end; activation is the
repository's one-time Pages settings toggle plus the `serfbound-v0.1.0`
tag.
