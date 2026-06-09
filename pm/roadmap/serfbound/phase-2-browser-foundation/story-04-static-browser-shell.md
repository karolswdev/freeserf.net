# SB-2-04 — Prove Static Browser App Shell

- **Project:** serfbound
- **Phase:** 2
- **Status:** backlog
- **Depends on:** SB-2-01, SB-2-02
- **Unblocks:** SB-5-03, SB-6-03, SB-9-02
- **Owner:** unassigned

## Problem

"Pure browser" needs proof early. A static app shell demonstrates that normal
play can start from browser-delivered assets without a desktop app, native
launcher, or hidden local executable.

## Scope

- **In:** Minimal app shell, local dev server or static preview command, browser
  smoke test, and visible state proving the app loaded.
- **Out:** Game rendering, data import, full UI, desktop packaging, or release
  hosting.

## Acceptance criteria

- [ ] A browser shell page loads from the chosen workspace.
- [ ] The shell has a smoke test or screenshot proving it renders.
- [ ] The shell does not require original game data.
- [ ] The shell does not require a desktop companion for normal play semantics.
- [ ] The startup path is documented for future agents.

## Test plan

- **Unit:** Run build/test commands from SB-2-02.
- **Integration / Cypress:** Run the chosen browser smoke test.
- **Manual / device:** Open the local browser URL and confirm the app shell
  renders.
- **Design handoff:** n/a - shell only.

## Notes / open questions

A local dev server is acceptable for development. It must not become a normal
play dependency after static packaging.
