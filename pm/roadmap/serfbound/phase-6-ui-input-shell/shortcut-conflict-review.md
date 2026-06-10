# Phase 6 Shortcut Conflict Review

**Project:** Serfbound
**Phase:** 6
**Status:** browser-safe bindings deferred until Phase 7 action panels.

Phase 6 intentionally avoids global keyboard shortcuts. The command router
already supports `source: "keyboard"`, but no key binding should ship until the
visible Phase 7 actions define exact intent and focus behavior.

## Browser-Reserved Or High-Risk Keys

| Key pattern | Browser conflict | Phase 6 decision |
|---|---|---|
| `Ctrl+R`, `Cmd+R`, `F5` | Reload page | Never bind. |
| `Ctrl+L`, `Cmd+L`, `Alt+D` | Address bar focus | Never bind. |
| `Ctrl+F`, `Cmd+F` | Find in page | Never bind. |
| `Ctrl+W`, `Cmd+W` | Close tab/window | Never bind. |
| `Ctrl+T`, `Cmd+T`, `Ctrl+N`, `Cmd+N` | New tab/window | Never bind. |
| `Ctrl+S`, `Cmd+S` | Save page | Do not bind for gameplay. |
| `Space` | Page scroll / button activation | Bind only when focus is inside a game-controlled canvas/action mode. |
| Arrow keys | Page scroll / text cursor movement | Bind only when a game mode has focus and visible escape/release behavior. |
| `Tab`, `Shift+Tab` | Focus navigation | Preserve browser focus navigation. |
| `Esc` | Dialog/fullscreen/browser escape behavior | Use only for closing in-app overlays; never require it for core play. |
| Printable letters | Text input and assistive technology expectations | Bind only when no text entry/control focus is active. |

## Phase 7 Candidate Bindings

| Game intent | Candidate binding | Rationale |
|---|---|---|
| Inspect selected tile | Click/tap primary; optional `Enter` when canvas/action has focus | Matches current Phase 6 selection model. |
| Open build actions | Visible button first; optional `B` only inside focused game mode | Avoids global `B` stealing typing. |
| Cancel selected action | Visible cancel button first; optional `Esc` only for overlay/action cancel | Keeps browser escape behavior predictable. |
| Move map/camera | Pointer drag or visible controls first; arrow keys only in focused game mode | Prevents page scroll conflicts. |

## Decision

No global keyboard shortcut blocks Phase 7. Phase 7 may add scoped keyboard
bindings only after the UI exposes a focusable game/action mode and proves that
browser navigation, find, reload, text editing, and focus traversal still work.
