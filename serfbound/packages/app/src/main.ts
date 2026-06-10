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
  engineBoundary,
  SerfboundCommandRouter,
  startSerfboundLocalGame,
  uint16,
  type SerfboundBuiltStructure,
  type SerfboundCommandResult,
  type SerfboundLocalGameDataSource,
  type SerfboundLocalGameStartResult,
} from "@serfbound/engine";
import {
  BrowserIndexedDbImportedArchiveStore,
  clearImportedArchiveRecord,
  createStoredImportedArchiveRecord,
  errorMessage,
  saveImportedArchiveRecord,
  type ImportedArchiveStore,
  type StoredImportedArchiveRecord,
} from "./imported-data-store.js";
import {
  createFirstRenderLayerScene,
  renderFirstRenderLayerScene,
  resolveFirstRenderLayerPointer,
  type PointerMapInteraction,
} from "./render-layer-scene.js";

export {
  BrowserIndexedDbImportedArchiveStore,
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
  createFirstRenderLayerScene,
  renderFirstRenderLayerScene,
  resolveFirstRenderLayerPointer,
  renderLayerOrder,
  type FirstRenderLayerScene,
  type PointerMapInteraction,
  type RenderLayerKey,
  type RenderSceneAssetSummary,
  type RenderSceneLayer,
  type RenderScenePrimitive,
  type RenderSceneSource,
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
};

type SceneRenderGenerated = () => void;
type SceneRenderCatalog = (
  typedAssetCatalog: TypedAssetCatalog,
  catalog: DosPaCatalog,
  archiveName: string,
) => void;
type PointerMapInteractionHandlers = {
  readonly commandRouter: () => SerfboundCommandRouter;
  readonly onSelection: (interaction: PointerMapInteraction) => void;
};

export function mountSerfbound(root: HTMLElement, options: MountSerfboundOptions = {}): void {
  const importedArchiveStore =
    options.importedArchiveStore ?? new BrowserIndexedDbImportedArchiveStore();
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
        <input
          id="data-import"
          class="import-input"
          data-testid="data-import-input"
          type="file"
          accept=".PA,.pa"
        />
        <button
          class="secondary-action"
          data-testid="build-flag-button"
          type="button"
          disabled
        >Build flag</button>
        <button
          class="primary-action"
          data-testid="start-game-button"
          type="button"
          disabled
        >Start game</button>
        <label class="secondary-action" for="data-import">Import data</label>
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
  let currentImportedDataSource: SerfboundLocalGameDataSource | undefined;
  let currentBuiltStructures: readonly SerfboundBuiltStructure[] = [];
  let selectedInteraction: PointerMapInteraction | undefined;
  const renderCurrentScene = () => {
    renderScene(root, currentTypedAssetCatalog, currentBuiltStructures);
  };
  const renderGeneratedScene = () => {
    currentTypedAssetCatalog = undefined;
    currentImportedDataSource = undefined;
    currentBuiltStructures = [];
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
    renderCurrentScene();
  };
  const renderCatalogScene = (
    typedAssetCatalog: TypedAssetCatalog,
    catalog: DosPaCatalog,
    archiveName: string,
  ) => {
    currentTypedAssetCatalog = typedAssetCatalog;
    currentImportedDataSource = localGameDataSourceFromCatalog(catalog, archiveName);
    renderCurrentScene();
  };

  renderGeneratedScene();
  observeSceneResize(canvas, renderCurrentScene);
  attachPointerMapInteraction(root, canvas, {
    commandRouter: () => commandRouter,
    onSelection(interaction) {
      selectedInteraction = interaction;
      syncBuildFlagEnabled(root, selectedInteraction, currentBuiltStructures);
    },
  });

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

  startButton.addEventListener("click", () => {
    const result = startSerfboundLocalGame(
      currentImportedDataSource === undefined ? {} : { data: currentImportedDataSource },
    );
    if (result.status === "started") {
      commandRouter = new SerfboundCommandRouter(result.game.state);
      currentBuiltStructures = [];
    }
    applyLocalGameStartResult(root, result, currentTypedAssetCatalog);
    syncBuildFlagEnabled(root, selectedInteraction, currentBuiltStructures);
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

    const result = commandRouter.dispatch({
      type: "game.build",
      source: "pointer",
      building: "flag",
      tile: interaction.tile,
    });
    currentBuiltStructures = result.snapshot.builtStructures;
    applyCommandResultState(root, result);
    renderCurrentScene();
    syncBuildFlagEnabled(root, selectedInteraction, currentBuiltStructures);
  });

  void restorePersistedArchive(
    root,
    importedArchiveStore,
    renderCatalogScene,
    renderGeneratedScene,
  );
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
    renderCatalogScene(buildTypedAssetCatalog(catalog), catalog, validation.normalizedName);
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
    applyStorageErrorState(root, `Local data restore failed: ${errorMessage(error)}`);
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
    renderCatalogScene(buildTypedAssetCatalog(catalog), catalog, record.normalizedName);
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

function applyStorageErrorState(root: HTMLElement, message: string): void {
  root.dataset.serfboundStorageState = "error";
  root.dataset.serfboundRecoverableState = "storage-error";
  root.dataset.serfboundStorageMessage = message;
  getDataStateElement(root).textContent = "Saved data unavailable";
  getDataDetailElement(root).textContent = "Try importing SPAU.PA again.";
  setSourceState(root, "No data");
  syncGameReadiness(root);
}

function renderScene(
  root: HTMLElement,
  typedAssetCatalog: TypedAssetCatalog | undefined,
  builtStructures: readonly SerfboundBuiltStructure[] = [],
): void {
  const canvas = root.querySelector<HTMLCanvasElement>("[data-testid='terrain-preview']");
  if (canvas === null) {
    throw new Error("Serfbound shell canvas did not mount.");
  }

  const size = resizeCanvasToDisplayedSize(canvas);
  const scene =
    typedAssetCatalog === undefined
      ? createFirstRenderLayerScene({ size, builtStructures })
      : createFirstRenderLayerScene({ size, typedAssetCatalog, builtStructures });

  renderFirstRenderLayerScene(canvas, scene);
  root.dataset.serfboundRenderer = scene.renderer;
  root.dataset.serfboundSceneSource = scene.assetSummary.source;
  root.dataset.serfboundLayerCount = String(scene.layers.length);
  root.dataset.serfboundPrimitiveCount = String(scene.primitives.length);
  root.dataset.serfboundBuiltStructureCount = String(builtStructures.length);
  root.dataset.serfboundCanvasWidth = String(canvas.width);
  root.dataset.serfboundCanvasHeight = String(canvas.height);

  const sceneState = root.querySelector<HTMLElement>("[data-testid='scene-state']");
  const sceneDetail = root.querySelector<HTMLElement>("[data-testid='scene-detail']");
  if (sceneState === null || sceneDetail === null) {
    throw new Error("Serfbound shell scene status did not mount.");
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
    const interaction = resolveCanvasPointer(canvas, event);
    applyPointerHoverState(root, interaction, event.pointerType);
  });

  canvas.addEventListener("pointerdown", (event) => {
    const interaction = resolveCanvasPointer(canvas, event);
    applyPointerHoverState(root, interaction, event.pointerType);
    applyPointerSelectionState(root, interaction);
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
): PointerMapInteraction {
  const rect = canvas.getBoundingClientRect();
  return resolveFirstRenderLayerPointer(
    {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    },
    { width: canvas.width, height: canvas.height },
  );
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

function applyCommandResultState(root: HTMLElement, result: SerfboundCommandResult): void {
  root.dataset.serfboundCommandState = result.status;
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

  const snapshot = result.snapshot;
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
