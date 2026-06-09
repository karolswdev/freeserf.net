import {
  assetImportBoundary,
  buildTypedAssetCatalog,
  parseDosPaCatalog,
  validateArchiveFileSelection,
  type ArchiveValidationResult,
  type DosPaCatalog,
} from "@serfbound/assets";
import { engineBoundary, uint16 } from "@serfbound/engine";
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
  type FirstRenderLayerScene,
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
  renderLayerOrder,
  type FirstRenderLayerScene,
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

export function mountSerfbound(root: HTMLElement, options: MountSerfboundOptions = {}): void {
  const importedArchiveStore =
    options.importedArchiveStore ?? new BrowserIndexedDbImportedArchiveStore();
  const summary = bootstrapSummary();
  root.dataset.serfboundRuntime = summary.runtime;
  root.dataset.serfboundDataState = summary.dataState;
  root.dataset.serfboundCatalogState = "unread";
  root.dataset.serfboundStorageState = "empty";
  root.innerHTML = `
    <main class="serfbound-shell" data-testid="serfbound-shell">
      <section class="scene" aria-labelledby="serfbound-title">
        <div class="scene__toolbar">
          <div>
            <p class="scene__kicker">Pure browser shell</p>
            <h1 id="serfbound-title">Serfbound</h1>
          </div>
          <div class="runtime-pill" data-testid="runtime-pill">Browser runtime</div>
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
          <p class="status-panel__value" data-testid="data-state">No game data imported</p>
        </div>
        <p class="status-panel__detail" data-testid="data-detail">Select SPAU.PA from your local files.</p>
        <div>
          <p class="status-panel__label">Source</p>
          <p class="status-panel__value" data-testid="source-state">Local file</p>
        </div>
        <div>
          <p class="status-panel__label">Engine</p>
          <p class="status-panel__value">${summary.enginePackage}</p>
        </div>
        <div>
          <p class="status-panel__label">Scene</p>
          <p class="status-panel__value" data-testid="scene-state">Generated layers</p>
        </div>
        <p class="status-panel__detail" data-testid="scene-detail">WebGL2, generated fixture assets</p>
        <input
          id="data-import"
          class="import-input"
          data-testid="data-import-input"
          type="file"
          accept=".PA,.pa"
        />
        <label class="primary-action" for="data-import">Import data</label>
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

  renderScene(root, createFirstRenderLayerScene());

  const input = root.querySelector<HTMLInputElement>("[data-testid='data-import-input']");
  if (input === null) {
    throw new Error("Serfbound shell import input did not mount.");
  }

  input.addEventListener("change", () => {
    const file = input.files?.item(0);
    const validation = validateArchiveFileSelection(file);
    applyArchiveValidation(root, validation);

    if (validation.state === "supported" && file !== null && file !== undefined) {
      void importSelectedArchive(root, file, validation, importedArchiveStore);
    }
  });

  const resetButton = root.querySelector<HTMLButtonElement>("[data-testid='data-reset-button']");
  if (resetButton === null) {
    throw new Error("Serfbound shell reset button did not mount.");
  }

  resetButton.addEventListener("click", () => {
    void clearSelectedArchive(root, importedArchiveStore);
  });

  void restorePersistedArchive(root, importedArchiveStore);
}

function applyArchiveValidation(root: HTMLElement, result: ArchiveValidationResult): void {
  const state = root.querySelector<HTMLElement>("[data-testid='data-state']");
  const detail = root.querySelector<HTMLElement>("[data-testid='data-detail']");
  if (state === null || detail === null) {
    throw new Error("Serfbound shell data status did not mount.");
  }

  root.dataset.serfboundDataState = result.state;

  switch (result.state) {
    case "supported":
      state.textContent = "Game data selected";
      detail.textContent = `${result.normalizedName} ready for catalog parsing`;
      root.dataset.serfboundCatalogState = "ready";
      setSourceState(root, "Local file");
      break;
    case "unsupported":
      state.textContent = "Unsupported data file";
      detail.textContent = `${result.fileName} is not accepted`;
      root.dataset.serfboundCatalogState = "unread";
      root.dataset.serfboundStorageState = "empty";
      renderScene(root, createFirstRenderLayerScene());
      setSourceState(root, "Local file");
      setResetEnabled(root, false);
      break;
    case "missing":
      state.textContent = "No game data imported";
      detail.textContent = "Select SPAU.PA from your local files.";
      root.dataset.serfboundCatalogState = "unread";
      root.dataset.serfboundStorageState = "empty";
      renderScene(root, createFirstRenderLayerScene());
      setSourceState(root, "Local file");
      setResetEnabled(root, false);
      break;
  }
}

async function importSelectedArchive(
  root: HTMLElement,
  file: File,
  validation: Extract<ArchiveValidationResult, { readonly state: "supported" }>,
  importedArchiveStore: ImportedArchiveStore,
): Promise<void> {
  const state = root.querySelector<HTMLElement>("[data-testid='data-state']");
  const detail = root.querySelector<HTMLElement>("[data-testid='data-detail']");
  if (state === null || detail === null) {
    throw new Error("Serfbound shell data status did not mount.");
  }

  root.dataset.serfboundCatalogState = "parsing";
  detail.textContent = "Parsing local DOS PA catalog";

  try {
    const bytes = await file.arrayBuffer();
    const catalog = parseDosPaCatalog(bytes);
    renderScene(root, createFirstRenderLayerScene({
      typedAssetCatalog: buildTypedAssetCatalog(catalog),
    }));
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
      state.textContent = "Storage error";
      detail.textContent = `Catalog parsed, but local storage failed: ${storageResult.message}`;
      setSourceState(root, "Local file");
      setResetEnabled(root, false);
      return;
    }

    applyParsedCatalogState(root, catalog, "persisted");
  } catch (error) {
    root.dataset.serfboundCatalogState = "invalid";
    root.dataset.serfboundStorageState = "empty";
    renderScene(root, createFirstRenderLayerScene());
    state.textContent = "Catalog parse failed";
    detail.textContent = error instanceof Error ? error.message : "Unknown catalog parse error";
    setSourceState(root, "Local file");
    setResetEnabled(root, false);
  }
}

async function restorePersistedArchive(
  root: HTMLElement,
  importedArchiveStore: ImportedArchiveStore,
): Promise<void> {
  root.dataset.serfboundStorageState = "loading";

  try {
    const record = await importedArchiveStore.loadCurrent();
    if (record === null) {
      root.dataset.serfboundStorageState = "empty";
      return;
    }

    applyStoredArchiveRecord(root, record);
  } catch (error) {
    applyStorageErrorState(root, `Local data restore failed: ${errorMessage(error)}`);
  }
}

function applyStoredArchiveRecord(
  root: HTMLElement,
  record: StoredImportedArchiveRecord,
): void {
  try {
    const catalog = parseDosPaCatalog(record.bytes);
    renderScene(root, createFirstRenderLayerScene({
      typedAssetCatalog: buildTypedAssetCatalog(catalog),
    }));
    applyParsedCatalogState(root, catalog, "restored", record);
  } catch (error) {
    root.dataset.serfboundDataState = "unsupported";
    root.dataset.serfboundCatalogState = "invalid";
    root.dataset.serfboundStorageState = "error";
    renderScene(root, createFirstRenderLayerScene());
    const state = getDataStateElement(root);
    const detail = getDataDetailElement(root);
    state.textContent = "Stored catalog invalid";
    detail.textContent = error instanceof Error ? error.message : "Unknown catalog parse error";
    setSourceState(root, "Local storage");
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
  state.textContent = "Catalog parsed";
  detail.textContent =
    source === "restored" && record !== undefined
      ? `Restored ${record.normalizedName}: ${catalog.header.entryCount} entries, ${catalog.entrySummary.defined} defined`
      : `${catalog.header.entryCount} entries, ${catalog.entrySummary.defined} defined, ${catalog.fixupSummary.count} fixups, persisted locally`;
  setSourceState(root, source === "restored" ? "Local storage" : "Local file");
  setResetEnabled(root, true);
}

async function clearSelectedArchive(
  root: HTMLElement,
  importedArchiveStore: ImportedArchiveStore,
): Promise<void> {
  const result = await clearImportedArchiveRecord(importedArchiveStore);
  if (result.state === "error") {
    applyStorageErrorState(root, `Could not clear local data: ${result.message}`);
    return;
  }

  root.dataset.serfboundDataState = "missing";
  root.dataset.serfboundCatalogState = "unread";
  root.dataset.serfboundStorageState = "cleared";
  renderScene(root, createFirstRenderLayerScene());
  getDataStateElement(root).textContent = "No game data imported";
  getDataDetailElement(root).textContent = "Local data cleared. Select SPAU.PA from your local files.";
  setSourceState(root, "Local file");
  setResetEnabled(root, false);
}

function applyStorageErrorState(root: HTMLElement, message: string): void {
  root.dataset.serfboundStorageState = "error";
  getDataStateElement(root).textContent = "Storage error";
  getDataDetailElement(root).textContent = message;
  setSourceState(root, "Local storage");
}

function renderScene(root: HTMLElement, scene: FirstRenderLayerScene): void {
  const canvas = root.querySelector<HTMLCanvasElement>("[data-testid='terrain-preview']");
  if (canvas === null) {
    throw new Error("Serfbound shell canvas did not mount.");
  }

  renderFirstRenderLayerScene(canvas, scene);
  root.dataset.serfboundRenderer = scene.renderer;
  root.dataset.serfboundSceneSource = scene.assetSummary.source;
  root.dataset.serfboundLayerCount = String(scene.layers.length);
  root.dataset.serfboundPrimitiveCount = String(scene.primitives.length);

  const sceneState = root.querySelector<HTMLElement>("[data-testid='scene-state']");
  const sceneDetail = root.querySelector<HTMLElement>("[data-testid='scene-detail']");
  if (sceneState === null || sceneDetail === null) {
    throw new Error("Serfbound shell scene status did not mount.");
  }

  sceneState.textContent =
    scene.assetSummary.source === "dos-pa-catalog" ? "Catalog layers" : "Generated layers";
  sceneDetail.textContent =
    scene.assetSummary.source === "dos-pa-catalog"
      ? `WebGL2, ${scene.assetSummary.definedArchiveEntries ?? 0} defined archive entries`
      : "WebGL2, generated fixture assets";
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
