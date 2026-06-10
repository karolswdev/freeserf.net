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
  uint16,
  type SerfboundCommandResult,
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
type SceneRenderCatalog = (typedAssetCatalog: TypedAssetCatalog) => void;

export function mountSerfbound(root: HTMLElement, options: MountSerfboundOptions = {}): void {
  const importedArchiveStore =
    options.importedArchiveStore ?? new BrowserIndexedDbImportedArchiveStore();
  const summary = bootstrapSummary();
  root.dataset.serfboundRuntime = summary.runtime;
  root.dataset.serfboundDataState = summary.dataState;
  root.dataset.serfboundCatalogState = "unread";
  root.dataset.serfboundStorageState = "empty";
  root.dataset.serfboundGameState = "setup";
  root.dataset.serfboundStartMode = "practice";
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
        <p class="status-panel__detail" data-testid="data-detail">Import SPAU.PA when ready. Practice is available now.</p>
        <div>
          <p class="status-panel__label">Game</p>
          <p class="status-panel__value" data-testid="game-state">Setup</p>
        </div>
        <p class="status-panel__detail" data-testid="game-detail">Start a practice settlement or import data first.</p>
        <div>
          <p class="status-panel__label">Source</p>
          <p class="status-panel__value" data-testid="source-state">Practice</p>
        </div>
        <div>
          <p class="status-panel__label">Map</p>
          <p class="status-panel__value" data-testid="scene-state">Practice terrain</p>
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
          class="primary-action"
          data-testid="start-game-button"
          type="button"
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
  const commandRouter = new SerfboundCommandRouter();
  root.dataset.serfboundEnginePackage = summary.enginePackage;

  let currentTypedAssetCatalog: TypedAssetCatalog | undefined;
  const renderCurrentScene = () => {
    renderScene(root, currentTypedAssetCatalog);
  };
  const renderGeneratedScene = () => {
    currentTypedAssetCatalog = undefined;
    renderCurrentScene();
  };
  const renderCatalogScene = (typedAssetCatalog: TypedAssetCatalog) => {
    currentTypedAssetCatalog = typedAssetCatalog;
    renderCurrentScene();
  };

  renderGeneratedScene();
  observeSceneResize(canvas, renderCurrentScene);
  attachPointerMapInteraction(root, canvas, commandRouter);

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
    applyRunningGameState(root);
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
      detail.textContent = `${result.fileName} cannot be used. Choose SPAU.PA or keep practicing.`;
      root.dataset.serfboundCatalogState = "unread";
      root.dataset.serfboundStorageState = "empty";
      root.dataset.serfboundRecoverableState = "file-error";
      renderGeneratedScene();
      setSourceState(root, "Practice");
      syncGameReadiness(root);
      setResetEnabled(root, false);
      break;
    case "missing":
      state.textContent = "No game data";
      detail.textContent = "Import SPAU.PA when ready. Practice is available now.";
      root.dataset.serfboundCatalogState = "unread";
      root.dataset.serfboundStorageState = "empty";
      root.dataset.serfboundRecoverableState = "none";
      renderGeneratedScene();
      setSourceState(root, "Practice");
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
    renderCatalogScene(buildTypedAssetCatalog(catalog));
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
    detail.textContent = "Choose SPAU.PA again or keep practicing.";
    root.dataset.serfboundDataError = errorMessage(error);
    setSourceState(root, "Practice");
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
    renderCatalogScene(buildTypedAssetCatalog(catalog));
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
  getDataDetailElement(root).textContent = "Saved data cleared. Practice is available now.";
  setSourceState(root, "Practice");
  syncGameReadiness(root);
  setResetEnabled(root, false);
}

function applyStorageErrorState(root: HTMLElement, message: string): void {
  root.dataset.serfboundStorageState = "error";
  root.dataset.serfboundRecoverableState = "storage-error";
  root.dataset.serfboundStorageMessage = message;
  getDataStateElement(root).textContent = "Saved data unavailable";
  getDataDetailElement(root).textContent = "Practice is available now. Try importing SPAU.PA again.";
  setSourceState(root, "Practice");
  syncGameReadiness(root);
}

function renderScene(root: HTMLElement, typedAssetCatalog: TypedAssetCatalog | undefined): void {
  const canvas = root.querySelector<HTMLCanvasElement>("[data-testid='terrain-preview']");
  if (canvas === null) {
    throw new Error("Serfbound shell canvas did not mount.");
  }

  const size = resizeCanvasToDisplayedSize(canvas);
  const scene =
    typedAssetCatalog === undefined
      ? createFirstRenderLayerScene({ size })
      : createFirstRenderLayerScene({ size, typedAssetCatalog });

  renderFirstRenderLayerScene(canvas, scene);
  root.dataset.serfboundRenderer = scene.renderer;
  root.dataset.serfboundSceneSource = scene.assetSummary.source;
  root.dataset.serfboundLayerCount = String(scene.layers.length);
  root.dataset.serfboundPrimitiveCount = String(scene.primitives.length);
  root.dataset.serfboundCanvasWidth = String(canvas.width);
  root.dataset.serfboundCanvasHeight = String(canvas.height);

  const sceneState = root.querySelector<HTMLElement>("[data-testid='scene-state']");
  const sceneDetail = root.querySelector<HTMLElement>("[data-testid='scene-detail']");
  if (sceneState === null || sceneDetail === null) {
    throw new Error("Serfbound shell scene status did not mount.");
  }

  sceneState.textContent =
    scene.assetSummary.source === "dos-pa-catalog" ? "Imported terrain" : "Practice terrain";
  sceneDetail.textContent =
    scene.assetSummary.source === "dos-pa-catalog"
      ? `${scene.assetSummary.definedArchiveEntries ?? 0} resources are ready for play.`
      : "Select land to inspect it.";
}

function attachPointerMapInteraction(
  root: HTMLElement,
  canvas: HTMLCanvasElement,
  commandRouter: SerfboundCommandRouter,
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
      commandRouter.dispatch({
        type: "debug.inspect-map-tile",
        source: "pointer",
        map: interaction.map,
        tile: interaction.tile,
      }),
    );
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

  if (result.status === "accepted") {
    root.dataset.serfboundCommandType = result.command.type;
    delete root.dataset.serfboundCommandReason;
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
  getCommandDetailElement(root).textContent = "Try another action or select a different tile.";
}

function applyRunningGameState(root: HTMLElement): void {
  const startMode = root.dataset.serfboundDataState === "supported" ? "imported-data" : "practice";
  root.dataset.serfboundGameState = "running";
  root.dataset.serfboundStartMode = startMode;
  getGameStateElement(root).textContent = "Running";
  getGameDetailElement(root).textContent =
    startMode === "imported-data"
      ? "Settlement running with imported data."
      : "Practice settlement running.";
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
  root.dataset.serfboundStartMode = hasImportedData ? "imported-data" : "practice";
  getGameStateElement(root).textContent = hasImportedData ? "Ready" : "Setup";
  getGameDetailElement(root).textContent = hasImportedData
    ? "Imported data is ready. Start when prepared."
    : "Start a practice settlement or import data first.";
  const startButton = getStartGameButton(root);
  startButton.textContent = "Start game";
  startButton.disabled = false;
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

function getStartGameButton(root: HTMLElement): HTMLButtonElement {
  const button = root.querySelector<HTMLButtonElement>("[data-testid='start-game-button']");
  if (button === null) {
    throw new Error("Serfbound shell start button did not mount.");
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
