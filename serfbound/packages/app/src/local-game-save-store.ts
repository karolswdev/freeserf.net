import type {
  SerfboundLocalGameDataSource,
  SerfboundLocalGameSnapshot,
} from "@serfbound/engine";
import { errorMessage } from "./imported-data-store.js";

export const localGameSaveDatabaseName = "serfbound-local-game-saves";
export const localGameSaveStoreName = "saves";
export const currentLocalGameSaveKey = "current-local-game";

export type StoredLocalGameSaveMetadata = {
  readonly schemaVersion: 1;
  readonly storageKey: typeof currentLocalGameSaveKey;
  readonly source: "serfbound-local-game";
  readonly savedAtIso: string;
  readonly dataSource: SerfboundLocalGameDataSource;
};

export type StoredLocalGameSaveRecord = StoredLocalGameSaveMetadata & {
  readonly snapshot: SerfboundLocalGameSnapshot;
};

export type LocalGameSaveStore = {
  loadCurrent(): Promise<StoredLocalGameSaveRecord | null>;
  saveCurrent(record: StoredLocalGameSaveRecord): Promise<void>;
  clearCurrent(): Promise<void>;
};

export type LocalGameSaveOperationResult =
  | {
      readonly state: "persisted" | "cleared";
    }
  | {
      readonly state: "error";
      readonly message: string;
    };

export type StoredLocalGameSaveInput = {
  readonly snapshot: SerfboundLocalGameSnapshot;
  readonly savedAtIso?: string;
};

export class InvalidStoredLocalGameSaveRecordError extends Error {
  public constructor() {
    super("Saved game has an unsupported storage version or corrupt metadata.");
    this.name = "InvalidStoredLocalGameSaveRecordError";
  }
}

export function createStoredLocalGameSaveRecord(
  input: StoredLocalGameSaveInput,
): StoredLocalGameSaveRecord {
  const snapshot = cloneLocalGameSnapshot(input.snapshot);

  return {
    schemaVersion: 1,
    storageKey: currentLocalGameSaveKey,
    source: "serfbound-local-game",
    savedAtIso: input.savedAtIso ?? new Date().toISOString(),
    dataSource: { ...snapshot.data },
    snapshot,
  };
}

export async function saveLocalGameSaveRecord(
  store: LocalGameSaveStore,
  record: StoredLocalGameSaveRecord,
): Promise<LocalGameSaveOperationResult> {
  try {
    await store.saveCurrent(record);
    return { state: "persisted" };
  } catch (error) {
    return {
      state: "error",
      message: errorMessage(error),
    };
  }
}

export async function clearLocalGameSaveRecord(
  store: LocalGameSaveStore,
): Promise<LocalGameSaveOperationResult> {
  try {
    await store.clearCurrent();
    return { state: "cleared" };
  } catch (error) {
    return {
      state: "error",
      message: errorMessage(error),
    };
  }
}

export class BrowserIndexedDbLocalGameSaveStore implements LocalGameSaveStore {
  public constructor(
    private readonly databaseName = localGameSaveDatabaseName,
    private readonly storeName = localGameSaveStoreName,
    private readonly factory: IDBFactory | undefined = globalThis.indexedDB,
  ) {}

  public async loadCurrent(): Promise<StoredLocalGameSaveRecord | null> {
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(this.storeName, "readonly");
      const request = transaction.objectStore(this.storeName).get(currentLocalGameSaveKey);
      const result = await requestToPromise<unknown>(request);
      await transactionDone(transaction);

      if (result === undefined) {
        return null;
      }

      return cloneLocalGameSaveRecord(assertStoredLocalGameSaveRecord(result));
    } finally {
      database.close();
    }
  }

  public async saveCurrent(record: StoredLocalGameSaveRecord): Promise<void> {
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(this.storeName, "readwrite");
      transaction.objectStore(this.storeName).put(cloneLocalGameSaveRecord(record));
      await transactionDone(transaction);
    } finally {
      database.close();
    }
  }

  public async clearCurrent(): Promise<void> {
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(this.storeName, "readwrite");
      transaction.objectStore(this.storeName).delete(currentLocalGameSaveKey);
      await transactionDone(transaction);
    } finally {
      database.close();
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    const factory = this.factory;
    if (factory === undefined) {
      return Promise.reject(new Error("IndexedDB is not available in this browser."));
    }

    return new Promise((resolve, reject) => {
      const request = factory.open(this.databaseName, 1);

      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(this.storeName)) {
          database.createObjectStore(this.storeName, { keyPath: "storageKey" });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error ?? new Error("Could not open local game save storage."));
      };

      request.onblocked = () => {
        reject(new Error("Local game save storage is blocked by another browser tab."));
      };
    });
  }
}

export function cloneLocalGameSaveRecord(
  record: StoredLocalGameSaveRecord,
): StoredLocalGameSaveRecord {
  const snapshot = cloneLocalGameSnapshot(record.snapshot);
  return {
    schemaVersion: 1,
    storageKey: currentLocalGameSaveKey,
    source: "serfbound-local-game",
    savedAtIso: record.savedAtIso,
    dataSource: { ...record.dataSource },
    snapshot,
  };
}

export function assertStoredLocalGameSaveRecord(input: unknown): StoredLocalGameSaveRecord {
  if (isStoredLocalGameSaveRecord(input)) {
    return input;
  }

  throw new InvalidStoredLocalGameSaveRecordError();
}

function cloneLocalGameSnapshot(
  snapshot: SerfboundLocalGameSnapshot,
): SerfboundLocalGameSnapshot {
  return {
    schemaVersion: 1,
    kind: "serfbound.local-game",
    mode: "local-single-player",
    status: "running",
    data: { ...snapshot.data },
    settings: { ...snapshot.settings },
    state: {
      schemaVersion: 1,
      kind: "serfbound.game-state-skeleton",
      map: { ...snapshot.state.map },
      clock: { ...snapshot.state.clock },
      random: {
        ...snapshot.state.random,
        state: [...snapshot.state.random.state],
      },
      counters: { ...snapshot.state.counters },
      builtStructures: snapshot.state.builtStructures.map((structure) => ({
        ...structure,
        tile: { ...structure.tile },
      })),
      worldActions: (snapshot.state.worldActions ?? []).map((action) =>
        JSON.parse(JSON.stringify(action)) as unknown,
      ),
    },
    renderer: { ...snapshot.renderer },
  };
}

function requestToPromise<T>(request: IDBRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result as T);
    };

    request.onerror = () => {
      reject(request.error ?? new Error("Local game save storage request failed."));
    };
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error ?? new Error("Local game save storage transaction failed."));
    };

    transaction.onabort = () => {
      reject(transaction.error ?? new Error("Local game save storage transaction aborted."));
    };
  });
}

function isStoredLocalGameSaveRecord(input: unknown): input is StoredLocalGameSaveRecord {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  const record = input as Partial<StoredLocalGameSaveRecord>;
  return (
    record.schemaVersion === 1 &&
    record.storageKey === currentLocalGameSaveKey &&
    record.source === "serfbound-local-game" &&
    typeof record.savedAtIso === "string" &&
    isLocalGameDataSource(record.dataSource) &&
    isLocalGameSnapshot(record.snapshot) &&
    localGameDataSourcesMatch(record.dataSource, record.snapshot.data)
  );
}

function isLocalGameDataSource(input: unknown): input is SerfboundLocalGameDataSource {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  const data = input as Partial<SerfboundLocalGameDataSource>;
  return (
    data.kind === "imported-dos-pa-catalog" &&
    typeof data.archiveName === "string" &&
    Number.isInteger(data.byteLength) &&
    Number.isInteger(data.entryCount) &&
    Number.isInteger(data.definedArchiveEntries) &&
    Number.isInteger(data.fixupCount)
  );
}

function isLocalGameSnapshot(input: unknown): input is SerfboundLocalGameSnapshot {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  const snapshot = input as Partial<SerfboundLocalGameSnapshot>;
  return (
    snapshot.schemaVersion === 1 &&
    snapshot.kind === "serfbound.local-game" &&
    snapshot.mode === "local-single-player" &&
    snapshot.status === "running" &&
    isLocalGameDataSource(snapshot.data) &&
    typeof snapshot.settings?.seedString === "string" &&
    Number.isInteger(snapshot.settings.mapSize) &&
    typeof snapshot.state === "object" &&
    snapshot.state !== null &&
    Array.isArray(snapshot.state.builtStructures)
  );
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
