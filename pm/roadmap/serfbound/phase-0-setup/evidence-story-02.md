# Evidence — SB-0-02 — Inventory Reference Architecture

- **Shipped:** 2026-06-09
- **Commit:** pending
- **Owner:** Codex

## Files touched

- `pm/roadmap/serfbound/adoption/reference-architecture-inventory.md` - new
  source-grounded architecture inventory.
- `pm/roadmap/serfbound/README.md` - adds the inventory to source canon.
- `pm/roadmap/serfbound/phase-0-setup/story-02-reference-architecture-inventory.md`
  - marks SB-0-02 done and checks acceptance criteria.
- `pm/roadmap/serfbound/phase-0-setup/current-phase-status.md` - marks the
  source-inventory exit criterion and story table row complete.

## Verification artifacts

- Source project inspection:
  - `sed -n '1,220p' Freeserf.Core/Freeserf.Core.csproj`
  - `sed -n '1,220p' Freeserf.Renderer/Freeserf.Renderer.csproj`
  - `sed -n '1,220p' Freeserf.Audio/Freeserf.Audio.csproj`
  - `sed -n '1,220p' Freeserf.Network/Freeserf.Network.csproj`
  - `sed -n '1,220p' FreeserfNet/FreeserfNet.csproj`
  - `sed -n '1,220p' Silk.NET.Window/Silk.NET.Window.csproj`
  - `sed -n '1,220p' Freeserf.Test/Freeserf.Test.csproj`
- Source structure and symbol inspection:
  - `find . -maxdepth 2 -type d | sort`
  - `rg -n "class (Game|Map|MapGenerator|Savegame|GameState|DataSourceDos|DataSourceAmiga|DataSourceMixed)|interface IRender|class Render|class MainWindow|class GameView|class Audio|class Server|class Client|class Window" Freeserf.Core Freeserf.Renderer Freeserf.Audio Freeserf.Network FreeserfNet Silk.NET.Window`
- Risk/assumption inspection:
  - `rg -n "TODO|missing|Missing|Current State|FileSystem|Directory|Path|File\\.|DynamicLibrary|Bass|Silk|OpenGL|Window|Mouse|Keyboard" README.md Issues.md Configuration.md Freeserf.Core Freeserf.Renderer Freeserf.Audio Freeserf.Network FreeserfNet Silk.NET.Window`
  - `sed -n '1,220p' Issues.md`
  - `sed -n '1,220p' Freeserf.Network/Multiplayer.md`
  - `sed -n '1,180p' Freeserf.Network/ToDo.md`
- Existing test coverage inspection:
  - `sed -n '1,220p' Freeserf.Test/Freeserf.Core/Serialize/StateSerializerTests.cs`
- PMO/roadmap structural checks:
  - `test -f pm/roadmap/serfbound/adoption/reference-architecture-inventory.md && rg -n "...required inventory terms..." pm/roadmap/serfbound/adoption/reference-architecture-inventory.md` -> required coverage terms found.
  - Story required-section scan over `pm/roadmap/serfbound/phase-*/*story-*.md` -> passed with no output.
  - `bash -n .githooks/pre-commit .githooks/post-commit .githooks/work-log-read .githooks/work-log-summarize` -> passed with no output.
- Attempted source test baseline:
  - `dotnet test Freeserf.Test/Freeserf.Test.csproj` -> not run; shell returned `zsh:1: command not found: dotnet`.
  - `command -v dotnet || true; ls /usr/local/share/dotnet/dotnet /opt/homebrew/bin/dotnet 2>/dev/null || true` -> no `dotnet` binary found.

## Acceptance criteria — re-checked

- [x] `pm/roadmap/serfbound/adoption/reference-architecture-inventory.md` exists
  — created in this story.
- [x] The inventory has a table with columns: subsystem, source files, current
  responsibility, browser fate, first parity evidence — proven by Inventory
  Table.
- [x] The inventory explicitly covers `Game.cs`, `Map.cs`, `MapGenerator.cs`,
  `Savegame.cs`, `GameState.cs`, `DataSourceDos.cs`, `DataSourceAmiga.cs`,
  `Render/*`, `Freeserf.Renderer/*`, `Freeserf.Audio/*`, and `FreeserfNet/*` —
  proven by the named rows in Inventory Table.
- [x] The inventory identifies at least five desktop assumptions that need
  browser replacements — proven by Desktop Assumptions To Replace, which lists
  ten.
- [x] The inventory marks at least three deterministic outputs suitable for
  parity capture in SB-0-04 — proven by First Deterministic Oracle Candidates,
  which lists five.

## Residual risk

This story does not choose the runtime stack, implement oracle capture, or prove
parity. Those remain SB-0-03, SB-0-04, and Phase 1 work. The existing .NET test
suite could not be executed in this environment because the `dotnet` CLI is not
installed or not on `PATH`; later source-oracle work should run it in an
environment with the SDK available.
