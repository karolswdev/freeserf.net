import { assetImportBoundary } from "@serfbound/assets";
import { engineBoundary, uint16 } from "@serfbound/engine";

export type AppBootstrapSummary = {
  readonly runtime: "browser";
  readonly enginePackage: string;
  readonly assetSource: string;
  readonly uint16Sample: number;
};

export function bootstrapSummary(): AppBootstrapSummary {
  return {
    runtime: "browser",
    enginePackage: engineBoundary.name,
    assetSource: assetImportBoundary.source,
    uint16Sample: uint16(0x1ffff),
  };
}

export function mountSerfbound(root: HTMLElement): void {
  const summary = bootstrapSummary();
  root.dataset.serfboundRuntime = summary.runtime;
  root.textContent = "Serfbound browser workspace";
}
