export type OracleFixtureHeader = {
  readonly schemaVersion: 1;
  readonly targetId: string;
  readonly dataRequirement: "data-free / CI-safe" | "local/manual SPAU.PA";
};

export function assertOracleFixtureHeader(value: OracleFixtureHeader): OracleFixtureHeader {
  if (value.schemaVersion !== 1) {
    throw new Error(`Unsupported oracle fixture schema: ${value.schemaVersion}`);
  }

  if (value.targetId.length === 0) {
    throw new Error("Oracle fixture targetId must be non-empty.");
  }

  return value;
}
