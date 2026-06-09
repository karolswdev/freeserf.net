export type AssetImportBoundary = {
  readonly source: "user-provided-local-file";
  readonly storesOriginalPayloadInGit: false;
  readonly defaultArchiveExtension: ".PA";
};

export const assetImportBoundary: AssetImportBoundary = {
  source: "user-provided-local-file",
  storesOriginalPayloadInGit: false,
  defaultArchiveExtension: ".PA",
};

export function isSupportedArchiveName(fileName: string): boolean {
  return /^SPA[A-Z]?\.PA$/i.test(fileName);
}
