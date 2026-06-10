import {
  assetImportBoundary,
  buildTypedAssetCatalog,
  parseDosPaCatalog,
  sfxType,
  validateArchiveFileSelection,
  type ArchiveValidationResult,
  type DosPaCatalog,
  type TypedAssetCatalog,
} from "@serfbound/assets";
import { PointerGestureTracker } from "./gestures.js";
import { SerfboundLoopbackMultiplayer } from "./multiplayer.js";
import { HotseatController } from "./hotseat.js";
import { SerfboundAsyncLoopbackMatch } from "./async-match.js";
import { digestLines } from "./recap.js";
import {
  SerfboundAiPlayer,
  buildingType,
  engineBoundary,
  findSerfboundMission,
  serfboundMissions,
  startSerfboundMission,
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
  uiScaleFor,
  type PanelBuildPossibility,
} from "./panel-bar.js";
import {
  buildPopupPageOrder,
  knightOccupationCycle,
  minimapTileAt,
  pointInPopup,
  popupBuildItemAt,
  popupRect,
  settAudioToggleAt,
  settOccupationRowAt,
  type PopupKind,
} from "./popup.js";

import {
  SerfboundAudioService,
  loadAudioSettings,
  saveAudioSettings,
} from "./audio.js";
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
export * from "./audio.js";
export * from "./gestures.js";
export * from "./multiplayer.js";
export * from "./recap.js";
export * from "./hotseat.js";
export * from "./async-match.js";

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

// PWA: the offline app shell registers in secure contexts; original game
// data never flows through the worker (imports live in IndexedDB).
export function registerServiceWorker(): void {
  try {
    if (
      typeof navigator !== "undefined" &&
      "serviceWorker" in navigator &&
      (globalThis.isSecureContext ?? false)
    ) {
      void navigator.serviceWorker.register("./sw.js").catch(() => {
        // Offline support is progressive; registration failures are quiet.
      });
    }
  } catch {
    // Older browsers simply play online.
  }
}

// Privacy-respecting error intake: errors buffer locally; the player
// copies a context report (no game data, no archive bytes) into an
// issue by explicit action only.
const serfboundVersion = "0.1.0";
const errorBuffer: { message: string; stack: string; at: string }[] = [];

function recordError(message: string, stack: string | undefined): void {
  errorBuffer.push({
    message: message.slice(0, 500),
    stack: (stack ?? "").slice(0, 2000),
    at: new Date().toISOString(),
  });
  if (errorBuffer.length > 10) {
    errorBuffer.shift();
  }
}

export function buildErrorReport(gameFacts: Record<string, string | undefined>): string {
  return JSON.stringify(
    {
      product: "serfbound",
      version: serfboundVersion,
      userAgent: typeof navigator === "undefined" ? "unknown" : navigator.userAgent,
      generatedAt: new Date().toISOString(),
      gameFacts,
      errors: errorBuffer,
      note: "No game data or archive contents are included in this report.",
    },
    null,
    2,
  );
}

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
          <p
            class="visually-hidden"
            data-testid="notification-live"
            aria-live="polite"
          ></p>
          <div
            class="status-panel__detail"
            data-testid="onboarding-banner"
            role="note"
          >First run: 1) locate your original Settlers SPAU.PA file, 2) use Import data below (it stays on this device), 3) press START on the title screen.</div>
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
        <button
          class="secondary-action"
          data-testid="view-scale-button"
          type="button"
        >View scale</button>
        <button
          class="secondary-action"
          data-testid="host-loopback-button"
          type="button"
        >Host 2P (this browser)</button>
        <button
          class="secondary-action"
          data-testid="join-loopback-button"
          type="button"
        >Join 2P (this browser)</button>
        <button
          class="secondary-action"
          data-testid="hotseat-button"
          type="button"
        >Hot-seat 2P (pass and play)</button>
        <button
          class="secondary-action"
          data-testid="async-host-button"
          type="button"
        >Async 2P host (this browser)</button>
        <button
          class="secondary-action"
          data-testid="async-join-button"
          type="button"
        >Async 2P join (this browser)</button>
        <button
          class="secondary-action"
          data-testid="error-report-button"
          type="button"
        >Copy error report</button>
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
  let currentAiPlayers: SerfboundAiPlayer[] = [];
  // Loopback multiplayer (SB-22-04): the active session and which world
  // player this tab controls.
  let currentMultiplayer: SerfboundLoopbackMultiplayer | undefined;
  let currentLocalPlayer = 0;
  // Hot-seat correspondence (SB-23-03).
  let currentHotseat: HotseatController | undefined;
  // Two-tab async correspondence (SB-23-04).
  let currentAsync: SerfboundAsyncLoopbackMatch | undefined;
  // Game speed: ticks per frame scale by the reference-style multiplier
  // (0 pauses). Keys: 1/2/4 set speeds, 0 pauses.
  let gameSpeedMultiplier = 1;
  const setGameSpeed = (multiplier: number) => {
    gameSpeedMultiplier = multiplier;
    root.dataset.serfboundGameSpeed = String(multiplier);
  };
  // Autosave: every 512 sim ticks the running game saves silently.
  let autosaveCount = 0;
  let lastAutosaveTick = 0;
  // AI drivers for every non-human slot of the running game.
  const attachAiPlayers = (game: SerfboundLocalGame) => {
    currentAiPlayers = [];
    const playerCount = game.settings.playerCount ?? 1;
    if (playerCount <= 1 || currentWorld === undefined || currentSerfEngine === undefined) {
      root.dataset.serfboundAiCount = "0";
      return;
    }

    for (let playerIndex = 1; playerIndex < playerCount; playerIndex += 1) {
      currentAiPlayers.push(
        new SerfboundAiPlayer(currentWorld, currentSerfEngine, playerIndex, (action) =>
          game.state.recordWorldAction(action),
        ),
      );
    }

    root.dataset.serfboundAiCount = String(currentAiPlayers.length);
  };
  const setPopup = (popup: PopupKind | undefined) => {
    currentPopup = popup;
    if (popup === undefined) {
      delete root.dataset.serfboundPopup;
    } else {
      root.dataset.serfboundPopup = popup;
    }
  };
  // The browser audio service: DOS clips loaded with decoded assets,
  // unlocked by the first canvas gesture (autoplay policy).
  const audioService = new SerfboundAudioService();
  activeAudioService = audioService;
  try {
    const persisted = loadAudioSettings(globalThis.localStorage);
    if (persisted !== null) {
      audioService.applySettings(persisted);
    }
  } catch {
    // No storage available: defaults apply.
  }
  root.ownerDocument.addEventListener("visibilitychange", () => {
    audioService.setVisible(!root.ownerDocument.hidden);
  });
  globalThis.addEventListener?.("error", (event) => {
    recordError(String(event.message ?? event), (event as ErrorEvent).error?.stack);
    root.dataset.serfboundErrorCount = String(errorBuffer.length);
  });
  globalThis.addEventListener?.("unhandledrejection", (event) => {
    recordError(String((event as PromiseRejectionEvent).reason), undefined);
    root.dataset.serfboundErrorCount = String(errorBuffer.length);
  });
  const errorReportButton = root.querySelector<HTMLButtonElement>(
    "[data-testid='error-report-button']",
  );
  errorReportButton?.addEventListener("click", () => {
    const report = buildErrorReport({
      gameState: root.dataset.serfboundGameState,
      gameTick: root.dataset.serfboundGameTick,
      seed: root.dataset.serfboundLocalGameSeed,
      mapSize: root.dataset.serfboundLocalGameMapSize,
      mission: root.dataset.serfboundInitMission,
      sceneSource: root.dataset.serfboundSceneSource,
    });
    root.dataset.serfboundErrorReportSize = String(report.length);
    void globalThis.navigator?.clipboard?.writeText(report).then(
      () => {
        root.dataset.serfboundErrorReportState = "copied";
      },
      () => {
        root.dataset.serfboundErrorReportState = "clipboard-unavailable";
      },
    );
  });
  const syncAudioState = () => {
    root.dataset.serfboundAudio = audioService.state;
    root.dataset.serfboundMusic = audioService.musicState;
    if (audioService.lastSfx !== null) {
      root.dataset.serfboundLastSfx = String(audioService.lastSfx);
    }
  };
  // The start screen's custom-game choices (GameInitBox settings).
  let startGameNowRef:
    | ((options: { seedString?: string; initialSupplies?: number; mission?: string }) => void)
    | undefined;
  // ?seed=XXXXXXXXXXXXXXXX (16 digits 1-8) pins the start-screen seed:
  // shareable worlds, and deterministic e2e runs. Otherwise random.
  const urlSeed = (() => {
    try {
      const value = new URLSearchParams(globalThis.location?.search ?? "").get("seed");
      return value !== null && /^[1-8]{16}$/.test(value) ? value : undefined;
    } catch {
      return undefined;
    }
  })();
  let initSeedString = urlSeed ?? randomSeedString(Math.random);
  let initSupplies = 20;
  let initMission: string | undefined;
  const initScreenSettings = (): InitScreenSettings | undefined => {
    if (
      currentDecodedAssets === undefined ||
      currentImportedDataSource === undefined ||
      root.dataset.serfboundGameState === "running"
    ) {
      return undefined;
    }

    const mission = initMission === undefined ? undefined : findSerfboundMission(initMission);
    const seedString = mission?.seedString ?? initSeedString;
    const supplies = mission?.players[0]?.supplies ?? initSupplies;
    root.dataset.serfboundInitSeed = seedString;
    root.dataset.serfboundInitSupplies = String(supplies);
    root.dataset.serfboundInitMission = initMission ?? "CUSTOM";
    return {
      seedString,
      initialSupplies: supplies,
      mapSize: 3,
      ...(initMission === undefined ? {} : { mission: initMission }),
    };
  };
  // Notifications surface game events in the game font until replaced.
  let currentNotice: string | undefined;
  let lastDoneBuildingCount = 0;
  const setNotice = (notice: string | undefined) => {
    currentNotice = notice;
    const live = root.querySelector<HTMLElement>("[data-testid='notification-live']");
    if (notice === undefined) {
      delete root.dataset.serfboundNotification;
      if (live !== null) {
        live.textContent = "";
      }
    } else {
      root.dataset.serfboundNotification = notice;
      if (live !== null) {
        live.textContent = notice;
      }
    }
  };
  const syncOnboarding = () => {
    const banner = root.querySelector<HTMLElement>("[data-testid='onboarding-banner']");
    if (banner !== null) {
      banner.hidden = root.dataset.serfboundDataState === "supported";
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
    syncOnboarding();
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
      { sfxMuted: audioService.sfxMuted, musicMuted: audioService.musicMuted },
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
  // SB-21-03: the shell's view-scale control cycles the world zoom
  // (1x/2x/3x), same as the 'v' key.
  root
    .querySelector<HTMLButtonElement>("[data-testid='view-scale-button']")
    ?.addEventListener("click", () => {
      cycleWorldViewScale();
      renderCurrentScene();
    });
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
    // A running lockstep session must keep pumping even in a hidden
    // tab — the peer's simulation waits on our turn bundles (the
    // browser may still throttle the cadence; lockstep holds safely).
    const multiplayerRunning =
      currentMultiplayer !== undefined && currentMultiplayer.status.phase === "running";
    const shouldAnimate =
      currentLandscapeAssets !== undefined &&
      currentLandscapeAssets.waveFrameCount > 0 &&
      ((!reducedMotion && !root.ownerDocument.hidden) || multiplayerRunning);
    if (!shouldAnimate) {
      stopWaveAnimation();
      return;
    }

    // Wave frames advance every 8 ticks in the reference; ticking by 8 every
    // 175ms reproduces the original cadence without per-frame rebuilds. The
    // same driver advances the simulation clock and interim construction.
    waveTimer ??= setInterval(() => {
      currentTick = (currentTick + 8) % 1024;
      if (
        currentWorld !== undefined &&
        root.dataset.serfboundGameState === "running" &&
        gameSpeedMultiplier > 0
      ) {
        if (currentAsync !== undefined && currentAsync.match !== undefined) {
          // Async correspondence: this tab plays only its own windows;
          // between them it waits (or recaps the opponent's move).
          currentAsync.tick(16);
          const match = currentAsync.match;
          currentWorld = match.world;
          currentSerfEngine = match.serfEngine;
          const status = currentAsync.status;
          if (status.mode === "awaiting-move") {
            setNotice("WAITING FOR OPPONENT");
          } else if (status.mode === "move-arrived") {
            setNotice("OPPONENT MOVED - PRESS ENTER");
          } else if (status.mode === "recap") {
            setNotice("RECAP - WATCHING");
          } else if (
            status.mode === "your-window" &&
            root.dataset.serfboundNotification !== "YOUR WINDOW"
          ) {
            setNotice("YOUR WINDOW");
          }

          syncAsyncState();
          syncWorldState(root, currentWorld);
        } else if (currentHotseat !== undefined) {
          // Hot-seat correspondence: the controller owns window play,
          // hand-over, and the recap; the shell renders whichever match
          // is current and keeps command authority on the active player.
          currentHotseat.tick(16);
          const renderMatch = currentHotseat.renderMatch;
          currentWorld = renderMatch.world;
          currentSerfEngine = renderMatch.serfEngine;
          currentLocalPlayer = currentHotseat.activePlayer;
          commandRouter.localPlayer = currentHotseat.activePlayer;
          if (currentHotseat.mode === "handover") {
            setNotice(
              `PLAYER ${currentHotseat.activePlayer + 1} PRESS ENTER - ${currentHotseat.countdownSeconds ?? 0}`,
            );
          } else if (currentHotseat.mode === "recap") {
            setNotice(`RECAP - PLAYER ${(currentHotseat.activePlayer + 1)} WATCHES`);
          } else if (
            currentHotseat.mode === "your-window" &&
            root.dataset.serfboundNotification?.startsWith("RECAP") === true
          ) {
            setNotice(`PLAYER ${currentHotseat.activePlayer + 1} - YOUR WINDOW`);
          }

          syncHotseatState();
          syncWorldState(root, currentWorld);
        } else if (
          currentMultiplayer !== undefined &&
          currentMultiplayer.status.phase === "running" &&
          currentSerfEngine !== undefined
        ) {
          // Lockstep mode: the session pump owns tick advancement (it
          // holds at turn boundaries whose inputs are missing) and runs
          // the engine at fixed 16-tick boundaries so both peers update
          // identically. Speed stays at 1x — peers must consume turns
          // at the same rate.
          currentMultiplayer.pump({
            state: commandRouter.state,
            world: currentWorld,
            engine: currentSerfEngine,
            deltaTicks: 8,
          });
          syncWorldState(root, currentWorld);
          syncMultiplayerState();
        } else {
        for (let step = 0; step < 8 * gameSpeedMultiplier; step += 1) {
          commandRouter.state.advanceTick();
        }

        if (currentSerfEngine !== undefined) {
          for (const ai of currentAiPlayers) {
            ai.update(commandRouter.state.tick);
          }

          if (currentSerfEngine.onProduct === undefined) {
            let lastWorkSfxAt = 0;
            currentSerfEngine.onProduct = (_buildingTypeValue, product) => {
              const now = Date.now();
              if (now - lastWorkSfxAt < 700) {
                return;
              }

              const clip = productionSfx[product];
              if (clip !== undefined) {
                lastWorkSfxAt = now;
                audioService.playSfx(clip);
              }
            };
          }

          currentSerfEngine.update(commandRouter.state.tick);
          syncWorldState(root, currentWorld);

          // Notifications: surface completed buildings and defeat.
          if (currentWorld !== undefined) {
            const doneCount = [...currentWorld.buildings.values()].filter(
              (building) => building.isDone,
            ).length;
            if (doneCount > lastDoneBuildingCount && lastDoneBuildingCount > 0) {
              setNotice("BUILDING COMPLETE");
              audioService.playSfx(sfxType.hammerBlow);
              syncAudioState();
            }

            lastDoneBuildingCount = doneCount;
            if (currentWorld.players[0]?.defeated === true) {
              if (root.dataset.serfboundNotification !== "GAME OVER") {
                audioService.playSfx(sfxType.ahhh);
                syncAudioState();
              }

              setNotice("GAME OVER");
            }
          }
        }
        }

        // Autosave the running session every 512 ticks.
        if (commandRouter.state.tick - lastAutosaveTick >= 512) {
          lastAutosaveTick = commandRouter.state.tick;
          const snapshot = refreshLocalGameSnapshot(currentLocalGameSnapshot, commandRouter);
          if (snapshot !== undefined) {
            currentLocalGameSnapshot = snapshot;
            autosaveCount += 1;
            root.dataset.serfboundAutosaveCount = String(autosaveCount);
            void saveCurrentLocalGame(root, localGameSaveStore, snapshot, (record) => {
              currentSavedLocalGame = record;
              syncLocalGameSaveControls(
                root,
                currentLocalGameSnapshot,
                currentSavedLocalGame,
                currentImportedDataSource,
              );
            });
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
    if (currentDecodedAssets !== undefined) {
      audioService.loadClips(currentDecodedAssets.rawSfx);
      audioService.loadMusic(currentDecodedAssets.rawMusic);
    }
    syncAudioState();
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
      currentWorld.players[currentLocalPlayer]?.hasCastle === false,
    panelClick(interaction) {
      // The start screen owns setup-state canvas clicks: seed randomizes,
      // supplies cycle, START begins the seeded custom game.
      if (currentWorld === undefined && initScreenSettings() !== undefined) {
        const uiScale = uiScaleFor({ width: canvas.width, height: canvas.height }, canvasPixelRatio);
        const rect = initScreenRect({ width: canvas.width, height: canvas.height }, uiScale);
        const row = initScreenRowAt(rect, uiScale, interaction.screen.x, interaction.screen.y);
        if (row === "seed" && initMission === undefined) {
          initSeedString = randomSeedString(Math.random);
        } else if (row === "supplies" && initMission === undefined) {
          initSupplies = nextSupplies(initSupplies);
        } else if (row === "mission") {
          // Cycle CUSTOM -> the campaign missions -> CUSTOM.
          const startable = serfboundMissions.filter(
            (mission) => mission.name !== "PYRDACOR",
          );
          if (initMission === undefined) {
            initMission = startable[0]?.name;
          } else {
            const index = startable.findIndex((mission) => mission.name === initMission);
            initMission = startable[index + 1]?.name;
          }
        } else if (row === "start") {
          if (initMission === undefined) {
            startGameNowRef?.({ seedString: initSeedString, initialSupplies: initSupplies });
          } else {
            startGameNowRef?.({ mission: initMission });
          }

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
      const uiScale = uiScaleFor({ width: canvas.width, height: canvas.height }, canvasPixelRatio);
      if (currentPopup !== undefined) {
        const popup = popupRect({ width: canvas.width, height: canvas.height }, uiScale);
        if (!pointInPopup(popup, interaction.screen.x, interaction.screen.y)) {
          setPopup(undefined);
          renderCurrentScene();
          return true;
        }

        if (currentPopup.startsWith("build")) {
          const hit = popupBuildItemAt(
            popup, uiScale, currentPopup, interaction.screen.x, interaction.screen.y,
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
          const toggle = settAudioToggleAt(popup, uiScale, interaction.screen.x, interaction.screen.y);
          if (toggle === "sfx") {
            audioService.sfxMuted = !audioService.sfxMuted;
          } else if (toggle === "music") {
            audioService.musicMuted = !audioService.musicMuted;
            if (audioService.musicMuted) {
              audioService.stopMusic();
            } else if (audioService.musicState === "ready") {
              audioService.playMusic();
            }
          }

          if (toggle !== null) {
            try {
              saveAudioSettings(globalThis.localStorage, audioService.settings());
            } catch {
              // In-memory only without storage.
            }

            root.dataset.serfboundSfxMuted = String(audioService.sfxMuted);
            root.dataset.serfboundMusicMuted = String(audioService.musicMuted);
            syncAudioState();
          }

          const row = settOccupationRowAt(popup, uiScale, interaction.screen.x, interaction.screen.y);
          const player = currentWorld.players[0];
          if (toggle === null && row !== null && player !== undefined) {
            const cycle = knightOccupationCycle;
            const index = cycle.indexOf(player.knightOccupation[row] ?? cycle[0]!);
            player.knightOccupation[row] = cycle[(index + 1) % cycle.length]!;
          }
        } else if (currentPopup === "map") {
          // Click-to-navigate: center the viewport on the clicked tile.
          const target = minimapTileAt(
            popup, uiScale, interaction.screen.x, interaction.screen.y,
            currentWorld.columns, currentWorld.rows,
          );
          if (target !== null) {
            currentScroll = { column: target.column, row: target.row };
          }
        }

        renderCurrentScene();
        return true;
      }

      const rect = panelBarRect({ width: canvas.width, height: canvas.height }, uiScale);
      if (!pointInPanelBar(rect, interaction.screen.x, interaction.screen.y)) {
        return false;
      }

      const slot = panelButtonAt(rect, uiScale, interaction.screen.x, interaction.screen.y);
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
        audioService.playSfx(sfxType.click);
      } else if (slot === 3) {
        setPopup("stats");
        audioService.playSfx(sfxType.click);
      } else if (slot === 4) {
        setPopup("sett");
        audioService.playSfx(sfxType.click);
      } else if (slot === 1) {
        // Road mode toggle, same semantics as the shell road button.
        if (root.dataset.serfboundRoadMode !== "idle") {
          setRoadMode("idle");
  setGameSpeed(1);
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
  setGameSpeed(1);
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

    if (event.key === "0" || event.key === "1" || event.key === "2" || event.key === "4") {
      if (root.dataset.serfboundGameState === "running") {
        setGameSpeed(Number(event.key));
        return;
      }
    }

    // 'v' cycles the world view scale (1x/2x/3x — the modern SVGA).
    if (event.key === "v" || event.key === "V") {
      cycleWorldViewScale();
      renderCurrentScene();
      return;
    }

    // Correspondence: Enter picks an arrived turn up (async match or
    // hot-seat hand-over).
    if (event.key === "Enter" && currentAsync !== undefined) {
      event.preventDefault();
      currentAsync.pickup();
      return;
    }

    if (event.key === "Enter" && currentHotseat !== undefined) {
      event.preventDefault();
      currentHotseat.pickup();
      return;
    }

    // Keyboard play: Enter starts the configured game from the title
    // screen (the pointer-free path to the same custom/mission start).
    if (event.key === "Enter" && currentWorld === undefined && initScreenSettings() !== undefined) {
      event.preventDefault();
      if (initMission === undefined) {
        startGameNowRef?.({ seedString: initSeedString, initialSupplies: initSupplies });
      } else {
        startGameNowRef?.({ mission: initMission });
      }

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
  // CSS pixels per tile step at the current scales (drag and two-finger
  // pan share it).
  const tileStepCss = () => ({
    x: (32 * effectiveWorldScale()) / canvasPixelRatio,
    y: (20 * effectiveWorldScale()) / canvasPixelRatio,
  });
  // Pinch zoom keeps the map point under the gesture midpoint
  // stationary: compare the tile under the midpoint before and after
  // the scale step (scroll-independent, so scroll {0,0} suffices).
  const stepViewScaleAt = (direction: 1 | -1, clientX: number, clientY: number): void => {
    if (currentLandscapeAssets === undefined) {
      return;
    }

    const landscape = currentLandscapeAssets.landscape;
    const rect = canvas.getBoundingClientRect();
    const screen = {
      x: (clientX - rect.left) * (rect.width === 0 ? 1 : canvas.width / rect.width),
      y: (clientY - rect.top) * (rect.height === 0 ? 1 : canvas.height / rect.height),
    };
    const origin = { column: 0, row: 0 };
    const before = screenToMapTile(landscape, screen, origin, effectiveWorldScale());
    const after = screenToMapTile(landscape, screen, origin, stepWorldViewScale(direction));
    const wrapDelta = (delta: number, size: number) => {
      const wrapped = ((delta % size) + size) % size;
      return wrapped > size / 2 ? wrapped - size : wrapped;
    };
    applyScroll(
      wrapDelta(before.column - after.column, landscape.columns),
      wrapDelta(before.row - after.row, landscape.rows),
    );
  };
  let panRemainder = { x: 0, y: 0 };
  canvas.addEventListener("pointerdown", (event) => {
    audioService.unlock();
    if (audioService.musicState === "ready") {
      audioService.playMusic();
    }

    syncAudioState();
    gestureTracker.down(event.pointerId, event.clientX, event.clientY);
    if (currentLandscapeAssets !== undefined) {
      if (gestureTracker.pointerCount === 1) {
        dragState = { x: event.clientX, y: event.clientY };
        try {
          canvas.setPointerCapture(event.pointerId);
        } catch {
          // synthetic pointers (tests) have no capturable device
        }
      } else {
        // A second finger turns the interaction into a gesture.
        dragState = undefined;
        panRemainder = { x: 0, y: 0 };
      }
    }
  });
  canvas.addEventListener("pointermove", (event) => {
    if (currentLandscapeAssets === undefined) {
      gestureTracker.move(event.pointerId, event.clientX, event.clientY);
      return;
    }

    // Two-finger gestures: pan by the midpoint, pinch to step the view
    // scale.
    if (gestureTracker.pointerCount >= 2) {
      const step = tileStepCss();
      for (const action of gestureTracker.move(event.pointerId, event.clientX, event.clientY)) {
        if (action.kind === "pan") {
          panRemainder = { x: panRemainder.x + action.deltaX, y: panRemainder.y + action.deltaY };
          const columnSteps = Math.trunc(panRemainder.x / step.x);
          const rowSteps = Math.trunc(panRemainder.y / step.y);
          if (columnSteps !== 0 || rowSteps !== 0) {
            panRemainder = {
              x: panRemainder.x - columnSteps * step.x,
              y: panRemainder.y - rowSteps * step.y,
            };
            applyScroll(-columnSteps, -rowSteps);
          }
        } else {
          stepViewScaleAt(action.direction, action.centerX, action.centerY);
          renderCurrentScene();
        }
      }

      return;
    }

    gestureTracker.move(event.pointerId, event.clientX, event.clientY);
    if (dragState === undefined) {
      return;
    }

    const deltaX = event.clientX - dragState.x;
    const deltaY = event.clientY - dragState.y;
    // Drag deltas arrive in CSS pixels; one tile spans
    // tileSize * worldScale device pixels = that / pixelRatio CSS pixels.
    const step = tileStepCss();
    const columnSteps = Math.trunc(deltaX / step.x);
    const rowSteps = Math.trunc(deltaY / step.y);
    if (columnSteps !== 0 || rowSteps !== 0) {
      dragState = {
        x: dragState.x + columnSteps * step.x,
        y: dragState.y + rowSteps * step.y,
      };
      applyScroll(-columnSteps, -rowSteps);
    }
  });
  const endDrag = (event: PointerEvent) => {
    gestureTracker.up(event.pointerId);
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

  const startGameNow = (options: {
    seedString?: string;
    initialSupplies?: number;
    mission?: string;
    playerCount?: number;
    playerSupplies?: number[];
    multiplayerLocalPlayer?: number;
  }) => {
    const { multiplayerLocalPlayer, ...gameOptions } = options;
    const result =
      options.mission !== undefined && currentImportedDataSource !== undefined
        ? startSerfboundMission(options.mission, currentImportedDataSource)
        : startSerfboundLocalGame(
            currentImportedDataSource === undefined
              ? {}
              : { data: currentImportedDataSource, ...gameOptions },
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
      if (multiplayerLocalPlayer !== undefined && currentMultiplayer !== undefined) {
        // Lockstep game: this tab controls one player, commands queue
        // through the session, and no AI plays the other seat.
        currentLocalPlayer = multiplayerLocalPlayer;
        commandRouter.localPlayer = multiplayerLocalPlayer;
        commandRouter.onWorldAction = (action) => currentMultiplayer?.submitAction(action);
      } else {
        currentLocalPlayer = 0;
        if (currentMultiplayer !== undefined) {
          currentMultiplayer.leave("local-game-started");
          currentMultiplayer = undefined;
        }

        attachAiPlayers(result.game);
      }

      renderCurrentScene();
    }
    applyLocalGameStartResult(root, result, currentTypedAssetCatalog);
    syncWorldState(root, currentWorld);
    syncBuildFlagEnabled(root, selectedInteraction, currentBuiltStructures);
    syncLocalGameSaveControls(root, currentLocalGameSnapshot, currentSavedLocalGame, currentImportedDataSource);
  };
  startGameNowRef = startGameNow;
  // Loopback multiplayer (SB-22-04): host/join a two-player lockstep
  // game between two tabs of this browser over a BroadcastChannel —
  // zero servers, original data never crossing the wire.
  const syncMultiplayerState = () => {
    if (currentMultiplayer === undefined) {
      delete root.dataset.serfboundMpRole;
      delete root.dataset.serfboundMpPhase;
      return;
    }

    const status = currentMultiplayer.status;
    root.dataset.serfboundMpRole = status.role;
    root.dataset.serfboundMpPhase = status.phase;
    root.dataset.serfboundMpStalled = String(status.stalled);
    root.dataset.serfboundMpExecutedTurn = String(status.executedTurn);
    if (status.rejectReason !== null) {
      root.dataset.serfboundMpRejectReason = status.rejectReason;
    }

    if (status.lastChecksumTick !== null) {
      root.dataset.serfboundMpChecksumTick = String(status.lastChecksumTick);
      root.dataset.serfboundMpChecksumAgreed = String(status.checksumAgreed);
    }

    if (status.desyncTick !== null) {
      root.dataset.serfboundMpDesyncTick = String(status.desyncTick);
    }

    if (currentWorld !== undefined) {
      root.dataset.serfboundMpCastles = currentWorld.players
        .map((player) => (player.hasCastle ? "1" : "0"))
        .join(",");
    }
  };
  const startMultiplayer = (role: "host" | "join") => {
    if (currentImportedDataSource === undefined || currentWorld !== undefined) {
      return;
    }

    currentMultiplayer?.leave("superseded");
    currentMultiplayer = new SerfboundLoopbackMultiplayer({
      role,
      appVersion: "0.1.0",
      settings: {
        seedString: initSeedString,
        mapSize: 3,
        playerCount: 2,
        initialSupplies: initSupplies,
        playerSupplies: null,
      },
      onReady: (settings, localPlayer) => {
        startGameNow({
          seedString: settings.seedString,
          initialSupplies: settings.initialSupplies,
          playerCount: settings.playerCount,
          ...(settings.playerSupplies === null
            ? {}
            : { playerSupplies: [...settings.playerSupplies] }),
          multiplayerLocalPlayer: localPlayer,
        });
        syncMultiplayerState();
      },
    });
    syncMultiplayerState();
  };
  root
    .querySelector<HTMLButtonElement>("[data-testid='host-loopback-button']")
    ?.addEventListener("click", () => startMultiplayer("host"));
  root
    .querySelector<HTMLButtonElement>("[data-testid='join-loopback-button']")
    ?.addEventListener("click", () => startMultiplayer("join"));
  // Hot-seat correspondence (SB-23-03): two players pass one seat;
  // every window still crosses the trustless verify path, and the
  // incoming player watches the recap before playing.
  const syncHotseatState = () => {
    if (currentHotseat === undefined) {
      delete root.dataset.serfboundCorMode;
      return;
    }

    root.dataset.serfboundCorMode = currentHotseat.mode;
    root.dataset.serfboundCorWindow = String(currentHotseat.currentWindow);
    root.dataset.serfboundCorPlayer = String(currentHotseat.activePlayer);
    const countdown = currentHotseat.countdownSeconds;
    if (countdown === null) {
      delete root.dataset.serfboundCorCountdown;
    } else {
      root.dataset.serfboundCorCountdown = String(countdown);
      root.dataset.serfboundCorExpired = String(currentHotseat.pickupExpired);
    }

    const digest = currentHotseat.lastDigest;
    if (digest !== null) {
      root.dataset.serfboundCorDigest = digestLines(digest).join(" / ");
    }

    if (currentHotseat.failureReason !== null) {
      root.dataset.serfboundCorFailure = currentHotseat.failureReason;
    }
  };
  const hotseatWindowTicks = (() => {
    try {
      const value = new URLSearchParams(globalThis.location?.search ?? "").get("window");
      const parsed = value === null ? NaN : Number(value);
      return Number.isInteger(parsed) && parsed >= 64 ? parsed : 4096;
    } catch {
      return 4096;
    }
  })();
  const startHotseat = () => {
    if (currentImportedDataSource === undefined || currentWorld !== undefined) {
      return;
    }

    currentHotseat = new HotseatController({
      game: {
        data: currentImportedDataSource,
        seedString: initSeedString,
        mapSize: 3,
        playerCount: 2,
        initialSupplies: initSupplies,
      },
      windowTicks: hotseatWindowTicks,
      pickupSeconds: 60,
    });
    currentBuiltStructures = [];
    const live = currentHotseat.live;
    startLandscapeRendering({ landscape: () => live.world });
    commandRouter = new SerfboundCommandRouter(live.state, live.world);
    commandRouter.onWorldAction = (action) => currentHotseat?.queue(action);
    currentWorld = live.world;
    currentSerfEngine = live.serfEngine;
    currentLocalPlayer = 0;
    root.dataset.serfboundGameState = "running";
    getGameStateElement(root).textContent = "Running";
    setNotice("PLAYER 1 - YOUR WINDOW");
    syncHotseatState();
    syncWorldState(root, currentWorld);
    renderCurrentScene();
  };
  root
    .querySelector<HTMLButtonElement>("[data-testid='hotseat-button']")
    ?.addEventListener("click", startHotseat);
  // Two-tab async correspondence (SB-23-04): each tab runs its own full
  // match; window moves cross the loopback channel (the Phase 24
  // mailbox's stand-in). Tabs act at their own pace.
  const syncAsyncState = () => {
    if (currentAsync === undefined) {
      return;
    }

    const status = currentAsync.status;
    root.dataset.serfboundCorMode = status.mode;
    root.dataset.serfboundCorWindow = String(status.window);
    root.dataset.serfboundCorPlayer = String(status.localPlayer);
    root.dataset.serfboundCorChecksum = String(status.checksum >>> 0);
    if (status.boundaryChecksum !== null) {
      root.dataset.serfboundCorBoundary = String(status.boundaryChecksum >>> 0);
    }

    if (status.digest !== null) {
      root.dataset.serfboundCorDigest = digestLines(status.digest).join(" / ");
    }

    if (status.failureReason !== null) {
      root.dataset.serfboundCorFailure = status.failureReason;
    }
  };
  const startAsync = (role: "host" | "join") => {
    if (currentImportedDataSource === undefined || currentWorld !== undefined) {
      return;
    }

    currentAsync = new SerfboundAsyncLoopbackMatch({
      role,
      appVersion: "0.1.0",
      data: currentImportedDataSource,
      windowTicks: hotseatWindowTicks,
      settings: {
        seedString: initSeedString,
        mapSize: 3,
        playerCount: 2,
        initialSupplies: initSupplies,
        playerSupplies: null,
      },
      onReady: () => {
        const match = currentAsync?.match;
        if (match === undefined || currentAsync === undefined) {
          return;
        }

        currentBuiltStructures = [];
        startLandscapeRendering({ landscape: () => match.world });
        commandRouter = new SerfboundCommandRouter(match.state, match.world);
        commandRouter.localPlayer = currentAsync.localPlayer;
        commandRouter.onWorldAction = (action) => currentAsync?.queue(action);
        currentWorld = match.world;
        currentSerfEngine = match.serfEngine;
        currentLocalPlayer = currentAsync.localPlayer;
        root.dataset.serfboundGameState = "running";
        getGameStateElement(root).textContent = "Running";
        syncAsyncState();
        syncWorldState(root, currentWorld);
        renderCurrentScene();
      },
    });
    syncAsyncState();
  };
  root
    .querySelector<HTMLButtonElement>("[data-testid='async-host-button']")
    ?.addEventListener("click", () => startAsync("host"));
  root
    .querySelector<HTMLButtonElement>("[data-testid='async-join-button']")
    ?.addEventListener("click", () => startAsync("join"));
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
  setGameSpeed(1);

  const buildRoadButton = root.querySelector<HTMLButtonElement>("[data-testid='build-road-button']");
  if (buildRoadButton === null) {
    throw new Error("Serfbound shell build road button did not mount.");
  }

  buildRoadButton.addEventListener("click", () => {
    if (root.dataset.serfboundRoadMode !== "idle") {
      setRoadMode("idle");
  setGameSpeed(1);
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
        attachAiPlayers(restored.game);
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

// Work-loop sounds: products map to the reference clips of the labor
// that produced them (Audio.TypeSfx).
const productionSfx: Readonly<Record<number, number>> = {
  6: sfxType.treeFall, // lumber
  7: sfxType.sawing, // plank
  9: sfxType.pickBlow, // stone
  3: sfxType.mowing, // wheat
  4: sfxType.millGrinding, // flour
  1: sfxType.pigOink, // pig
  10: sfxType.pickBlow, // iron ore
  12: sfxType.pickBlow, // coal
  13: sfxType.pickBlow, // gold ore
  11: sfxType.goldBoils, // steel
  14: sfxType.goldBoils, // gold bar
  24: sfxType.metalHammering, // sword
  25: sfxType.metalHammering, // shield
};

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
  audio?: { sfxMuted: boolean; musicMuted: boolean },
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
          ...(audio === undefined ? {} : { audio }),
          ...(decodedAssets === undefined
            ? {}
            : { definedArchiveEntries: decodedAssets.definedArchiveEntries }),
          view: { scale: effectiveWorldScale() },
          pixelRatio: canvasPixelRatio,
        })
      : createFirstRenderLayerScene({
          size,
          builtStructures,
          ...(typedAssetCatalog === undefined ? {} : { typedAssetCatalog }),
          ...(decodedAssets === undefined ? {} : { decodedAssets }),
          ...(initScreen === undefined ? {} : { initScreen }),
          pixelRatio: canvasPixelRatio,
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
  root.dataset.serfboundPixelRatio = String(canvasPixelRatio);
  root.dataset.serfboundViewScale = String(effectiveWorldScale());

  const sceneState = root.querySelector<HTMLElement>("[data-testid='scene-state']");
  const sceneDetail = root.querySelector<HTMLElement>("[data-testid='scene-detail']");
  if (sceneState === null || sceneDetail === null) {
    throw new Error("Serfbound shell scene status did not mount.");
  }

  // A running catalog-mode game owns its status texts (the settlement
  // map summary); re-renders must not clobber them.
  if (
    scene.assetSummary.source === "dos-pa-catalog" &&
    root.dataset.serfboundGameState === "running"
  ) {
    return;
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
  // Touch defers actions to pointerup (SB-21-04): a quick tap acts, a
  // moved finger is a drag, a second finger is a gesture, and a 500ms
  // hold inspects the tile. Mouse keeps acting on pointerdown.
  let touchTap:
    | { readonly pointerId: number; readonly x: number; readonly y: number; consumed: boolean }
    | undefined;
  let longPressTimer: ReturnType<typeof setTimeout> | undefined;
  const cancelLongPress = (): void => {
    if (longPressTimer !== undefined) {
      clearTimeout(longPressTimer);
      longPressTimer = undefined;
    }
  };
  const touchSlopCssPixels = 12;

  const performInteraction = (event: Pick<PointerEvent, "clientX" | "clientY" | "pointerType">): void => {
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
  };

  canvas.addEventListener("pointermove", (event) => {
    if (touchTap !== undefined && event.pointerId === touchTap.pointerId) {
      if (
        Math.hypot(event.clientX - touchTap.x, event.clientY - touchTap.y) > touchSlopCssPixels
      ) {
        touchTap = undefined;
        cancelLongPress();
      }
    }

    const interaction = resolveCanvasPointer(canvas, event, handlers.landscapeContext());
    applyPointerHoverState(root, interaction, event.pointerType);
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch") {
      performInteraction(event);
      return;
    }

    if (gestureTracker.isSecondaryTouch(event.pointerId)) {
      // A second finger: this interaction is a gesture, not a tap.
      touchTap = undefined;
      cancelLongPress();
      return;
    }

    const tap = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, consumed: false };
    touchTap = tap;
    cancelLongPress();
    const downPoint = {
      clientX: event.clientX,
      clientY: event.clientY,
      pointerType: event.pointerType,
    };
    longPressTimer = setTimeout(() => {
      longPressTimer = undefined;
      if (touchTap !== tap) {
        return;
      }

      // Long-press: the tile inspect path, never a build action.
      tap.consumed = true;
      const interaction = resolveCanvasPointer(canvas, downPoint, handlers.landscapeContext());
      applyPointerHoverState(root, interaction, "touch");
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
      root.dataset.serfboundLongPress = `${interaction.tile.column},${interaction.tile.row}`;
    }, 500);
  });

  canvas.addEventListener("pointerup", (event) => {
    if (event.pointerType !== "touch") {
      return;
    }

    cancelLongPress();
    const tap = touchTap;
    touchTap = undefined;
    if (gestureTracker.consumeClickSuppression()) {
      return;
    }

    if (
      tap === undefined ||
      tap.consumed ||
      tap.pointerId !== event.pointerId ||
      Math.hypot(event.clientX - tap.x, event.clientY - tap.y) > touchSlopCssPixels
    ) {
      return;
    }

    performInteraction(event);
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
  // Events arrive in CSS pixels; hit tests and scenes work in canvas
  // (device) pixels.
  const toCanvasX = rect.width === 0 ? 1 : canvas.width / rect.width;
  const toCanvasY = rect.height === 0 ? 1 : canvas.height / rect.height;
  const screen = {
    x: (event.clientX - rect.left) * toCanvasX,
    y: (event.clientY - rect.top) * toCanvasY,
  };

  if (landscapeContext !== undefined) {
    const worldScale = effectiveWorldScale();
    const tile = screenToMapTile(
      landscapeContext.landscape,
      screen,
      landscapeContext.scroll,
      worldScale,
    );
    return {
      screen,
      view: screen,
      map: { x: screen.x / worldScale, y: screen.y / worldScale },
      tile,
    };
  }

  // The decoded preview map scales by the device pixel ratio; resolve
  // the tile in its map space but keep the canvas-pixel screen point
  // (UI hit tests work in canvas pixels).
  const previewScale = devicePixelScale();
  const preview = resolveFirstRenderLayerPointer(
    { x: screen.x / previewScale, y: screen.y / previewScale },
    { width: canvas.width / previewScale, height: canvas.height / previewScale },
  );
  return { ...preview, screen, view: screen };
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

// The reference event-to-clip mapping for commands: accepted actions
// click in, rejected ones refuse (Audio.TypeSfx Accepted/NotAccepted).
let activeAudioService: SerfboundAudioService | undefined;

function applyCommandResultState(root: HTMLElement, result: SerfboundCommandResult): void {
  if (activeAudioService !== undefined) {
    activeAudioService.playSfx(result.status === "accepted" ? sfxType.accepted : sfxType.notAccepted);
    root.dataset.serfboundLastSfx = String(activeAudioService.lastSfx ?? "");
  }

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

// SB-21-03: the canvas backing store renders at native device
// resolution; UI chrome and the world view scale up to keep their
// apparent size, pixel-sharp. The ratio is clamped against degenerate
// browser values.
let canvasPixelRatio = 1;
// The player's world view scale choice; null follows the screen (the
// integer device pixel ratio), the modern default "SVGA" mode.
let worldViewScaleChoice: number | null = null;

function devicePixelScale(): number {
  return Math.max(1, Math.round(canvasPixelRatio));
}

function effectiveWorldScale(): number {
  return worldViewScaleChoice ?? devicePixelScale();
}

export function cycleWorldViewScale(): number {
  const next = (effectiveWorldScale() % 3) + 1;
  worldViewScaleChoice = next;
  return next;
}

// Pinch-zoom steps the view scale one notch at a time (SB-21-04).
export function stepWorldViewScale(direction: 1 | -1): number {
  const next = Math.max(1, Math.min(3, effectiveWorldScale() + direction));
  worldViewScaleChoice = next;
  return next;
}

// Shared multi-touch tracker (SB-21-04): the scroll/gesture handlers and
// the map interaction handlers coordinate through it (one canvas per
// shell).
const gestureTracker = new PointerGestureTracker();

function resizeCanvasToDisplayedSize(canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  canvasPixelRatio = Math.max(1, Math.min(4, globalThis.devicePixelRatio || 1));
  const width = Math.max(1, Math.round(rect.width * canvasPixelRatio));
  const height = Math.max(1, Math.round(rect.height * canvasPixelRatio));

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
