import {
  assetImportBoundary,
  buildTypedAssetCatalog,
  parseDosPaCatalog,
  validateArchiveFileSelection,
  type ArchiveValidationResult,
  type DosPaCatalog,
  type TypedAssetCatalog,
} from "@serfbound/assets";
import {
  buildingType,
  engineBoundary,
  restoreSerfboundLocalGame,
  SerfboundCommandRouter,
  startSerfboundLocalGame,
  uint16,
  type SerfboundBuiltStructure,
  type SerfboundCommandResult,
  type SerfboundLocalGame,
  type SerfboundLocalGameDataSource,
  type SerfboundLocalGameSnapshot,
  type SerfboundLocalGameStartResult,
} from "@serfbound/engine";
import {
  BrowserIndexedDbImportedArchiveStore,
  InvalidStoredImportedArchiveRecordError,
  clearImportedArchiveRecord,
  createStoredImportedArchiveRecord,
  errorMessage,
  saveImportedArchiveRecord,
  type ImportedArchiveStore,
  type StoredImportedArchiveRecord,
} from "./imported-data-store.js";
import {
  BrowserIndexedDbLocalGameSaveStore,
  InvalidStoredLocalGameSaveRecordError,
  clearLocalGameSaveRecord,
  createStoredLocalGameSaveRecord,
  saveLocalGameSaveRecord,
  type LocalGameSaveStore,
  type StoredLocalGameSaveRecord,
} from "./local-game-save-store.js";
import {
  buildLandscapeRenderAssets,
  createLandscapeScene,
  screenToMapTile,
  type LandscapeRenderAssets,
  type MapScroll,
} from "./landscape-scene.js";
import {
  buildDecodedRenderAssets,
  createFirstRenderLayerScene,
  renderFirstRenderLayerScene,
  resolveFirstRenderLayerPointer,
  type DecodedRenderAssets,
  type PointerMapInteraction,
} from "./render-layer-scene.js";
import {
  panelBarRect,
  panelButtonAt,
  panelButtonSprites,
  pointInPanelBar,
  type PanelBuildPossibility,
} from "./panel-bar.js";
import {
  buildPopupPageOrder,
  knightOccupationCycle,
  minimapTileAt,
  pointInPopup,
  popupBuildItemAt,
  popupRect,
  settOccupationRowAt,
  type PopupKind,
} from "./popup.js";

import {
  initScreenRect,
  initScreenRowAt,
  nextSupplies,
  randomSeedString,
  type InitScreenSettings,
} from "./init-screen.js";

export * from "./panel-bar.js";
export * from "./popup.js";
export * from "./init-screen.js";

export {
  BrowserIndexedDbImportedArchiveStore,
  InvalidStoredImportedArchiveRecordError,
  assertStoredImportedArchiveRecord,
  clearImportedArchiveRecord,
  cloneToArrayBuffer,
  createStoredImportedArchiveRecord,
  currentImportedArchiveKey,
  importedArchiveDatabaseName,
  importedArchiveStoreName,
  saveImportedArchiveRecord,
  type ImportedArchiveStore,
  type StorageOperationResult,
  type StoredImportedArchiveMetadata,
  type StoredImportedArchiveRecord,
} from "./imported-data-store.js";
export {
  BrowserIndexedDbLocalGameSaveStore,
  InvalidStoredLocalGameSaveRecordError,
  assertStoredLocalGameSaveRecord,
  clearLocalGameSaveRecord,
  createStoredLocalGameSaveRecord,
  currentLocalGameSaveKey,
  localGameSaveDatabaseName,
  localGameSaveStoreName,
  saveLocalGameSaveRecord,
  type LocalGameSaveOperationResult,
  type LocalGameSaveStore,
  type StoredLocalGameSaveMetadata,
  type StoredLocalGameSaveRecord,
} from "./local-game-save-store.js";
export {
  buildLandscapeRenderAssets,
  createLandscapeScene,
  mapBuildingSprite,
  mapTileToScreen,
  screenToMapTile,
  type LandscapeRenderAssets,
  type LandscapeSceneOptions,
  type MapScroll,
} from "./landscape-scene.js";
export {
  buildDecodedRenderAssets,
  createFirstRenderLayerScene,
  renderFirstRenderLayerScene,
  resolveFirstRenderLayerPointer,
  renderLayerOrder,
  type DecodedRenderAssets,
  type FirstRenderLayerScene,
  type PointerMapInteraction,
  type RenderLayerKey,
  type RenderSceneAssetSummary,
  type RenderSceneLayer,
  type RenderScenePrimitive,
  type RenderSceneSource,
  type RenderSpritePrimitive,
} from "./render-layer-scene.js";

export type AppBootstrapSummary = {
  readonly runtime: "browser";
  readonly enginePackage: string;
  readonly assetSource: string;
  readonly uint16Sample: number;
  readonly dataState: ArchiveValidationResult["state"];
};

export function bootstrapSummary(): AppBootstrapSummary {
  return {
    runtime: "browser",
    enginePackage: engineBoundary.name,
    assetSource: assetImportBoundary.source,
    uint16Sample: uint16(0x1ffff),
    dataState: "missing",
  };
}

export type MountSerfboundOptions = {
  readonly importedArchiveStore?: ImportedArchiveStore;
  readonly localGameSaveStore?: LocalGameSaveStore;
};

type SceneRenderGenerated = () => void;
type SceneRenderCatalog = (
  typedAssetCatalog: TypedAssetCatalog,
  catalog: DosPaCatalog,
  archiveName: string,
  archiveBytes: ArrayBuffer | ArrayBufferView,
) => void;
type PointerLandscapeContext = {
  readonly landscape: LandscapeRenderAssets["landscape"];
  readonly scroll: MapScroll;
};

type PointerMapInteractionHandlers = {
  readonly commandRouter: () => SerfboundCommandRouter;
  readonly landscapeContext: () => PointerLandscapeContext | undefined;
  readonly worldCastlePending: () => boolean;
  readonly panelClick: (interaction: PointerMapInteraction) => boolean;
  readonly roadModeClick: (interaction: PointerMapInteraction) => boolean;
  readonly onWorldChanged: () => void;
  readonly onSelection: (interaction: PointerMapInteraction) => void;
};

export function mountSerfbound(root: HTMLElement, options: MountSerfboundOptions = {}): void {
  const importedArchiveStore =
    options.importedArchiveStore ?? new BrowserIndexedDbImportedArchiveStore();
  const localGameSaveStore =
    options.localGameSaveStore ?? new BrowserIndexedDbLocalGameSaveStore();
  const summary = bootstrapSummary();
  root.dataset.serfboundRuntime = summary.runtime;
  root.dataset.serfboundDataState = summary.dataState;
  root.dataset.serfboundCatalogState = "unread";
  root.dataset.serfboundStorageState = "empty";
  root.dataset.serfboundGameState = "setup";
  root.dataset.serfboundStartMode = "import-required";
  root.dataset.serfboundLocalGameState = "none";
  root.dataset.serfboundRecoverableState = "none";
  root.dataset.serfboundCommandState = "idle";
  root.dataset.serfboundCommandLogLength = "0";
  root.innerHTML = `
    <main class="serfbound-shell" data-testid="serfbound-shell">
      <section class="scene" aria-labelledby="serfbound-title">
        <div class="scene__toolbar">
          <div>
            <p class="scene__kicker">New settlement</p>
            <h1 id="serfbound-title">Serfbound</h1>
          </div>
          <div class="runtime-pill" data-testid="runtime-pill">Ready</div>
        </div>
        <canvas
          class="terrain-preview"
          data-testid="terrain-preview"
          width="960"
          height="540"
          aria-label="First Serfbound render-layer scene"
        ></canvas>
      </section>
      <aside class="status-panel" aria-label="Serfbound status">
        <div>
          <p class="status-panel__label">Data</p>
          <p class="status-panel__value" data-testid="data-state">No game data</p>
        </div>
        <p class="status-panel__detail" data-testid="data-detail">Import SPAU.PA to start a local game.</p>
        <div>
          <p class="status-panel__label">Game</p>
          <p class="status-panel__value" data-testid="game-state">Data needed</p>
        </div>
        <p class="status-panel__detail" data-testid="game-detail">Import game data first.</p>
        <div>
          <p class="status-panel__label">Source</p>
          <p class="status-panel__value" data-testid="source-state">No data</p>
        </div>
        <div>
          <p class="status-panel__label">Map</p>
          <p class="status-panel__value" data-testid="scene-state">Waiting for data</p>
        </div>
        <p class="status-panel__detail" data-testid="scene-detail">Select land to inspect it.</p>
        <div>
          <p class="status-panel__label">Hover</p>
          <p class="status-panel__value" data-testid="pointer-state">No map target</p>
        </div>
        <p class="status-panel__detail" data-testid="pointer-detail">Move over the map.</p>
        <div>
          <p class="status-panel__label">Selected Tile</p>
          <p class="status-panel__value" data-testid="selected-tile-state">No tile selected</p>
        </div>
        <p class="status-panel__detail" data-testid="selected-tile-detail">Select land to see its position.</p>
        <div>
          <p class="status-panel__label">Action</p>
          <p class="status-panel__value" data-testid="command-state">No action selected</p>
        </div>
        <p class="status-panel__detail" data-testid="command-detail">Select a tile to inspect available actions.</p>
        <div>
          <p class="status-panel__label">Save</p>
          <p class="status-panel__value" data-testid="save-state">No saved game</p>
        </div>
        <p class="status-panel__detail" data-testid="save-detail">Start a game to save.</p>
        <input
          id="data-import"
          class="import-input"
          data-testid="data-import-input"
          type="file"
          accept=".PA,.pa"
          tabindex="-1"
        />
        <button
          class="secondary-action"
          data-testid="build-flag-button"
          type="button"
          disabled
        >Build flag</button>
        <button
          class="secondary-action"
          data-testid="build-road-button"
          type="button"
          disabled
        >Build road</button>
        <button
          class="secondary-action"
          data-testid="build-lumberjack-button"
          type="button"
          disabled
        >Build lumberjack</button>
        <button
          class="primary-action"
          data-testid="start-game-button"
          type="button"
          disabled
        >Start game</button>
        <button
          class="secondary-action"
          data-testid="save-game-button"
          type="button"
          disabled
        >Save game</button>
        <button
          class="secondary-action"
          data-testid="load-game-button"
          type="button"
          disabled
        >Load game</button>
        <label
          class="secondary-action import-control"
          data-testid="data-import-control"
          for="data-import"
          role="button"
          tabindex="0"
        >Import data</label>
        <button
          class="secondary-action"
          data-testid="clear-save-button"
          type="button"
          disabled
        >Clear save</button>
        <button
          class="secondary-action"
          data-testid="data-reset-button"
          type="button"
          disabled
        >Clear data</button>
      </aside>
    </main>
  `;

  const canvas = root.querySelector<HTMLCanvasElement>("[data-testid='terrain-preview']");
  if (canvas === null) {
    throw new Error("Serfbound shell canvas did not mount.");
  }
  let commandRouter = new SerfboundCommandRouter();
  root.dataset.serfboundEnginePackage = summary.enginePackage;

  let currentTypedAssetCatalog: TypedAssetCatalog | undefined;
  let currentDecodedAssets: DecodedRenderAssets | undefined;
  let currentLandscapeAssets: LandscapeRenderAssets | undefined;
  let currentWorld: ReturnType<SerfboundLocalGame["world"]> | undefined;
  let currentSerfEngine: ReturnType<SerfboundLocalGame["serfEngine"]> | undefined;
  let currentScroll: MapScroll = { column: 0, row: 0 };
  let currentImportedDataSource: SerfboundLocalGameDataSource | undefined;
  let currentBuiltStructures: readonly SerfboundBuiltStructure[] = [];
  let currentLocalGameSnapshot: SerfboundLocalGameSnapshot | undefined;
  let currentSavedLocalGame: StoredLocalGameSaveRecord | undefined;
  let selectedInteraction: PointerMapInteraction | undefined;
  let currentPopup: PopupKind | undefined;
  const setPopup = (popup: PopupKind | undefined) => {
    currentPopup = popup;
    if (popup === undefined) {
      delete root.dataset.serfboundPopup;
    } else {
      root.dataset.serfboundPopup = popup;
    }
  };
  // The start screen's custom-game choices (GameInitBox settings).
  let startGameNowRef:
    | ((options: { seedString?: string; initialSupplies?: number }) => void)
    | undefined;
  let initSeedString = randomSeedString(Math.random);
  let initSupplies = 20;
  const initScreenSettings = (): InitScreenSettings | undefined => {
    if (
      currentDecodedAssets === undefined ||
      currentImportedDataSource === undefined ||
      root.dataset.serfboundGameState === "running"
    ) {
      return undefined;
    }

    root.dataset.serfboundInitSeed = initSeedString;
    root.dataset.serfboundInitSupplies = String(initSupplies);
    return { seedString: initSeedString, initialSupplies: initSupplies, mapSize: 3 };
  };
  // Notifications surface game events in the game font until replaced.
  let currentNotice: string | undefined;
  let lastDoneBuildingCount = 0;
  const setNotice = (notice: string | undefined) => {
    currentNotice = notice;
    if (notice === undefined) {
      delete root.dataset.serfboundNotification;
    } else {
      root.dataset.serfboundNotification = notice;
    }
  };
  // The authentic panel bar's build slot mirrors what the selected tile
  // allows (reference Interface.BuildPossibility, condensed).
  const computeBuildPossibility = (): PanelBuildPossibility => {
    const world = currentWorld;
    const tile = selectedInteraction?.tile;
    if (world === undefined || tile === undefined || root.dataset.serfboundGameState !== "running") {
      return "none";
    }

    const position = tile.position;
    if (world.players[0]?.hasCastle === false) {
      return world.canBuildCastle(position, 0) ? "castle" : "none";
    }

    if (world.canBuildBuilding(position, 17, 0)) return "large";
    if (world.canBuildBuilding(position, 2, 0)) return "small";
    if (world.canBuildBuilding(position, 6, 0)) return "mine";
    if (world.canBuildFlag(position, 0)) return "flag";
    return "none";
  };
  const computePanelButtons = (): number[] | undefined => {
    if (currentWorld === undefined || currentLandscapeAssets === undefined) {
      return undefined;
    }

    return panelButtonSprites({
      buildPossibility: computeBuildPossibility(),
      roadMode: root.dataset.serfboundRoadMode !== "idle" &&
        root.dataset.serfboundRoadMode !== undefined,
    });
  };
  const renderCurrentScene = () => {
    const panelButtons = computePanelButtons();
    if (panelButtons === undefined) {
      delete root.dataset.serfboundPanelButtons;
    } else {
      root.dataset.serfboundPanelButtons = panelButtons.join(",");
    }

    renderScene(
      root,
      currentTypedAssetCatalog,
      currentDecodedAssets,
      currentLandscapeAssets,
      currentWorld,
      currentSerfEngine === undefined
        ? undefined
        : [...currentSerfEngine.serfs.values()].filter(
            (serf) => serf.state !== 0 && serf.state !== 1,
          ),
      currentScroll,
      currentTick,
      currentBuiltStructures,
      panelButtons,
      currentPopup,
      currentNotice,
      initScreenSettings(),
    );
  };
  const applyScroll = (columnDelta: number, rowDelta: number) => {
    if (currentLandscapeAssets === undefined) {
      return;
    }

    const landscape = currentLandscapeAssets.landscape;
    currentScroll = {
      column:
        (((currentScroll.column + columnDelta) % landscape.columns) + landscape.columns) %
        landscape.columns,
      row: (((currentScroll.row + rowDelta) % landscape.rows) + landscape.rows) % landscape.rows,
    };
    renderCurrentScene();
  };
  let currentTick = 0;
  let waveTimer: ReturnType<typeof setInterval> | undefined;
  const stopWaveAnimation = () => {
    if (waveTimer !== undefined) {
      clearInterval(waveTimer);
      waveTimer = undefined;
    }
  };
  const syncWaveAnimation = () => {
    const reducedMotion =
      typeof globalThis.matchMedia === "function" &&
      globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const shouldAnimate =
      currentLandscapeAssets !== undefined &&
      currentLandscapeAssets.waveFrameCount > 0 &&
      !reducedMotion &&
      !root.ownerDocument.hidden;
    if (!shouldAnimate) {
      stopWaveAnimation();
      return;
    }

    // Wave frames advance every 8 ticks in the reference; ticking by 8 every
    // 175ms reproduces the original cadence without per-frame rebuilds. The
    // same driver advances the simulation clock and interim construction.
    waveTimer ??= setInterval(() => {
      currentTick = (currentTick + 8) % 1024;
      if (currentWorld !== undefined && root.dataset.serfboundGameState === "running") {
        for (let step = 0; step < 8; step += 1) {
          commandRouter.state.advanceTick();
        }

        if (currentSerfEngine !== undefined) {
          currentSerfEngine.update(commandRouter.state.tick);
          syncWorldState(root, currentWorld);

          // Notifications: surface completed buildings and defeat.
          if (currentWorld !== undefined) {
            const doneCount = [...currentWorld.buildings.values()].filter(
              (building) => building.isDone,
            ).length;
            if (doneCount > lastDoneBuildingCount && lastDoneBuildingCount > 0) {
              setNotice("BUILDING COMPLETE");
            }

            lastDoneBuildingCount = doneCount;
            if (currentWorld.players[0]?.defeated === true) {
              setNotice("GAME OVER");
            }
          }
        }

        root.dataset.serfboundGameTick = String(commandRouter.state.tick);
        root.dataset.serfboundSerfCount = String(
          currentSerfEngine === undefined ? 0 : currentSerfEngine.serfs.size,
        );

      }

      renderCurrentScene();
    }, 175);
  };
  root.ownerDocument.addEventListener("visibilitychange", syncWaveAnimation);
  const startLandscapeRendering = (game: { landscape(): Parameters<typeof buildLandscapeRenderAssets>[1] }) => {
    if (currentDecodedAssets === undefined) {
      currentLandscapeAssets = undefined;
      syncWaveAnimation();
      return;
    }

    currentLandscapeAssets = buildLandscapeRenderAssets(currentDecodedAssets, game.landscape()) ?? undefined;
    // Decoded UI chrome status (SB-16-01): glyph and icon counts.
    if (currentLandscapeAssets !== undefined) {
      root.dataset.serfboundUiArt =
        `glyphs:${currentLandscapeAssets.uiGlyphCount},icons:${currentLandscapeAssets.uiIconCount}`;
    } else {
      delete root.dataset.serfboundUiArt;
    }

    currentScroll = { column: 0, row: 0 };
    currentTick = 0;
    syncWaveAnimation();
  };
  const renderGeneratedScene = () => {
    currentTypedAssetCatalog = undefined;
    currentDecodedAssets = undefined;
    currentLandscapeAssets = undefined;
    currentScroll = { column: 0, row: 0 };
    currentTick = 0;
    stopWaveAnimation();
    currentWorld = undefined;
    currentSerfEngine = undefined;
    currentImportedDataSource = undefined;
    currentBuiltStructures = [];
    currentLocalGameSnapshot = undefined;
    selectedInteraction = undefined;
    commandRouter = new SerfboundCommandRouter();
    root.dataset.serfboundCommandState = "idle";
    root.dataset.serfboundCommandLogLength = "0";
    root.dataset.serfboundBuiltStructureCount = "0";
    delete root.dataset.serfboundCommandId;
    delete root.dataset.serfboundCommandReason;
    delete root.dataset.serfboundCommandType;
    delete root.dataset.serfboundLastBuiltStructure;
    getCommandStateElement(root).textContent = "No action selected";
    getCommandDetailElement(root).textContent = "Select a tile to inspect available actions.";
    getBuildFlagButton(root).disabled = true;
    syncLocalGameSaveControls(root, currentLocalGameSnapshot, currentSavedLocalGame, currentImportedDataSource);
    renderCurrentScene();
  };
  const renderCatalogScene = (
    typedAssetCatalog: TypedAssetCatalog,
    catalog: DosPaCatalog,
    archiveName: string,
    archiveBytes: ArrayBuffer | ArrayBufferView,
  ) => {
    currentTypedAssetCatalog = typedAssetCatalog;
    currentDecodedAssets = buildDecodedRenderAssets(archiveBytes, catalog) ?? undefined;
    currentImportedDataSource = localGameDataSourceFromCatalog(catalog, archiveName);
    syncLocalGameSaveControls(root, currentLocalGameSnapshot, currentSavedLocalGame, currentImportedDataSource);
    renderCurrentScene();
  };

  renderGeneratedScene();
  observeSceneResize(canvas, renderCurrentScene);
  attachPointerMapInteraction(root, canvas, {
    commandRouter: () => commandRouter,
    landscapeContext: () =>
      currentLandscapeAssets === undefined
        ? undefined
        : { landscape: currentLandscapeAssets.landscape, scroll: currentScroll },
    worldCastlePending: () =>
      currentWorld !== undefined &&
      root.dataset.serfboundGameState === "running" &&
      currentWorld.players[0]?.hasCastle === false,
    panelClick(interaction) {
      // The start screen owns setup-state canvas clicks: seed randomizes,
      // supplies cycle, START begins the seeded custom game.
      if (currentWorld === undefined && initScreenSettings() !== undefined) {
        const rect = initScreenRect({ width: canvas.width, height: canvas.height }, 2);
        const row = initScreenRowAt(rect, 2, interaction.screen.x, interaction.screen.y);
        if (row === "seed") {
          initSeedString = randomSeedString(Math.random);
        } else if (row === "supplies") {
          initSupplies = nextSupplies(initSupplies);
        } else if (row === "start") {
          startGameNowRef?.({ seedString: initSeedString, initialSupplies: initSupplies });
          return true;
        }

        if (row !== null) {
          renderCurrentScene();
          return true;
        }

        return false;
      }

      if (currentWorld === undefined || currentLandscapeAssets === undefined) {
        return false;
      }

      // An open popup owns the pointer above the map: build items place
      // buildings at the selected tile, the flip button cycles pages, the
      // sett rows cycle knight occupation, anywhere else closes.
      if (currentPopup !== undefined) {
        const popup = popupRect({ width: canvas.width, height: canvas.height }, 2);
        if (!pointInPopup(popup, interaction.screen.x, interaction.screen.y)) {
          setPopup(undefined);
          renderCurrentScene();
          return true;
        }

        if (currentPopup.startsWith("build")) {
          const hit = popupBuildItemAt(
            popup, 2, currentPopup, interaction.screen.x, interaction.screen.y,
          );
          if (hit === "flip") {
            const pageIndex = buildPopupPageOrder.indexOf(currentPopup);
            setPopup(buildPopupPageOrder[(pageIndex + 1) % buildPopupPageOrder.length]);
          } else if (hit !== null) {
            const tile = selectedInteraction?.tile;
            if (tile !== undefined) {
              const result =
                hit.building === "flag"
                  ? commandRouter.dispatch({ type: "game.build-flag", source: "pointer", tile })
                  : commandRouter.dispatch({
                      type: "game.build-building",
                      source: "pointer",
                      tile,
                      buildingKind: buildingKindNameOf(hit.building),
                    });
              if (
                result.status === "accepted" &&
                hit.building !== "flag" &&
                currentSerfEngine !== undefined
              ) {
                const newest = [...currentWorld.buildings.values()].reduce((a, b) =>
                  a.index > b.index ? a : b,
                );
                currentSerfEngine.dispatchConstructionLogistics(newest, commandRouter.state.tick);
              }

              currentLocalGameSnapshot = refreshLocalGameSnapshot(
                currentLocalGameSnapshot,
                commandRouter,
              );
              applyCommandResultState(root, result);
              syncWorldState(root, currentWorld);
              setPopup(undefined);
            }
          }
        } else if (currentPopup === "sett") {
          const row = settOccupationRowAt(popup, 2, interaction.screen.x, interaction.screen.y);
          const player = currentWorld.players[0];
          if (row !== null && player !== undefined) {
            const cycle = knightOccupationCycle;
            const index = cycle.indexOf(player.knightOccupation[row] ?? cycle[0]!);
            player.knightOccupation[row] = cycle[(index + 1) % cycle.length]!;
          }
        } else if (currentPopup === "map") {
          // Click-to-navigate: center the viewport on the clicked tile.
          const target = minimapTileAt(
            popup, 2, interaction.screen.x, interaction.screen.y,
            currentWorld.columns, currentWorld.rows,
          );
          if (target !== null) {
            currentScroll = { column: target.column, row: target.row };
          }
        }

        renderCurrentScene();
        return true;
      }

      const rect = panelBarRect({ width: canvas.width, height: canvas.height }, 2);
      if (!pointInPanelBar(rect, interaction.screen.x, interaction.screen.y)) {
        return false;
      }

      const slot = panelButtonAt(rect, 2, interaction.screen.x, interaction.screen.y);
      if (slot === 0) {
        // Build: place the castle directly during founding; with a castle
        // standing, the build popup offers the building menu.
        const possibility = computeBuildPossibility();
        const tile = selectedInteraction?.tile;
        if (tile !== undefined && possibility === "castle") {
          const result = commandRouter.dispatch({
            type: "game.build-castle",
            source: "pointer",
            tile,
          });
          applyCommandResultState(root, result);
          syncWorldState(root, currentWorld);
        } else if (currentWorld.players[0]?.hasCastle === true) {
          setPopup("buildBasic");
        }
      } else if (slot === 2) {
        setPopup("map");
      } else if (slot === 3) {
        setPopup("stats");
      } else if (slot === 4) {
        setPopup("sett");
      } else if (slot === 1) {
        // Road mode toggle, same semantics as the shell road button.
        if (root.dataset.serfboundRoadMode !== "idle") {
          setRoadMode("idle");
          getCommandStateElement(root).textContent = "Road mode ended";
          getCommandDetailElement(root).textContent =
            "Select a tile to inspect available actions.";
        } else {
          setRoadMode("awaiting-start");
          getCommandStateElement(root).textContent = "Build road";
          getCommandDetailElement(root).textContent = "Select the starting flag.";
        }
      }

      renderCurrentScene();
      return true;
    },
    roadModeClick(interaction) {
      const mode = root.dataset.serfboundRoadMode;
      if (currentWorld === undefined || mode === "idle" || mode === undefined) {
        return false;
      }

      if (mode === "awaiting-start") {
        roadModeFrom = interaction;
        setRoadMode("awaiting-end");
        getCommandStateElement(root).textContent = "Build road";
        getCommandDetailElement(root).textContent = "Select the destination flag.";
        return true;
      }

      const from = roadModeFrom;
      setRoadMode("idle");
      if (from === undefined) {
        return true;
      }

      const result = commandRouter.dispatch({
        type: "game.build-road",
        source: "pointer",
        tile: from.tile,
        toTile: interaction.tile,
      });
      if (result.status === "accepted" && currentSerfEngine !== undefined && currentWorld !== undefined) {
        // Newly connected sites get their builders and materials.
        for (const building of currentWorld.buildings.values()) {
          if (!building.isDone) {
            currentSerfEngine.dispatchConstructionLogistics(building, commandRouter.state.tick);
          }
        }
      }

      currentLocalGameSnapshot = refreshLocalGameSnapshot(currentLocalGameSnapshot, commandRouter);
      applyCommandResultState(root, result);
      syncWorldState(root, currentWorld);
      renderCurrentScene();
      syncLocalGameSaveControls(root, currentLocalGameSnapshot, currentSavedLocalGame, currentImportedDataSource);
      return true;
    },
    onWorldChanged() {
      syncWorldState(root, currentWorld);
      renderCurrentScene();
    },
    onSelection(interaction) {
      selectedInteraction = interaction;
      syncBuildFlagEnabled(root, selectedInteraction, currentBuiltStructures);
    },
  });

  // Landscape scrolling: arrow keys step by whole tiles; dragging the canvas
  // pans by accumulated tile steps (the original scrolls in full columns/rows).
  root.ownerDocument.addEventListener("keydown", (event) => {
    if (currentLandscapeAssets === undefined) {
      return;
    }

    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    const scrollKeys: Record<string, readonly [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const delta = scrollKeys[event.key];
    if (delta === undefined) {
      return;
    }

    event.preventDefault();
    applyScroll(delta[0], delta[1]);
  });

  let dragState: { x: number; y: number } | undefined;
  canvas.addEventListener("pointerdown", (event) => {
    if (currentLandscapeAssets !== undefined) {
      dragState = { x: event.clientX, y: event.clientY };
      canvas.setPointerCapture(event.pointerId);
    }
  });
  canvas.addEventListener("pointermove", (event) => {
    if (dragState === undefined || currentLandscapeAssets === undefined) {
      return;
    }

    const deltaX = event.clientX - dragState.x;
    const deltaY = event.clientY - dragState.y;
    const columnSteps = Math.trunc(deltaX / 32);
    const rowSteps = Math.trunc(deltaY / 20);
    if (columnSteps !== 0 || rowSteps !== 0) {
      dragState = {
        x: dragState.x + columnSteps * 32,
        y: dragState.y + rowSteps * 20,
      };
      applyScroll(-columnSteps, -rowSteps);
    }
  });
  const endDrag = (event: PointerEvent) => {
    dragState = undefined;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  const input = root.querySelector<HTMLInputElement>("[data-testid='data-import-input']");
  if (input === null) {
    throw new Error("Serfbound shell import input did not mount.");
  }

  input.addEventListener("change", () => {
    const file = input.files?.item(0);
    const validation = validateArchiveFileSelection(file);
    applyArchiveValidation(root, validation, renderGeneratedScene);

    if (validation.state === "supported" && file !== null && file !== undefined) {
      void importSelectedArchive(
        root,
        file,
        validation,
        importedArchiveStore,
        renderCatalogScene,
        renderGeneratedScene,
      );
    }
  });

  const importControl = root.querySelector<HTMLElement>("[data-testid='data-import-control']");
  if (importControl === null) {
    throw new Error("Serfbound shell import control did not mount.");
  }

  importControl.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    input.click();
  });

  const resetButton = root.querySelector<HTMLButtonElement>("[data-testid='data-reset-button']");
  if (resetButton === null) {
    throw new Error("Serfbound shell reset button did not mount.");
  }

  resetButton.addEventListener("click", () => {
    void clearSelectedArchive(root, importedArchiveStore, renderGeneratedScene);
  });

  const startButton = root.querySelector<HTMLButtonElement>("[data-testid='start-game-button']");
  if (startButton === null) {
    throw new Error("Serfbound shell start button did not mount.");
  }

  const startGameNow = (options: { seedString?: string; initialSupplies?: number }) => {
    const result = startSerfboundLocalGame(
      currentImportedDataSource === undefined
        ? {}
        : { data: currentImportedDataSource, ...options },
    );
    if (result.status === "started") {
      currentBuiltStructures = [];
      currentLocalGameSnapshot = result.snapshot;
      startLandscapeRendering(result.game);
      commandRouter = new SerfboundCommandRouter(
        result.game.state,
        currentLandscapeAssets === undefined ? undefined : result.game.world(),
      );
      currentWorld = currentLandscapeAssets === undefined ? undefined : result.game.world();
      currentSerfEngine =
        currentLandscapeAssets === undefined ? undefined : result.game.serfEngine();
      renderCurrentScene();
    }
    applyLocalGameStartResult(root, result, currentTypedAssetCatalog);
    syncWorldState(root, currentWorld);
    syncBuildFlagEnabled(root, selectedInteraction, currentBuiltStructures);
    syncLocalGameSaveControls(root, currentLocalGameSnapshot, currentSavedLocalGame, currentImportedDataSource);
  };
  startGameNowRef = startGameNow;
  startButton.addEventListener("click", () => {
    // With the init screen up (decoded mode), the shell button is the
    // accessible path to the same custom game; the catalog-only fallback
    // keeps its deterministic derived seed.
    if (initScreenSettings() !== undefined) {
      startGameNow({ seedString: initSeedString, initialSupplies: initSupplies });
    } else {
      startGameNow({});
    }
  });

  let roadModeFrom: PointerMapInteraction | undefined;
  const setRoadMode = (mode: "idle" | "awaiting-start" | "awaiting-end") => {
    root.dataset.serfboundRoadMode = mode;
    if (mode === "idle") {
      roadModeFrom = undefined;
    }
  };
  setRoadMode("idle");

  const buildRoadButton = root.querySelector<HTMLButtonElement>("[data-testid='build-road-button']");
  if (buildRoadButton === null) {
    throw new Error("Serfbound shell build road button did not mount.");
  }

  buildRoadButton.addEventListener("click", () => {
    if (root.dataset.serfboundRoadMode !== "idle") {
      setRoadMode("idle");
      getCommandStateElement(root).textContent = "Road mode ended";
      getCommandDetailElement(root).textContent = "Select a tile to inspect available actions.";
      return;
    }

    setRoadMode("awaiting-start");
    getCommandStateElement(root).textContent = "Build road";
    getCommandDetailElement(root).textContent = "Select the starting flag.";
  });

  const buildLumberjackButton = root.querySelector<HTMLButtonElement>(
    "[data-testid='build-lumberjack-button']",
  );
  if (buildLumberjackButton === null) {
    throw new Error("Serfbound shell build lumberjack button did not mount.");
  }

  buildLumberjackButton.addEventListener("click", () => {
    const interaction = selectedInteraction;
    if (interaction === undefined || currentWorld === undefined) {
      return;
    }

    const result = commandRouter.dispatch({
      type: "game.build-building",
      source: "pointer",
      tile: interaction.tile,
      buildingKind: "lumberjack",
    });
    if (result.status === "accepted" && currentSerfEngine !== undefined) {
      // Send out the builder and the construction materials.
      const newest = [...currentWorld!.buildings.values()].reduce((a, b) =>
        a.index > b.index ? a : b,
      );
      currentSerfEngine.dispatchConstructionLogistics(newest, commandRouter.state.tick);
    }

    currentLocalGameSnapshot = refreshLocalGameSnapshot(currentLocalGameSnapshot, commandRouter);
    applyCommandResultState(root, result);
    syncWorldState(root, currentWorld);
    renderCurrentScene();
    syncLocalGameSaveControls(root, currentLocalGameSnapshot, currentSavedLocalGame, currentImportedDataSource);
  });

  const buildFlagButton = root.querySelector<HTMLButtonElement>("[data-testid='build-flag-button']");
  if (buildFlagButton === null) {
    throw new Error("Serfbound shell build flag button did not mount.");
  }

  buildFlagButton.addEventListener("click", () => {
    const interaction = selectedInteraction;
    if (interaction === undefined) {
      return;
    }

    if (currentWorld !== undefined) {
      const worldResult = commandRouter.dispatch({
        type: "game.build-flag",
        source: "pointer",
        tile: interaction.tile,
      });
      currentLocalGameSnapshot = refreshLocalGameSnapshot(currentLocalGameSnapshot, commandRouter);
      applyCommandResultState(root, worldResult);
      syncWorldState(root, currentWorld);
      renderCurrentScene();
      syncLocalGameSaveControls(root, currentLocalGameSnapshot, currentSavedLocalGame, currentImportedDataSource);
      return;
    }

    const result = commandRouter.dispatch({
      type: "game.build",
      source: "pointer",
      building: "flag",
      tile: interaction.tile,
    });
    currentBuiltStructures = result.snapshot.builtStructures;
    currentLocalGameSnapshot = refreshLocalGameSnapshot(currentLocalGameSnapshot, commandRouter);
    applyCommandResultState(root, result);
    renderCurrentScene();
    syncBuildFlagEnabled(root, selectedInteraction, currentBuiltStructures);
    syncLocalGameSaveControls(root, currentLocalGameSnapshot, currentSavedLocalGame, currentImportedDataSource);
  });

  const saveButton = getSaveGameButton(root);
  saveButton.addEventListener("click", () => {
    const snapshot = refreshLocalGameSnapshot(currentLocalGameSnapshot, commandRouter);
    if (snapshot === undefined) {
      return;
    }

    currentLocalGameSnapshot = snapshot;
    void saveCurrentLocalGame(
      root,
      localGameSaveStore,
      snapshot,
      (record) => {
        currentSavedLocalGame = record;
        syncLocalGameSaveControls(
          root,
          currentLocalGameSnapshot,
          currentSavedLocalGame,
          currentImportedDataSource,
        );
      },
    );
  });

  const loadButton = getLoadGameButton(root);
  loadButton.addEventListener("click", () => {
    void loadCurrentLocalGame(
      root,
      localGameSaveStore,
      currentImportedDataSource,
      (record, snapshot) => {
        const restored = restoreSerfboundLocalGame(snapshot);
        if (restored.status === "rejected") {
          applyLocalGameSaveErrorState(root, restored.message);
          return;
        }

        currentSavedLocalGame = record;
        currentLocalGameSnapshot = restored.snapshot;
        currentBuiltStructures = restored.snapshot.state.builtStructures;
        selectedInteraction = undefined;
        startLandscapeRendering(restored.game);
        commandRouter = new SerfboundCommandRouter(
          restored.game.state,
          currentLandscapeAssets === undefined ? undefined : restored.game.world(),
        );
        currentWorld = currentLandscapeAssets === undefined ? undefined : restored.game.world();
        currentSerfEngine =
          currentLandscapeAssets === undefined ? undefined : restored.game.serfEngine();
        applyRunningLocalGameSnapshot(root, restored.snapshot);
        syncWorldState(root, currentWorld);
        renderCurrentScene();
        syncBuildFlagEnabled(root, selectedInteraction, currentBuiltStructures);
        applyLocalGameLoadedState(root, record);
        syncLocalGameSaveControls(
          root,
          currentLocalGameSnapshot,
          currentSavedLocalGame,
          currentImportedDataSource,
        );
      },
      (record) => {
        currentSavedLocalGame = record;
        syncLocalGameSaveControls(
          root,
          currentLocalGameSnapshot,
          currentSavedLocalGame,
          currentImportedDataSource,
        );
      },
    );
  });

  const clearSaveButton = getClearSaveButton(root);
  clearSaveButton.addEventListener("click", () => {
    void clearCurrentLocalGameSave(
      root,
      localGameSaveStore,
      () => {
        currentSavedLocalGame = undefined;
        syncLocalGameSaveControls(
          root,
          currentLocalGameSnapshot,
          currentSavedLocalGame,
          currentImportedDataSource,
        );
      },
    );
  });

  void (async () => {
    await restorePersistedArchive(
      root,
      importedArchiveStore,
      renderCatalogScene,
      renderGeneratedScene,
    );
    currentSavedLocalGame = await restorePersistedLocalGameSave(root, localGameSaveStore);
    syncLocalGameSaveControls(root, currentLocalGameSnapshot, currentSavedLocalGame, currentImportedDataSource);
  })();
}

async function restorePersistedLocalGameSave(
  root: HTMLElement,
  localGameSaveStore: LocalGameSaveStore,
): Promise<StoredLocalGameSaveRecord | undefined> {
  root.dataset.serfboundLocalSaveState = "loading";

  try {
    const record = await localGameSaveStore.loadCurrent();
    if (record === null) {
      applyNoLocalGameSaveState(root, "No saved game", "Start a game to save.");
      return undefined;
    }

    applyLocalGameSaveAvailableState(root, record);
    return record;
  } catch (error) {
    applyLocalGameSaveErrorState(
      root,
      error instanceof InvalidStoredLocalGameSaveRecordError
        ? "Saved game is corrupt or from an unsupported version. Clear the save to keep using imported data."
        : `Saved game restore failed: ${errorMessage(error)}`,
    );
    return undefined;
  }
}

async function saveCurrentLocalGame(
  root: HTMLElement,
  localGameSaveStore: LocalGameSaveStore,
  snapshot: SerfboundLocalGameSnapshot,
  onSaved: (record: StoredLocalGameSaveRecord) => void,
): Promise<void> {
  root.dataset.serfboundLocalSaveState = "saving";
  getSaveStateElement(root).textContent = "Saving game";
  getSaveDetailElement(root).textContent = "Writing the current browser game state.";

  const record = createStoredLocalGameSaveRecord({ snapshot });
  const result = await saveLocalGameSaveRecord(localGameSaveStore, record);
  if (result.state === "error") {
    applyLocalGameSaveErrorState(root, `Could not save game: ${result.message}`);
    return;
  }

  onSaved(record);
  root.dataset.serfboundLocalSaveState = "persisted";
  root.dataset.serfboundLocalSaveSavedAt = record.savedAtIso;
  root.dataset.serfboundLocalSaveSource = record.dataSource.archiveName;
  getSaveStateElement(root).textContent = "Game saved";
  getSaveDetailElement(root).textContent =
    `Saved ${record.snapshot.state.builtStructures.length} built structures.`;
}

async function loadCurrentLocalGame(
  root: HTMLElement,
  localGameSaveStore: LocalGameSaveStore,
  currentImportedDataSource: SerfboundLocalGameDataSource | undefined,
  onLoaded: (
    record: StoredLocalGameSaveRecord,
    snapshot: SerfboundLocalGameSnapshot,
  ) => void,
  onAvailable: (record: StoredLocalGameSaveRecord | undefined) => void,
): Promise<void> {
  root.dataset.serfboundLocalSaveState = "loading";
  getSaveStateElement(root).textContent = "Loading game";
  getSaveDetailElement(root).textContent = "Reading the current browser save.";

  let record: StoredLocalGameSaveRecord | null;
  try {
    record = await localGameSaveStore.loadCurrent();
  } catch (error) {
    applyLocalGameSaveErrorState(
      root,
      error instanceof InvalidStoredLocalGameSaveRecordError
        ? "Saved game is corrupt or from an unsupported version. Clear the save to keep using imported data."
        : `Could not load saved game: ${errorMessage(error)}`,
    );
    return;
  }

  if (record === null) {
    onAvailable(undefined);
    applyNoLocalGameSaveState(root, "No saved game", "Start a game to save.");
    return;
  }

  onAvailable(record);
  if (currentImportedDataSource === undefined) {
    applyLocalGameSaveErrorState(root, "Import data before loading a saved game.");
    return;
  }

  if (!localGameDataSourcesMatch(currentImportedDataSource, record.dataSource)) {
    applyLocalGameSaveErrorState(root, "Saved game uses another imported data source.");
    return;
  }

  onLoaded(record, record.snapshot);
}

async function clearCurrentLocalGameSave(
  root: HTMLElement,
  localGameSaveStore: LocalGameSaveStore,
  onCleared: () => void,
): Promise<void> {
  const result = await clearLocalGameSaveRecord(localGameSaveStore);
  if (result.state === "error") {
    applyLocalGameSaveErrorState(root, `Could not clear saved game: ${result.message}`);
    return;
  }

  delete root.dataset.serfboundLocalSaveSavedAt;
  delete root.dataset.serfboundLocalSaveSource;
  applyNoLocalGameSaveState(root, "No saved game", "Saved game cleared.");
  if (root.dataset.serfboundStorageState !== "error") {
    root.dataset.serfboundRecoverableState = "none";
  }
  onCleared();
}

function refreshLocalGameSnapshot(
  snapshot: SerfboundLocalGameSnapshot | undefined,
  commandRouter: SerfboundCommandRouter,
): SerfboundLocalGameSnapshot | undefined {
  if (snapshot === undefined) {
    return undefined;
  }

  return {
    ...snapshot,
    data: { ...snapshot.data },
    settings: { ...snapshot.settings },
    state: commandRouter.state.snapshot(),
    renderer: { ...snapshot.renderer },
  };
}

function applyArchiveValidation(
  root: HTMLElement,
  result: ArchiveValidationResult,
  renderGeneratedScene: SceneRenderGenerated,
): void {
  const state = root.querySelector<HTMLElement>("[data-testid='data-state']");
  const detail = root.querySelector<HTMLElement>("[data-testid='data-detail']");
  if (state === null || detail === null) {
    throw new Error("Serfbound shell data status did not mount.");
  }

  root.dataset.serfboundDataState = result.state;

  switch (result.state) {
    case "supported":
      state.textContent = "Game data selected";
      detail.textContent = `${result.normalizedName} is ready to load.`;
      root.dataset.serfboundCatalogState = "ready";
      root.dataset.serfboundRecoverableState = "none";
      setSourceState(root, "Imported data");
      syncGameReadiness(root);
      break;
    case "unsupported":
      state.textContent = "File not usable";
      detail.textContent = `${result.fileName} cannot be used. Choose SPAU.PA to start.`;
      root.dataset.serfboundCatalogState = "unread";
      root.dataset.serfboundStorageState = "empty";
      root.dataset.serfboundRecoverableState = "file-error";
      renderGeneratedScene();
      setSourceState(root, "No data");
      syncGameReadiness(root);
      setResetEnabled(root, false);
      break;
    case "missing":
      state.textContent = "No game data";
      detail.textContent = "Import SPAU.PA to start a local game.";
      root.dataset.serfboundCatalogState = "unread";
      root.dataset.serfboundStorageState = "empty";
      root.dataset.serfboundRecoverableState = "none";
      renderGeneratedScene();
      setSourceState(root, "No data");
      syncGameReadiness(root);
      setResetEnabled(root, false);
      break;
  }
}

async function importSelectedArchive(
  root: HTMLElement,
  file: File,
  validation: Extract<ArchiveValidationResult, { readonly state: "supported" }>,
  importedArchiveStore: ImportedArchiveStore,
  renderCatalogScene: SceneRenderCatalog,
  renderGeneratedScene: SceneRenderGenerated,
): Promise<void> {
  const state = root.querySelector<HTMLElement>("[data-testid='data-state']");
  const detail = root.querySelector<HTMLElement>("[data-testid='data-detail']");
  if (state === null || detail === null) {
    throw new Error("Serfbound shell data status did not mount.");
  }

  root.dataset.serfboundCatalogState = "parsing";
  detail.textContent = "Loading selected game data.";

  try {
    const bytes = await file.arrayBuffer();
    const catalog = parseDosPaCatalog(bytes);
    renderCatalogScene(buildTypedAssetCatalog(catalog), catalog, validation.normalizedName, bytes);
    const record = createStoredImportedArchiveRecord({
      fileName: validation.fileName,
      normalizedName: validation.normalizedName,
      bytes,
    });
    const storageResult = await saveImportedArchiveRecord(importedArchiveStore, record);

    if (storageResult.state === "error") {
      root.dataset.serfboundStorageState = "error";
      root.dataset.serfboundCatalogState = "parsed";
      root.dataset.serfboundDataState = "supported";
      root.dataset.serfboundRecoverableState = "storage-error";
      state.textContent = "Data loaded";
      detail.textContent = "The data works for this session, but could not be saved for next time.";
      root.dataset.serfboundStorageMessage = storageResult.message;
      setSourceState(root, "Imported data");
      syncGameReadiness(root);
      setResetEnabled(root, false);
      return;
    }

    applyParsedCatalogState(root, catalog, "persisted");
  } catch (error) {
    root.dataset.serfboundCatalogState = "invalid";
    root.dataset.serfboundStorageState = "empty";
    root.dataset.serfboundRecoverableState = "parse-error";
    renderGeneratedScene();
    state.textContent = "Data could not be read";
    detail.textContent = "Choose SPAU.PA again to start.";
    root.dataset.serfboundDataError = errorMessage(error);
    setSourceState(root, "No data");
    syncGameReadiness(root);
    setResetEnabled(root, false);
  }
}

async function restorePersistedArchive(
  root: HTMLElement,
  importedArchiveStore: ImportedArchiveStore,
  renderCatalogScene: SceneRenderCatalog,
  renderGeneratedScene: SceneRenderGenerated,
): Promise<void> {
  root.dataset.serfboundStorageState = "loading";

  try {
    const record = await importedArchiveStore.loadCurrent();
    if (record === null) {
      root.dataset.serfboundStorageState = "empty";
      return;
    }

    applyStoredArchiveRecord(root, record, renderCatalogScene, renderGeneratedScene);
  } catch (error) {
    if (error instanceof InvalidStoredImportedArchiveRecordError) {
      applyStorageErrorState(
        root,
        "Saved data is corrupt or from an unsupported version. Clear it and import SPAU.PA again.",
        true,
      );
      return;
    }

    applyStorageErrorState(root, `Local data restore failed: ${errorMessage(error)}`, false);
  }
}

function applyStoredArchiveRecord(
  root: HTMLElement,
  record: StoredImportedArchiveRecord,
  renderCatalogScene: SceneRenderCatalog,
  renderGeneratedScene: SceneRenderGenerated,
): void {
  try {
    const catalog = parseDosPaCatalog(record.bytes);
    renderCatalogScene(buildTypedAssetCatalog(catalog), catalog, record.normalizedName, record.bytes);
    applyParsedCatalogState(root, catalog, "restored", record);
  } catch (error) {
    root.dataset.serfboundDataState = "unsupported";
    root.dataset.serfboundCatalogState = "invalid";
    root.dataset.serfboundStorageState = "error";
    root.dataset.serfboundRecoverableState = "stored-data-error";
    renderGeneratedScene();
    const state = getDataStateElement(root);
    const detail = getDataDetailElement(root);
    state.textContent = "Saved data could not be read";
    detail.textContent = "Clear it and import SPAU.PA again.";
    root.dataset.serfboundDataError = errorMessage(error);
    setSourceState(root, "Saved data");
    syncGameReadiness(root);
    setResetEnabled(root, true);
  }
}

function applyParsedCatalogState(
  root: HTMLElement,
  catalog: DosPaCatalog,
  source: "persisted" | "restored",
  record?: StoredImportedArchiveRecord,
): void {
  const state = getDataStateElement(root);
  const detail = getDataDetailElement(root);
  root.dataset.serfboundDataState = "supported";
  root.dataset.serfboundCatalogState = "parsed";
  root.dataset.serfboundStorageState = "persisted";
  root.dataset.serfboundRecoverableState = "none";
  state.textContent = "Data imported";
  detail.textContent =
    source === "restored" && record !== undefined
      ? `${record.normalizedName} restored with ${catalog.entrySummary.defined} resources.`
      : `${catalog.entrySummary.defined} resources loaded and saved.`;
  setSourceState(root, "Imported data");
  syncGameReadiness(root);
  setResetEnabled(root, true);
}

async function clearSelectedArchive(
  root: HTMLElement,
  importedArchiveStore: ImportedArchiveStore,
  renderGeneratedScene: SceneRenderGenerated,
): Promise<void> {
  const result = await clearImportedArchiveRecord(importedArchiveStore);
  if (result.state === "error") {
    applyStorageErrorState(root, `Could not clear local data: ${result.message}`);
    return;
  }

  root.dataset.serfboundDataState = "missing";
  root.dataset.serfboundCatalogState = "unread";
  root.dataset.serfboundStorageState = "cleared";
  root.dataset.serfboundRecoverableState = "none";
  root.dataset.serfboundGameState = "setup";
  renderGeneratedScene();
  getDataStateElement(root).textContent = "No game data";
  getDataDetailElement(root).textContent = "Saved data cleared. Import SPAU.PA to start.";
  setSourceState(root, "No data");
  syncGameReadiness(root);
  setResetEnabled(root, false);
}

function applyStorageErrorState(
  root: HTMLElement,
  message: string,
  canClearStoredData = false,
): void {
  root.dataset.serfboundStorageState = "error";
  root.dataset.serfboundRecoverableState = "storage-error";
  root.dataset.serfboundStorageMessage = message;
  getDataStateElement(root).textContent = "Saved data unavailable";
  getDataDetailElement(root).textContent = canClearStoredData
    ? "Clear saved data and import SPAU.PA again."
    : "Try importing SPAU.PA again.";
  setSourceState(root, "No data");
  syncGameReadiness(root);
  setResetEnabled(root, canClearStoredData);
}

// Engine building type value -> the command router's buildingKind name.
function buildingKindNameOf(value: number): string {
  const entry = Object.entries(buildingType).find(([, typeValue]) => typeValue === value);
  return entry === undefined ? "lumberjack" : entry[0];
}

function renderScene(
  root: HTMLElement,
  typedAssetCatalog: TypedAssetCatalog | undefined,
  decodedAssets: DecodedRenderAssets | undefined,
  landscapeAssets: LandscapeRenderAssets | undefined,
  world: SerfboundLocalGame["world"] extends () => infer W ? W | undefined : never,
  serfs: readonly { position: number; animation: number; counter: number }[] | undefined,
  scroll: MapScroll,
  tick: number,
  builtStructures: readonly SerfboundBuiltStructure[] = [],
  panelButtons?: readonly number[],
  popup?: PopupKind,
  notice?: string,
  initScreen?: InitScreenSettings,
): void {
  const canvas = root.querySelector<HTMLCanvasElement>("[data-testid='terrain-preview']");
  if (canvas === null) {
    throw new Error("Serfbound shell canvas did not mount.");
  }

  const size = resizeCanvasToDisplayedSize(canvas);
  const scene =
    landscapeAssets !== undefined
      ? createLandscapeScene({
          size,
          assets: landscapeAssets,
          scroll,
          tick,
          builtStructures,
          ...(world === undefined ? {} : { world }),
          ...(serfs === undefined ? {} : { serfs }),
          ...(panelButtons === undefined ? {} : { panel: { buttons: panelButtons } }),
          ...(popup === undefined ? {} : { popup: { kind: popup } }),
          ...(notice === undefined ? {} : { notice }),
          ...(decodedAssets === undefined
            ? {}
            : { definedArchiveEntries: decodedAssets.definedArchiveEntries }),
        })
      : createFirstRenderLayerScene({
          size,
          builtStructures,
          ...(typedAssetCatalog === undefined ? {} : { typedAssetCatalog }),
          ...(decodedAssets === undefined ? {} : { decodedAssets }),
          ...(initScreen === undefined ? {} : { initScreen }),
        });
  root.dataset.serfboundScroll = `${scroll.column},${scroll.row}`;
  root.dataset.serfboundSceneMode = landscapeAssets !== undefined ? "landscape" : "preview";

  renderFirstRenderLayerScene(canvas, scene);
  root.dataset.serfboundRenderer = scene.renderer;
  root.dataset.serfboundSceneSource = scene.assetSummary.source;
  root.dataset.serfboundLayerCount = String(scene.layers.length);
  root.dataset.serfboundPrimitiveCount = String(scene.primitives.length);
  root.dataset.serfboundSpriteCount = String(scene.sprites.length);
  root.dataset.serfboundSerfSpriteCount = String(
    scene.sprites.filter((sprite) => sprite.key.startsWith("serf")).length,
  );
  root.dataset.serfboundBuiltStructureCount = String(builtStructures.length);
  root.dataset.serfboundCanvasWidth = String(canvas.width);
  root.dataset.serfboundCanvasHeight = String(canvas.height);

  const sceneState = root.querySelector<HTMLElement>("[data-testid='scene-state']");
  const sceneDetail = root.querySelector<HTMLElement>("[data-testid='scene-detail']");
  if (sceneState === null || sceneDetail === null) {
    throw new Error("Serfbound shell scene status did not mount.");
  }

  if (scene.assetSummary.source === "dos-pa-decoded") {
    sceneState.textContent = "Imported terrain";
    sceneDetail.textContent =
      `Authentic terrain decoded: ${scene.sprites.length} sprites on screen.`;
    return;
  }

  sceneState.textContent =
    scene.assetSummary.source === "dos-pa-catalog" ? "Imported terrain" : "Preview terrain";
  sceneDetail.textContent =
    scene.assetSummary.source === "dos-pa-catalog"
      ? `${scene.assetSummary.definedArchiveEntries ?? 0} resources are ready for play.`
      : "Select land to inspect it.";
}

function attachPointerMapInteraction(
  root: HTMLElement,
  canvas: HTMLCanvasElement,
  handlers: PointerMapInteractionHandlers,
): void {
  canvas.addEventListener("pointermove", (event) => {
    const interaction = resolveCanvasPointer(canvas, event, handlers.landscapeContext());
    applyPointerHoverState(root, interaction, event.pointerType);
  });

  canvas.addEventListener("pointerdown", (event) => {
    const interaction = resolveCanvasPointer(canvas, event, handlers.landscapeContext());

    // The panel bar sits above the map: its clicks never reach the world.
    if (handlers.panelClick(interaction)) {
      return;
    }

    applyPointerHoverState(root, interaction, event.pointerType);
    applyPointerSelectionState(root, interaction);

    if (handlers.roadModeClick(interaction)) {
      handlers.onSelection(interaction);
      return;
    }

    // Castle placement mode: the first click of a fresh world game places
    // the castle (the original founding act).
    if (handlers.worldCastlePending()) {
      const castleResult = handlers.commandRouter().dispatch({
        type: "game.build-castle",
        source: "pointer",
        tile: interaction.tile,
      });
      applyCommandResultState(root, castleResult);
      if (castleResult.status === "accepted") {
        handlers.onWorldChanged();
      }

      handlers.onSelection(interaction);
      return;
    }

    applyCommandResultState(
      root,
      handlers.commandRouter().dispatch({
        type: "debug.inspect-map-tile",
        source: "pointer",
        map: interaction.map,
        tile: interaction.tile,
      }),
    );
    handlers.onSelection(interaction);
  });

  canvas.addEventListener("pointerleave", () => {
    root.dataset.serfboundPointerState = "idle";
    getPointerStateElement(root).textContent = "No map target";
    getPointerDetailElement(root).textContent = "Move over the map.";
  });
}

function resolveCanvasPointer(
  canvas: HTMLCanvasElement,
  event: Pick<PointerEvent, "clientX" | "clientY">,
  landscapeContext?: PointerLandscapeContext,
): PointerMapInteraction {
  const rect = canvas.getBoundingClientRect();
  const screen = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };

  if (landscapeContext !== undefined) {
    const tile = screenToMapTile(landscapeContext.landscape, screen, landscapeContext.scroll);
    return {
      screen,
      view: screen,
      map: screen,
      tile,
    };
  }

  return resolveFirstRenderLayerPointer(screen, { width: canvas.width, height: canvas.height });
}

function applyPointerHoverState(
  root: HTMLElement,
  interaction: PointerMapInteraction,
  pointerType: string,
): void {
  root.dataset.serfboundPointerState = "hover";
  root.dataset.serfboundPointerType = pointerType;
  root.dataset.serfboundHoverTile = `${interaction.tile.column},${interaction.tile.row}`;
  root.dataset.serfboundHoverPosition = String(interaction.tile.position);
  root.dataset.serfboundHoverMap = `${Math.round(interaction.map.x)},${Math.round(interaction.map.y)}`;
  getPointerStateElement(root).textContent = `Hover ${interaction.tile.column},${interaction.tile.row}`;
  getPointerDetailElement(root).textContent =
    `Map ${Math.round(interaction.map.x)},${Math.round(interaction.map.y)} via ${pointerType || "pointer"}`;
}

function applyPointerSelectionState(root: HTMLElement, interaction: PointerMapInteraction): void {
  root.dataset.serfboundPointerState = "selected";
  root.dataset.serfboundSelectedTile = `${interaction.tile.column},${interaction.tile.row}`;
  root.dataset.serfboundSelectedPosition = String(interaction.tile.position);
  getPointerStateElement(root).textContent = `Selected ${interaction.tile.column},${interaction.tile.row}`;
  getSelectedTileStateElement(root).textContent = `Tile ${interaction.tile.column},${interaction.tile.row}`;
  getSelectedTileDetailElement(root).textContent =
    `Position ${interaction.tile.position} - map ${Math.round(interaction.map.x)},${Math.round(interaction.map.y)}`;
}

function syncWorldState(
  root: HTMLElement,
  world:
    | {
        players: readonly { hasCastle: boolean }[];
        flags: ReadonlyMap<number, unknown>;
        buildings: ReadonlyMap<number, { isDone: boolean }>;
      }
    | undefined,
): void {
  if (world === undefined) {
    delete root.dataset.serfboundWorldHasCastle;
    delete root.dataset.serfboundWorldFlagCount;
    delete root.dataset.serfboundWorldBuildingCount;
    delete root.dataset.serfboundWorldBuildingDoneCount;
    delete root.dataset.serfboundStockSummary;
    delete root.dataset.serfboundMilitarySummary;
    return;
  }

  const hasCastle = world.players[0]?.hasCastle ?? false;
  root.dataset.serfboundWorldHasCastle = String(hasCastle);
  // Conquest end state: the castle fell (Game.PlayerDefeated).
  const defeated =
    (world.players[0] as { defeated?: boolean } | undefined)?.defeated ?? false;
  root.dataset.serfboundGameOver = String(defeated);
  if (defeated) {
    const state = root.querySelector<HTMLElement>("[data-testid='command-state']");
    const detail = root.querySelector<HTMLElement>("[data-testid='command-detail']");
    if (state !== null && detail !== null) {
      state.textContent = "Game over";
      detail.textContent = "Your castle has fallen.";
    }
  }
  const roadButton = root.querySelector<HTMLButtonElement>("[data-testid='build-road-button']");
  if (roadButton !== null) {
    roadButton.disabled = !hasCastle;
  }
  const lumberjackButton = root.querySelector<HTMLButtonElement>(
    "[data-testid='build-lumberjack-button']",
  );
  if (lumberjackButton !== null) {
    lumberjackButton.disabled = !hasCastle;
  }
  root.dataset.serfboundWorldFlagCount = String(world.flags.size);
  root.dataset.serfboundWorldBuildingCount = String(world.buildings.size);
  root.dataset.serfboundWorldBuildingDoneCount = String(
    [...world.buildings.values()].filter((building) => building.isDone).length,
  );
  // Live economy stats: the castle stock's key lines (Phase 16's stats
  // popups render the full table from the same source).
  const inventory = (world as {
    inventoryForPlayer?: (p: number) => { resources: Uint32Array; knights: number } | null;
  }).inventoryForPlayer?.(0);
  if (inventory !== undefined && inventory !== null) {
    root.dataset.serfboundStockSummary = [
      `plank:${inventory.resources[7]}`,
      `stone:${inventory.resources[9]}`,
      `lumber:${inventory.resources[6]}`,
      `bread:${inventory.resources[5]}`,
      `steel:${inventory.resources[11]}`,
    ].join(",");
    const player = world.players[0] as
      | { knightMorale?: number }
      | undefined;
    root.dataset.serfboundMilitarySummary = [
      `sword:${inventory.resources[24]}`,
      `shield:${inventory.resources[25]}`,
      `knight:${inventory.knights}`,
      `morale:${player?.knightMorale ?? 0}`,
    ].join(",");
  }

  if (!hasCastle && root.dataset.serfboundGameState === "running") {
    const state = root.querySelector<HTMLElement>("[data-testid='command-state']");
    const detail = root.querySelector<HTMLElement>("[data-testid='command-detail']");
    if (state !== null && detail !== null) {
      state.textContent = "Place your castle";
      detail.textContent = "Select open land to found your settlement.";
    }
  }
}

function applyCommandResultState(root: HTMLElement, result: SerfboundCommandResult): void {
  root.dataset.serfboundCommandState = result.status;
  if (result.status === "accepted") {
    root.dataset.serfboundLastEffect = result.effect;
  } else {
    delete root.dataset.serfboundLastEffect;
  }
  root.dataset.serfboundCommandId = String(result.commandId);
  root.dataset.serfboundCommandLogLength = String(result.snapshot.commandLogLength);
  root.dataset.serfboundBuiltStructureCount = String(result.snapshot.builtStructures.length);

  if (result.status === "accepted") {
    root.dataset.serfboundCommandType = result.command.type;
    delete root.dataset.serfboundCommandReason;
    if (result.effect === "flag-built" && result.builtStructure !== undefined) {
      const tile = result.builtStructure.tile;
      root.dataset.serfboundLastBuiltStructure = `flag:${tile.column},${tile.row}`;
      getCommandStateElement(root).textContent = "Flag built";
      getCommandDetailElement(root).textContent =
        `Flag placed at tile ${tile.column},${tile.row}.`;
      return;
    }

    if (result.effect === "castle-built") {
      getCommandStateElement(root).textContent = "Castle founded";
      getCommandDetailElement(root).textContent =
        `Your castle stands at tile ${result.command.tile.column},${result.command.tile.row}.`;
      return;
    }

    if (result.effect === "world-flag-built") {
      getCommandStateElement(root).textContent = "Flag built";
      getCommandDetailElement(root).textContent =
        `Flag placed at tile ${result.command.tile.column},${result.command.tile.row}.`;
      return;
    }

    if (result.effect === "road-built") {
      getCommandStateElement(root).textContent = "Road built";
      getCommandDetailElement(root).textContent = "Your flags are connected.";
      return;
    }

    if (result.effect === "building-built") {
      getCommandStateElement(root).textContent = "Construction started";
      getCommandDetailElement(root).textContent =
        `Builders raise a new building at tile ${result.command.tile.column},${result.command.tile.row}.`;
      return;
    }

    getCommandStateElement(root).textContent = "Inspect land";
    getCommandDetailElement(root).textContent =
      `Tile ${result.command.tile.column},${result.command.tile.row} is selected.`;
    return;
  }

  if (result.commandType === undefined) {
    delete root.dataset.serfboundCommandType;
  } else {
    root.dataset.serfboundCommandType = result.commandType;
  }

  root.dataset.serfboundCommandReason = result.reason;
  getCommandStateElement(root).textContent = "Action unavailable";
  getCommandDetailElement(root).textContent =
    result.reason === "tile-occupied"
      ? "That tile already has a flag. Select another tile."
      : result.message;
}

function syncBuildFlagEnabled(
  root: HTMLElement,
  selectedInteraction: PointerMapInteraction | undefined,
  builtStructures: readonly SerfboundBuiltStructure[],
): void {
  const buildFlagButton = getBuildFlagButton(root);
  const selectedTile = selectedInteraction?.tile;
  const isRunning = root.dataset.serfboundGameState === "running";
  const tileOccupied =
    selectedTile !== undefined &&
    builtStructures.some((structure) => structure.tile.position === selectedTile.position);
  const canBuild = isRunning && selectedTile !== undefined && !tileOccupied;
  buildFlagButton.disabled = !canBuild;

  if (selectedTile === undefined || root.dataset.serfboundCommandState !== "accepted") {
    return;
  }

  if (canBuild) {
    getCommandStateElement(root).textContent = "Build flag available";
    getCommandDetailElement(root).textContent =
      `Place a flag at tile ${selectedTile.column},${selectedTile.row}.`;
    return;
  }

  if (tileOccupied && root.dataset.serfboundCommandType !== "game.build") {
    getCommandStateElement(root).textContent = "Flag built";
    getCommandDetailElement(root).textContent =
      `Flag already stands at tile ${selectedTile.column},${selectedTile.row}.`;
  }
}

function applyLocalGameStartResult(
  root: HTMLElement,
  result: SerfboundLocalGameStartResult,
  typedAssetCatalog: TypedAssetCatalog | undefined,
): void {
  if (result.status === "rejected") {
    root.dataset.serfboundLocalGameState = "rejected";
    root.dataset.serfboundLocalGameRejectReason = result.reason;
    root.dataset.serfboundGameState = "setup";
    getGameStateElement(root).textContent = "Data needed";
    getGameDetailElement(root).textContent = "Import SPAU.PA before starting a local game.";
    getStartGameButton(root).disabled = typedAssetCatalog === undefined;
    return;
  }

  applyRunningLocalGameSnapshot(root, result.snapshot);
}

function applyRunningLocalGameSnapshot(
  root: HTMLElement,
  snapshot: SerfboundLocalGameSnapshot,
): void {
  root.dataset.serfboundGameState = "running";
  root.dataset.serfboundStartMode = "imported-data";
  root.dataset.serfboundLocalGameState = "running";
  root.dataset.serfboundLocalGameMode = snapshot.mode;
  root.dataset.serfboundLocalGameSeed = snapshot.settings.seedString;
  root.dataset.serfboundLocalGameMapSize = String(snapshot.settings.mapSize);
  root.dataset.serfboundLocalGameMapTiles = String(snapshot.state.map.tileCount);
  root.dataset.serfboundLocalGameDataEntries = String(snapshot.data.entryCount);
  delete root.dataset.serfboundLocalGameRejectReason;
  getGameStateElement(root).textContent = "Running";
  getGameDetailElement(root).textContent =
    `Local game started: map ${snapshot.state.map.columns}x${snapshot.state.map.rows}.`;
  getSceneStateElement(root).textContent = "Settlement map";
  getSceneDetailElement(root).textContent =
    `${snapshot.data.definedArchiveEntries} resources initialized with seed ${snapshot.settings.seedString}.`;
  const startButton = getStartGameButton(root);
  startButton.textContent = "Running";
  startButton.disabled = true;
}

function applyLocalGameSaveAvailableState(
  root: HTMLElement,
  record: StoredLocalGameSaveRecord,
): void {
  root.dataset.serfboundLocalSaveState = "available";
  root.dataset.serfboundLocalSaveSavedAt = record.savedAtIso;
  root.dataset.serfboundLocalSaveSource = record.dataSource.archiveName;
  getSaveStateElement(root).textContent = "Saved game";
  getSaveDetailElement(root).textContent =
    `${record.snapshot.state.builtStructures.length} built structures saved.`;
}

function applyLocalGameLoadedState(
  root: HTMLElement,
  record: StoredLocalGameSaveRecord,
): void {
  root.dataset.serfboundLocalSaveState = "loaded";
  root.dataset.serfboundLocalSaveSavedAt = record.savedAtIso;
  root.dataset.serfboundLocalSaveSource = record.dataSource.archiveName;
  getSaveStateElement(root).textContent = "Game loaded";
  getSaveDetailElement(root).textContent =
    `${record.snapshot.state.builtStructures.length} built structures restored.`;
}

function applyNoLocalGameSaveState(
  root: HTMLElement,
  stateText: string,
  detailText: string,
): void {
  root.dataset.serfboundLocalSaveState = "empty";
  getSaveStateElement(root).textContent = stateText;
  getSaveDetailElement(root).textContent = detailText;
}

function applyLocalGameSaveErrorState(root: HTMLElement, message: string): void {
  root.dataset.serfboundLocalSaveState = "error";
  root.dataset.serfboundRecoverableState = "save-error";
  root.dataset.serfboundLocalSaveMessage = message;
  getSaveStateElement(root).textContent = "Save unavailable";
  getSaveDetailElement(root).textContent = message;
}

function syncLocalGameSaveControls(
  root: HTMLElement,
  currentLocalGameSnapshot: SerfboundLocalGameSnapshot | undefined,
  currentSavedLocalGame: StoredLocalGameSaveRecord | undefined,
  currentImportedDataSource: SerfboundLocalGameDataSource | undefined,
): void {
  getSaveGameButton(root).disabled =
    root.dataset.serfboundGameState !== "running" || currentLocalGameSnapshot === undefined;
  getLoadGameButton(root).disabled =
    currentSavedLocalGame === undefined ||
    currentImportedDataSource === undefined ||
    !localGameDataSourcesMatch(currentImportedDataSource, currentSavedLocalGame.dataSource);
  getClearSaveButton(root).disabled =
    currentSavedLocalGame === undefined && root.dataset.serfboundLocalSaveState !== "error";
}

function localGameDataSourcesMatch(
  left: SerfboundLocalGameDataSource,
  right: SerfboundLocalGameDataSource,
): boolean {
  return (
    left.kind === right.kind &&
    left.archiveName === right.archiveName &&
    left.byteLength === right.byteLength &&
    left.entryCount === right.entryCount &&
    left.definedArchiveEntries === right.definedArchiveEntries &&
    left.fixupCount === right.fixupCount
  );
}

function syncGameReadiness(root: HTMLElement): void {
  if (root.dataset.serfboundGameState === "running") {
    return;
  }

  const hasImportedData = root.dataset.serfboundDataState === "supported";
  root.dataset.serfboundGameState = hasImportedData ? "ready" : "setup";
  root.dataset.serfboundStartMode = hasImportedData ? "imported-data" : "import-required";
  root.dataset.serfboundLocalGameState = "none";
  getGameStateElement(root).textContent = hasImportedData ? "Ready" : "Data needed";
  getGameDetailElement(root).textContent = hasImportedData
    ? "Imported data is ready. Start when prepared."
    : "Import game data first.";
  const startButton = getStartGameButton(root);
  startButton.textContent = "Start game";
  startButton.disabled = !hasImportedData;
}

function localGameDataSourceFromCatalog(
  catalog: DosPaCatalog,
  archiveName: string,
): SerfboundLocalGameDataSource {
  return {
    kind: "imported-dos-pa-catalog",
    archiveName,
    byteLength: catalog.header.declaredSize,
    entryCount: catalog.header.entryCount,
    definedArchiveEntries: catalog.entrySummary.defined,
    fixupCount: catalog.fixupSummary.count,
  };
}

function getPointerStateElement(root: HTMLElement): HTMLElement {
  const state = root.querySelector<HTMLElement>("[data-testid='pointer-state']");
  if (state === null) {
    throw new Error("Serfbound shell pointer state did not mount.");
  }

  return state;
}

function getPointerDetailElement(root: HTMLElement): HTMLElement {
  const detail = root.querySelector<HTMLElement>("[data-testid='pointer-detail']");
  if (detail === null) {
    throw new Error("Serfbound shell pointer detail did not mount.");
  }

  return detail;
}

function getSelectedTileStateElement(root: HTMLElement): HTMLElement {
  const state = root.querySelector<HTMLElement>("[data-testid='selected-tile-state']");
  if (state === null) {
    throw new Error("Serfbound shell selected tile state did not mount.");
  }

  return state;
}

function getSelectedTileDetailElement(root: HTMLElement): HTMLElement {
  const detail = root.querySelector<HTMLElement>("[data-testid='selected-tile-detail']");
  if (detail === null) {
    throw new Error("Serfbound shell selected tile detail did not mount.");
  }

  return detail;
}

function getCommandStateElement(root: HTMLElement): HTMLElement {
  const state = root.querySelector<HTMLElement>("[data-testid='command-state']");
  if (state === null) {
    throw new Error("Serfbound shell command state did not mount.");
  }

  return state;
}

function getCommandDetailElement(root: HTMLElement): HTMLElement {
  const detail = root.querySelector<HTMLElement>("[data-testid='command-detail']");
  if (detail === null) {
    throw new Error("Serfbound shell command detail did not mount.");
  }

  return detail;
}

function getSaveStateElement(root: HTMLElement): HTMLElement {
  const state = root.querySelector<HTMLElement>("[data-testid='save-state']");
  if (state === null) {
    throw new Error("Serfbound shell save state did not mount.");
  }

  return state;
}

function getSaveDetailElement(root: HTMLElement): HTMLElement {
  const detail = root.querySelector<HTMLElement>("[data-testid='save-detail']");
  if (detail === null) {
    throw new Error("Serfbound shell save detail did not mount.");
  }

  return detail;
}

function getGameStateElement(root: HTMLElement): HTMLElement {
  const state = root.querySelector<HTMLElement>("[data-testid='game-state']");
  if (state === null) {
    throw new Error("Serfbound shell game state did not mount.");
  }

  return state;
}

function getGameDetailElement(root: HTMLElement): HTMLElement {
  const detail = root.querySelector<HTMLElement>("[data-testid='game-detail']");
  if (detail === null) {
    throw new Error("Serfbound shell game detail did not mount.");
  }

  return detail;
}

function getSceneStateElement(root: HTMLElement): HTMLElement {
  const state = root.querySelector<HTMLElement>("[data-testid='scene-state']");
  if (state === null) {
    throw new Error("Serfbound shell scene state did not mount.");
  }

  return state;
}

function getSceneDetailElement(root: HTMLElement): HTMLElement {
  const detail = root.querySelector<HTMLElement>("[data-testid='scene-detail']");
  if (detail === null) {
    throw new Error("Serfbound shell scene detail did not mount.");
  }

  return detail;
}

function getStartGameButton(root: HTMLElement): HTMLButtonElement {
  const button = root.querySelector<HTMLButtonElement>("[data-testid='start-game-button']");
  if (button === null) {
    throw new Error("Serfbound shell start button did not mount.");
  }

  return button;
}

function getBuildFlagButton(root: HTMLElement): HTMLButtonElement {
  const button = root.querySelector<HTMLButtonElement>("[data-testid='build-flag-button']");
  if (button === null) {
    throw new Error("Serfbound shell build flag button did not mount.");
  }

  return button;
}

function getSaveGameButton(root: HTMLElement): HTMLButtonElement {
  const button = root.querySelector<HTMLButtonElement>("[data-testid='save-game-button']");
  if (button === null) {
    throw new Error("Serfbound shell save game button did not mount.");
  }

  return button;
}

function getLoadGameButton(root: HTMLElement): HTMLButtonElement {
  const button = root.querySelector<HTMLButtonElement>("[data-testid='load-game-button']");
  if (button === null) {
    throw new Error("Serfbound shell load game button did not mount.");
  }

  return button;
}

function getClearSaveButton(root: HTMLElement): HTMLButtonElement {
  const button = root.querySelector<HTMLButtonElement>("[data-testid='clear-save-button']");
  if (button === null) {
    throw new Error("Serfbound shell clear save button did not mount.");
  }

  return button;
}

function observeSceneResize(canvas: HTMLCanvasElement, renderCurrentScene: () => void): void {
  if (typeof ResizeObserver === "undefined") {
    globalThis.addEventListener("resize", renderCurrentScene);
    return;
  }

  let animationFrame = 0;
  const observer = new ResizeObserver(() => {
    if (animationFrame !== 0) {
      cancelAnimationFrame(animationFrame);
    }

    animationFrame = requestAnimationFrame(() => {
      animationFrame = 0;
      renderCurrentScene();
    });
  });

  observer.observe(canvas);
}

function resizeCanvasToDisplayedSize(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));

  if (canvas.width !== width) {
    canvas.width = width;
  }

  if (canvas.height !== height) {
    canvas.height = height;
  }

  return { width, height };
}

function getDataStateElement(root: HTMLElement): HTMLElement {
  const state = root.querySelector<HTMLElement>("[data-testid='data-state']");
  if (state === null) {
    throw new Error("Serfbound shell data state did not mount.");
  }

  return state;
}

function getDataDetailElement(root: HTMLElement): HTMLElement {
  const detail = root.querySelector<HTMLElement>("[data-testid='data-detail']");
  if (detail === null) {
    throw new Error("Serfbound shell data detail did not mount.");
  }

  return detail;
}

function setSourceState(root: HTMLElement, text: string): void {
  const sourceState = root.querySelector<HTMLElement>("[data-testid='source-state']");
  if (sourceState === null) {
    throw new Error("Serfbound shell source state did not mount.");
  }

  sourceState.textContent = text;
}

function setResetEnabled(root: HTMLElement, enabled: boolean): void {
  const resetButton = root.querySelector<HTMLButtonElement>("[data-testid='data-reset-button']");
  if (resetButton === null) {
    throw new Error("Serfbound shell reset button did not mount.");
  }

  resetButton.disabled = !enabled;
}
