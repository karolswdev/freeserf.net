import {
  assetImportBoundary,
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
          aria-label="Generated terrain preview"
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

  drawGeneratedTerrain(canvas);

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
      setSourceState(root, "Local file");
      setResetEnabled(root, false);
      break;
    case "missing":
      state.textContent = "No game data imported";
      detail.textContent = "Select SPAU.PA from your local files.";
      root.dataset.serfboundCatalogState = "unread";
      root.dataset.serfboundStorageState = "empty";
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
    applyParsedCatalogState(root, parseDosPaCatalog(record.bytes), "restored", record);
  } catch (error) {
    root.dataset.serfboundDataState = "unsupported";
    root.dataset.serfboundCatalogState = "invalid";
    root.dataset.serfboundStorageState = "error";
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

function drawGeneratedTerrain(canvas: HTMLCanvasElement): void {
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("Serfbound shell requires a 2D canvas context.");
  }

  const width = canvas.width;
  const height = canvas.height;
  context.fillStyle = "#18211d";
  context.fillRect(0, 0, width, height);

  const tileWidth = 88;
  const tileHeight = 44;
  const originX = width / 2;
  const originY = 76;
  const terrain = ["#315f47", "#4b7a52", "#6d884d", "#8b7442", "#3e6a69"];

  for (let row = 0; row < 9; row += 1) {
    for (let column = 0; column < 9; column += 1) {
      const x = originX + (column - row) * (tileWidth / 2);
      const y = originY + (column + row) * (tileHeight / 2);
      const colorIndex = (column * 3 + row * 5 + (column ^ row)) % terrain.length;
      drawDiamond(
        context,
        x,
        y,
        tileWidth,
        tileHeight,
        terrain[colorIndex] ?? "#315f47",
      );
    }
  }

  context.strokeStyle = "#dbc477";
  context.lineWidth = 8;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(originX - 176, originY + 220);
  context.lineTo(originX - 88, originY + 264);
  context.lineTo(originX + 10, originY + 218);
  context.lineTo(originX + 122, originY + 278);
  context.stroke();

  drawMarker(context, originX - 178, originY + 194, "#d7ecf2");
  drawMarker(context, originX + 10, originY + 188, "#f3d177");
  drawMarker(context, originX + 148, originY + 254, "#c74d3d");
}

function drawDiamond(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
): void {
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x + width / 2, y + height / 2);
  context.lineTo(x, y + height);
  context.lineTo(x - width / 2, y + height / 2);
  context.closePath();
  context.fillStyle = fill;
  context.fill();
  context.strokeStyle = "rgba(250, 242, 209, 0.16)";
  context.lineWidth = 1;
  context.stroke();
}

function drawMarker(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
): void {
  context.fillStyle = "rgba(0, 0, 0, 0.26)";
  context.beginPath();
  context.ellipse(x + 6, y + 36, 24, 8, 0, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = color;
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x + 18, y + 42);
  context.lineTo(x - 18, y + 42);
  context.closePath();
  context.fill();
}
