import { assetImportBoundary } from "@serfbound/assets";
import { engineBoundary, uint16 } from "@serfbound/engine";
import { assertOracleFixtureHeader } from "@serfbound/test-support";

export type AppBootstrapSummary = {
  readonly runtime: "browser";
  readonly enginePackage: string;
  readonly assetSource: string;
  readonly uint16Sample: number;
  readonly fixtureTarget: string;
};

export function bootstrapSummary(): AppBootstrapSummary {
  const fixture = assertOracleFixtureHeader({
    schemaVersion: 1,
    targetId: "rng.fixed-seed-sequence",
    dataRequirement: "data-free / CI-safe",
  });

  return {
    runtime: "browser",
    enginePackage: engineBoundary.name,
    assetSource: assetImportBoundary.source,
    uint16Sample: uint16(0x1ffff),
    fixtureTarget: fixture.targetId,
  };
}

export function mountSerfbound(root: HTMLElement): void {
  const summary = bootstrapSummary();
  root.dataset.serfboundRuntime = summary.runtime;
  root.textContent = "Serfbound browser workspace";
}
