export const importedArchiveDatabaseName = "serfbound-imported-data";
export const importedArchiveStoreName = "archives";
export const currentImportedArchiveKey = "current-dos-pa";

export type StoredImportedArchiveMetadata = {
  readonly schemaVersion: 1;
  readonly storageKey: typeof currentImportedArchiveKey;
  readonly source: "dos-pa";
  readonly normalizedName: "SPAU.PA";
  readonly fileName: string;
  readonly byteLength: number;
  readonly importedAtIso: string;
};

export type StoredImportedArchiveRecord = StoredImportedArchiveMetadata & {
  readonly bytes: ArrayBuffer;
};

export type ImportedArchiveStore = {
  loadCurrent(): Promise<StoredImportedArchiveRecord | null>;
  saveCurrent(record: StoredImportedArchiveRecord): Promise<void>;
  clearCurrent(): Promise<void>;
};

export type StorageOperationResult =
  | {
      readonly state: "persisted" | "cleared";
    }
  | {
      readonly state: "error";
      readonly message: string;
    };

export type StoredImportedArchiveInput = {
  readonly fileName: string;
  readonly normalizedName: "SPAU.PA";
  readonly bytes: ArrayBuffer | ArrayBufferView;
  readonly importedAtIso?: string;
};

export class InvalidStoredImportedArchiveRecordError extends Error {
  public constructor() {
    super("Saved imported data has an unsupported storage version or corrupt metadata.");
    this.name = "InvalidStoredImportedArchiveRecordError";
  }
}

export function createStoredImportedArchiveRecord(
  input: StoredImportedArchiveInput,
): StoredImportedArchiveRecord {
  const bytes = cloneToArrayBuffer(input.bytes);

  return {
    schemaVersion: 1,
    storageKey: currentImportedArchiveKey,
    source: "dos-pa",
    normalizedName: input.normalizedName,
    fileName: input.fileName,
    byteLength: bytes.byteLength,
    importedAtIso: input.importedAtIso ?? new Date().toISOString(),
    bytes,
  };
}

export async function saveImportedArchiveRecord(
  store: ImportedArchiveStore,
  record: StoredImportedArchiveRecord,
): Promise<StorageOperationResult> {
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

export async function clearImportedArchiveRecord(
  store: ImportedArchiveStore,
): Promise<StorageOperationResult> {
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

export class BrowserIndexedDbImportedArchiveStore implements ImportedArchiveStore {
  public constructor(
    private readonly databaseName = importedArchiveDatabaseName,
    private readonly storeName = importedArchiveStoreName,
    private readonly factory: IDBFactory | undefined = globalThis.indexedDB,
  ) {}

  public async loadCurrent(): Promise<StoredImportedArchiveRecord | null> {
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(this.storeName, "readonly");
      const request = transaction.objectStore(this.storeName).get(currentImportedArchiveKey);
      const result = await requestToPromise<unknown>(request);
      await transactionDone(transaction);

      if (result === undefined) {
        return null;
      }

      return assertStoredImportedArchiveRecord(result);
    } finally {
      database.close();
    }
  }

  public async saveCurrent(record: StoredImportedArchiveRecord): Promise<void> {
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(this.storeName, "readwrite");
      transaction.objectStore(this.storeName).put({
        ...record,
        bytes: cloneToArrayBuffer(record.bytes),
      });
      await transactionDone(transaction);
    } finally {
      database.close();
    }
  }

  public async clearCurrent(): Promise<void> {
    const database = await this.openDatabase();
    try {
      const transaction = database.transaction(this.storeName, "readwrite");
      transaction.objectStore(this.storeName).delete(currentImportedArchiveKey);
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
        reject(request.error ?? new Error("Could not open imported archive storage."));
      };

      request.onblocked = () => {
        reject(new Error("Imported archive storage is blocked by another browser tab."));
      };
    });
  }
}

export function cloneToArrayBuffer(input: ArrayBuffer | ArrayBufferView): ArrayBuffer {
  if (input instanceof ArrayBuffer) {
    return input.slice(0);
  }

  const copy = new Uint8Array(input.byteLength);
  copy.set(new Uint8Array(input.buffer, input.byteOffset, input.byteLength));
  return copy.buffer;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function assertStoredImportedArchiveRecord(input: unknown): StoredImportedArchiveRecord {
  if (isStoredImportedArchiveRecord(input)) {
    return input;
  }

  throw new InvalidStoredImportedArchiveRecordError();
}

function requestToPromise<T>(request: IDBRequest): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result as T);
    };

    request.onerror = () => {
      reject(request.error ?? new Error("Imported archive storage request failed."));
    };
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error ?? new Error("Imported archive storage transaction failed."));
    };

    transaction.onabort = () => {
      reject(transaction.error ?? new Error("Imported archive storage transaction aborted."));
    };
  });
}

function isStoredImportedArchiveRecord(input: unknown): input is StoredImportedArchiveRecord {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  const record = input as Partial<StoredImportedArchiveRecord>;
  return (
    record.schemaVersion === 1 &&
    record.storageKey === currentImportedArchiveKey &&
    record.source === "dos-pa" &&
    record.normalizedName === "SPAU.PA" &&
    typeof record.fileName === "string" &&
    typeof record.byteLength === "number" &&
    typeof record.importedAtIso === "string" &&
    record.bytes instanceof ArrayBuffer &&
    record.bytes.byteLength === record.byteLength
  );
}
