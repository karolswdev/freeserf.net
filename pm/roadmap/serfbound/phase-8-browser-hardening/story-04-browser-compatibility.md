# SB-8-04 — Verify Browser Compatibility

- **Project:** serfbound
- **Phase:** 8
- **Status:** ready
- **Depends on:** SB-8-01, SB-8-02, SB-8-03
- **Unblocks:** SB-9-04
- **Owner:** unassigned

## Problem

The app must work as a browser product, not just on one development machine.
Compatibility evidence should cover rendering, file import, storage, input, and
performance enough to set release expectations.

## Scope

- **In:** Browser matrix, desktop/mobile checks, import/storage support,
  renderer support, input notes, performance snapshot, and known limitations.
- **Out:** Supporting every old browser, desktop packaging, or full accessibility
  certification.

## Acceptance criteria

- [ ] Compatibility matrix exists with Chrome, Firefox, Safari/WebKit, and mobile
  browser positions.
- [ ] Matrix records renderer, file import, storage, and input status.
- [ ] Blocking incompatibilities have stop signals or release notes.
- [ ] At least one automated browser check contributes evidence.
- [ ] Manual checks include browser/version metadata.

## Test plan

- **Unit:** Run default unit/parity tests.
- **Integration / Cypress:** Run configured browser smoke tests.
- **Manual / device:** Execute compatibility script on available browsers.
- **Design handoff:** Screenshot evidence for major browser/device classes when
  visual behavior differs.

## Notes / open questions

Compatibility can be scoped. It cannot be guessed.
