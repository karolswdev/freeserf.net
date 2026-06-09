export type AssetImportBoundary = {
  readonly source: "user-provided-local-file";
  readonly storesOriginalPayloadInGit: false;
  readonly defaultArchiveExtension: ".PA";
  readonly supportedDosArchiveNames: readonly ["SPAU.PA"];
};

export const assetImportBoundary: AssetImportBoundary = {
  source: "user-provided-local-file",
  storesOriginalPayloadInGit: false,
  defaultArchiveExtension: ".PA",
  supportedDosArchiveNames: ["SPAU.PA"],
};

export type ArchiveValidationResult =
  | {
      readonly state: "missing";
      readonly message: "missing-user-data";
    }
  | {
      readonly state: "supported";
      readonly source: "dos-pa";
      readonly normalizedName: "SPAU.PA";
      readonly fileName: string;
      readonly byteLength: number;
    }
  | {
      readonly state: "unsupported";
      readonly message: "unsupported-archive-name";
      readonly fileName: string;
    };

export function isSupportedArchiveName(fileName: string): boolean {
  return assetImportBoundary.supportedDosArchiveNames.some(
    (supportedName) => supportedName.toLowerCase() === fileName.toLowerCase(),
  );
}

export function validateArchiveFileSelection(
  file: Pick<File, "name" | "size"> | null | undefined,
): ArchiveValidationResult {
  if (file === null || file === undefined || file.name.trim() === "") {
    return {
      state: "missing",
      message: "missing-user-data",
    };
  }

  if (!isSupportedArchiveName(file.name)) {
    return {
      state: "unsupported",
      message: "unsupported-archive-name",
      fileName: file.name,
    };
  }

  return {
    state: "supported",
    source: "dos-pa",
    normalizedName: "SPAU.PA",
    fileName: file.name,
    byteLength: file.size,
  };
}
