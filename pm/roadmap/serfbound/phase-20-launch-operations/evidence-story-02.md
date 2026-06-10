# Evidence — SB-20-02 — Error Reporting and Issue Intake

- **Shipped:** 2026-06-10
- **Commit:** pending
- **Owner:** Claude

## Files touched

- `serfbound/packages/app/src/main.ts` — privacy-respecting error
  intake: runtime errors and unhandled rejections buffer locally (a ring
  of ten, message + trimmed stack + time); the "Copy error report"
  button builds a JSON report (product, version, user agent, game facts
  like tick/seed/map size/mission/scene source, the buffered errors, and
  an explicit no-game-data note) and copies it to the clipboard ONLY on
  the player's action — the game sends nothing on its own, ever.
- `.github/ISSUE_TEMPLATE/serfbound-bug-report.md` — the intake
  template: what happened, the pasted report, the device facts.
- `serfbound/docs/player-guide.md` — the "Reporting problems" section.
- `serfbound/tests/browser/static-shell.spec.ts` — the intake e2e: a
  forced runtime error lands in the buffer, the copy action produces a
  parseable report carrying the error and the version, and the report
  contains no archive references.

## Verification artifacts

```text
npx playwright test (intake test) -> 1 passed
npm run test:browser -> 9 passed (2.5m)
npm run test:unit -> # tests 171 / pass 171 / fail 0
npm run test:docs -> serfbound-docs-ok
```

## Deviations from plan

- No telemetry of any kind ships — even opt-in transmission is deferred
  in favor of the copy-paste flow, which is fully inspectable by the
  player before anything leaves the device. Recorded as the intake
  decision.

## Follow-ups

- SB-20-03: the full-game documentation refresh.
