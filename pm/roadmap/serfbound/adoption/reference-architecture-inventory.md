# Serfbound Reference Architecture Inventory

**Last updated:** 2026-06-09.
**Story:** SB-0-02.
**Status:** Phase 0 inventory baseline.

## Purpose

Map the existing `freeserf.net` source tree to Serfbound rewrite concerns before
implementation starts. This file distinguishes behavior to preserve, platform
edges to replace, temporary reference-oracle code, and desktop-only behavior to
drop.

Serfbound's final product remains pure browser: no .NET runtime, no desktop
shell, no native launcher, and no hidden companion process.

## Inventory Table

| Subsystem | Source files | Current responsibility | Browser fate | First parity evidence |
|---|---|---|---|---|
| Project/runtime composition | `FreeserfNet.sln`, `*.csproj` files | net9.0 solution with core, renderer, audio, network, desktop shell, Silk window wrapper, and MSTest project. Product projects depend on Silk.NET, ManagedBass, ImageSharp, GLFW, OpenGL, and BASS native libraries. | Use as source map only. Final product workspace must be web-native and dependency-audited for no .NET/desktop/runtime artifacts. | SB-0-03 runtime decision plus Phase 2 dependency manifest audit. |
| Game simulation core | `Freeserf.Core/Game.cs`, `Building.cs`, `Flag.cs`, `Inventory.cs`, `Player.cs`, `Serf.cs`, `Objects.cs`, `Resource.cs`, state files | Owns gameplay state, tick advancement, map updates, players, serfs, flags, buildings, inventories, roads, morale, stats, save/read/write integration, render object creation hooks, and audio triggers. `Game.Update()` advances tick/time, map, players, serfs, flags, buildings, inventories, borders, and stats. | Preserve semantics through a browser-native engine boundary. Do not preserve direct render/audio references as product coupling; replace them with command/event outputs. | Data-free tick/state snapshot after deterministic setup; later visible action state diff for Phase 7. |
| Map model and geometry | `Freeserf.Core/Map.cs`, `MapGeometry.cs`, `CoordinateSpace.cs`, `Position.cs`, `Rect.cs`, `Size.cs`, `Iterator.cs`, `Layer.cs` | Encodes map positions, directions, wraparound geometry, terrain/objects/resources, coordinate transforms, and map-to-view/tile calculations. `CoordinateSpace` documents projection and wrap rules. | Port early as deterministic engine primitives and shared renderer/input math. Keep DOM/canvas out of core map logic. | Direction cycle, map position, tile/view transform fixture; selected map geometry JSON fixture. |
| Map generation | `Freeserf.Core/MapGenerator.cs`, `Mission.cs`, `Random.cs` | Generates or loads maps from seeds/missions and uses custom 16-bit RNG. `Random.Next()` mutates three `ushort` state values with wrapping/rotation behavior. | Treat as high-priority parity domain. Implement numeric semantics explicitly in TypeScript/Rust/WASM, with oracle output before porting. | RNG sequence fixture from fixed seeds; map generator summary fixture with seed/size/height/resource checksum. |
| Serialization and dirty state | `Freeserf.Core/Serialize/*`, `GameState.cs`, `BuildingState.cs`, `FlagState.cs`, `InventoryState.cs`, `PlayerState.cs`, `SerfState.cs`, `Freeserf.Test/Freeserf.Core/Serialize/*` | Attribute-driven binary state serialization, dirty arrays/maps, full and partial game sync, collection ordering. Existing tests cover generic state serializer behavior and `FlagState`. `GameStateSerializer` writes game, players, inventories, buildings, flags, and serfs in fixed order. | Use as reference for Serfbound save/state and parity fixtures. Browser product can use its own format, but deterministic state snapshots must be explicit and migration-ready. | CI-safe serializer fixture from existing test states; game-state collection order/checksum fixture when minimal game setup exists. |
| Savegame store | `Freeserf.Core/Savegame.cs`, `GameManager.cs`, `UI/Interface.cs` | Text and legacy binary savegame parsing/writing, quicksave naming, filesystem-backed save folder, UI triggers for quick save/load. | Browser save/load must be implemented with browser storage and versioned Serfbound state. Original savegame compatibility is deferred; save parsing is an oracle candidate, not first product dependency. | Save writer/read round-trip of a minimal state; later browser save/load round-trip in Phase 7. |
| Data-source selection | `Freeserf.Core/Data/Data.cs`, `DataSourceMixed.cs`, `UserConfig.cs`, `Configuration.md` | Searches provided and standard filesystem paths, chooses DOS/Amiga sources by `DataUsage`, requires graphics, defaults to DOS graphics/sound and Amiga music preference. | Replace filesystem search/config with browser import and local persistence. Preserve source-selection semantics where useful, but direct browser import should be explicit and recoverable. | Data-source availability matrix from generated fixture and local `SPAU.PA` metadata. |
| DOS asset parsing | `Freeserf.Core/Data/DataSourceDos.cs`, `Buffer.cs`, `Converter.cs`, `DataSourceLegacy.cs` | Detects `SPAE.PA`, `SPAF.PA`, `SPAD.PA`, `SPAU.PA`; optionally unpacks TPWM archive; reads entry table; decodes DOS sprites, palettes, sounds, XMI music. | Phase 4 browser parser target. Start with catalog metadata, then decode assets behind typed catalog. Local `SPAU.PA` is available but ignored by Git. | Local/manual `SPAU.PA` metadata fixture: checksum, entry count, selected resource info; CI generated fake `.PA` parser tests. |
| Amiga asset parsing | `Freeserf.Core/Data/DataSourceAmiga.cs`, `DataSourceLegacy.cs` | Reads Amiga disk/extracted data, palettes, graphics, sounds, and music alternatives. README says Amiga music/sounds work well but map tiles are not displayed properly. | Defer behind DOS-first path unless Phase 4 discovers blocker. Keep inventory for future compatibility; do not make first playable depend on Amiga. | Availability/parsing smoke only after DOS source path works. |
| Resource catalog | `Freeserf.Core/Data/Data.cs`, `Resource.cs`, `DataSource.cs` | Defines resource names/counts for landscape, animation, flags, UI, map objects, shadows, serf torso/head, sounds, music, cursor, and custom UI assets. | Preserve semantic catalog boundary. Browser renderer/audio/UI should consume typed catalog, not raw archive offsets. | Catalog JSON fixture with resource group names/counts and selected availability flags. |
| Render abstraction in core | `Freeserf.Core/Render/*`, `Rendering.txt`, render object classes | Defines `IRenderView`, layers, sprite/triangle factories, texture atlas contracts, render map/object wrappers, text rendering, and virtual-screen assumptions. Gameplay currently creates render objects in `Game.cs` and `Map.cs`. | Split concerns. Preserve concepts such as layers, virtual screen, and coordinate conversion where useful; remove direct engine dependence on sprite factories in product architecture. | Layer inventory and projection fixture; renderer can replay engine state without mutating simulation. |
| OpenGL renderer | `Freeserf.Renderer/*` | Silk.NET/OpenGL implementation of textures, shaders, buffers, render layers, sprites, triangles, colored rects, and atlas building. | Replace with browser renderer. Use as behavioral/reference design for batching/layers/texture atlas, not as code to port line-for-line. | Phase 5 renderer decision; nonblank browser map screenshot/pixel evidence. |
| Desktop game view | `FreeserfNet/GameView.cs` | Implements `IRenderView`, audio interface, and network handler; creates OpenGL context, texture atlases, render layers, audio factory, scaling transforms, virtual screen, cursor, event dispatch. | Replace with browser app shell split across renderer, UI/input, audio, and persistence modules. Do not retain all-in-one view coupling. | Browser app shell and render-layer scene; pointer-to-map conversion checks. |
| Window/input wrapper | `Silk.NET.Window/*`, `FreeserfNet/MainWindow.cs` | Wraps Silk windowing/GLFW, monitors, fullscreen/window state, keyboard, mouse, scroll, resize, render/update loop, icon, logging, and config. | Drop as product code. Replace with DOM/canvas events, browser fullscreen APIs, resize observers, pointer/keyboard handlers, and requestAnimationFrame loop. | Browser input smoke tests and interaction ergonomics evidence. |
| Audio abstraction and BASS implementation | `Freeserf.Core/Audio/*`, `Freeserf.Audio/*`, `FreeserfNet/bass/*` | Core defines audio interfaces; BASS/ManagedBass plays MIDI, MOD, SFX/WAV, uses embedded soundfont and native libraries. | Replace playback with WebAudio and browser-safe decoders. Keep source data parsing behavior as reference; do not ship BASS/native libraries. | Audio catalog availability fixture; later generated/local WebAudio playback smoke. |
| UI and view controllers | `Freeserf.Core/UI/*`, `Viewer.cs`, `Viewers/*`, `GameManager.cs` | In-game panels, setup boxes, minimap, notifications, viewport, server/client/local viewers, game lifecycle orchestration, quicksave/load calls. | Rebuild as browser UI shell. Preserve command semantics and state flow where needed; do not port desktop widget framework directly. | UI state-flow smoke: missing data, imported data, running game, selected tile/action. |
| Network/multiplayer | `Freeserf.Core/Network/*`, `Freeserf.Network/*`, `Freeserf.Network/Multiplayer.md`, `ToDo.md` | Client/server, heartbeat, lobby, requests/responses, sync data, dirty-state sync, in-sync timing, multiplayer TODOs. | Out of first playable scope. Keep sync serializer concepts as future oracle candidates; do not block local single-player browser path. | Later multiplayer design gate; for now inventory-only. |
| Desktop config, files, logs | `Configuration.md`, `CommandLine.cs`, `ConfigFile.cs`, `UserConfig.cs`, `FileSystem/*`, `Log.cs`, `FreeserfNet/Program.cs`, `MainWindow.cs` | Command-line args, user config file, platform app-data paths, log file, executable path, standard data search paths, quicksave folders, dynamic library resolution. | Replace with browser settings, IndexedDB/localStorage, import metadata, in-app diagnostics, and no normal-play local executable. | Browser persistence/recovery tests; import metadata survives reload. |
| Tests | `Freeserf.Test/*`, `.github/workflows/*` | MSTest project currently focused on generic serialization/state behavior. Appveyor/GitHub workflow context exists but is not Serfbound-specific. | Reuse as reference-oracle inspiration. Serfbound CI must be data-free and browser-native; .NET tests may exist only as isolated oracle tooling. | Phase 1 data-free oracle fixture and Phase 2 CI-safe browser test spine. |
| Known gaps and non-goals | `README.md`, `Issues.md`, `Freeserf.Network/ToDo.md` | Upstream notes mention multiplayer work, minor AI/tutorial gaps, missing end screens/intro/outro/tutorial targets, AI/game-logic issues, and network sync TODOs. | Do not absorb into first browser playable. Record as future backlog after local pure-browser slice. | Phase 7 limitation notes; release known limitations in Phase 9. |

## Desktop Assumptions To Replace

1. **Executable-relative data loading:** `MainWindow` loads data from
   `Program.ExecutablePath`, and `Data.Load` searches filesystem paths. Browser
   replacement: explicit file/directory import plus local persistence.
2. **Platform user config files:** `Configuration.md`, `UserConfig`, and
   `FileSystem.Paths` assume app-data/user-config paths. Browser replacement:
   local browser storage with reset/recovery flows.
3. **Native window lifecycle:** `Silk.NET.Window.Window` owns monitors, window
   size, fullscreen state, minimize/maximize, icon, resize, render/update loop.
   Browser replacement: DOM/canvas sizing, Fullscreen API, visibility events,
   and `requestAnimationFrame`.
4. **GLFW/Silk input:** keyboard, mouse, scroll, precise mouse movement, and
   emulated inputs are delivered through Silk/GLFW. Browser replacement:
   pointer, keyboard, wheel, touch/trackpad handling with browser shortcut
   conflict policy.
5. **OpenGL renderer:** `Freeserf.Renderer` depends on Silk.NET.OpenGL,
   shaders, buffers, and native GL context. Browser replacement: Canvas2D,
   WebGL2, WebGPU, or library-backed browser renderer chosen by Phase 5.
6. **BASS native audio:** `Freeserf.Audio` and `FreeserfNet/bass` depend on
   ManagedBass and native BASS binaries. Browser replacement: WebAudio and
   browser-safe decoding path.
7. **Filesystem saves/logs:** `Savegame`, `GameStore`, `LogFileStream`, and
   quicksave calls write to filesystem paths. Browser replacement: versioned
   browser persistence and in-app diagnostics.
8. **Dynamic native library resolution:** `Program.cs` configures
   `NativeLibrary.SetDllImportResolver` and loads native libraries from the
   executable path. Browser replacement: none in product code; avoid native
   dependencies entirely.
9. **Desktop network process model:** `Freeserf.Network` assumes client/server
   connections inside the desktop app lifecycle. Browser replacement is deferred
   and should not block local single-player.
10. **All-in-one view coupling:** `GameView` combines render view, audio,
    network data handler, GUI, texture atlas, cursor, and scaling. Browser
    replacement should split app shell, renderer, audio, input, and engine
    boundaries.

## First Deterministic Oracle Candidates

| Candidate | Source | CI-safe? | Output shape | Why it matters |
|---|---|---:|---|---|
| RNG fixed-seed sequence | `Freeserf.Core/Random.cs` | yes | JSON/text list of state and `Next()` outputs for fixed seeds | Protects deterministic simulation and map generation numeric semantics. |
| Direction and map geometry facts | `MapGeometry.cs`, `CoordinateSpace.cs` | yes, with synthetic/minimal map setup if feasible | JSON rows of direction turns/reverses and coordinate transform samples | Protects Phase 3 engine primitives and Phase 5/6 projection/input work. |
| State serializer fixture | `Serialize/*`, `GameState.cs`, `Freeserf.Test/Freeserf.Core/Serialize/*` | yes | Hex/checksum plus decoded metadata for existing test states | Protects save/state, dirty-state, and future sync semantics. |
| DOS resource catalog metadata | `DataSourceDos.cs`, `Data.cs`, local `SPAU.PA` | local/manual | Metadata only: `SPAU.PA` checksum, entry count, selected resource group availability/counts | Protects Phase 4 browser parser without committing original assets. |
| Minimal game tick snapshot | `Game.cs`, `Map.cs`, `GameState.cs` | maybe, if constructed without original data/rendering | JSON/state checksum after deterministic setup and fixed tick count | Protects first real simulation loop before visual action work. |

## Browser Rewrite Boundaries

- **Engine boundary:** deterministic state, map, simulation, command handling,
  and snapshots. No DOM, Canvas, WebAudio, IndexedDB, or filesystem calls.
- **Asset boundary:** browser file import, local persistence, DOS/Amiga parsing,
  typed asset catalog. No committed original asset bytes.
- **Renderer boundary:** browser rendering API, projection, layers, texture
  upload/cache, viewport framing. Consumes engine state and asset catalog.
- **UI/input boundary:** pointer/keyboard/touch mapping, panels, command routing,
  missing-data states, interaction ergonomics.
- **Audio boundary:** browser playback and decode scheduling. Consumes asset
  catalog; does not use BASS.
- **Persistence boundary:** imported asset storage, save snapshots, migration,
  recovery/reset, browser quota handling.
- **Reference-oracle boundary:** isolated .NET/C# tooling can capture behavior
  for comparison only. Product code must never import it.

## Open Questions For Phase 0 Decisions

- How much original savegame compatibility matters for first release versus a
  new browser-native save format?
- Should map projection be derived directly from `CoordinateSpace` or simplified
  behind a compatibility layer with tests?
- Which DOS resource groups are the minimum for the first visible map scene:
  map ground, objects, shadows, serfs, UI font, or all of them?
- Do we preserve the current UI widget semantics or rebuild only command/state
  flows for the first playable slice?
- When, if ever, does multiplayer move from inventory-only to a real browser
  roadmap phase?

## Resolved Since Inventory

- 2026-06-09 — Runtime starts TypeScript-first with explicit deterministic
  helpers and a narrow WASM escape hatch only if Phase 1 or Phase 2 stop signals
  trip. See `runtime-architecture-decision.md`.
- 2026-06-09 — First parity capture starts with RNG, map geometry/projection,
  state serialization, and local/manual `SPAU.PA` metadata. See
  `parity-harness-design.md`.

## Commands Used

```bash
find . -maxdepth 2 -type d | sort
sed -n '1,220p' Freeserf.Core/Freeserf.Core.csproj
sed -n '1,220p' Freeserf.Renderer/Freeserf.Renderer.csproj
sed -n '1,220p' Freeserf.Audio/Freeserf.Audio.csproj
sed -n '1,220p' Freeserf.Network/Freeserf.Network.csproj
sed -n '1,220p' FreeserfNet/FreeserfNet.csproj
sed -n '1,220p' Silk.NET.Window/Silk.NET.Window.csproj
sed -n '1,220p' Freeserf.Test/Freeserf.Test.csproj
rg -n "class (Game|Map|MapGenerator|Savegame|GameState|DataSourceDos|DataSourceAmiga|DataSourceMixed)|interface IRender|class Render|class MainWindow|class GameView|class Audio|class Server|class Client|class Window" Freeserf.Core Freeserf.Renderer Freeserf.Audio Freeserf.Network FreeserfNet Silk.NET.Window
rg -n "TODO|missing|Missing|Current State|FileSystem|Directory|Path|File\\.|DynamicLibrary|Bass|Silk|OpenGL|Window|Mouse|Keyboard" README.md Issues.md Configuration.md Freeserf.Core Freeserf.Renderer Freeserf.Audio Freeserf.Network FreeserfNet Silk.NET.Window
sed -n '1,220p' Issues.md
sed -n '1,220p' Freeserf.Network/Multiplayer.md
sed -n '1,180p' Freeserf.Network/ToDo.md
sed -n '1,220p' Freeserf.Test/Freeserf.Core/Serialize/StateSerializerTests.cs
```
