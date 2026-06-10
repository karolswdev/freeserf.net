export type OracleDataRequirement =
  | "data-free / CI-safe"
  | "local/manual SPAU.PA";

export type OracleFixtureHeader = {
  readonly schemaVersion: 1;
  readonly targetId: string;
  readonly dataRequirement: OracleDataRequirement;
  readonly source: Record<string, unknown>;
  readonly generation: Record<string, unknown>;
};

export type OracleFixtureExpectation = {
  readonly label?: string;
  readonly targetId?: string;
  readonly dataRequirement?: OracleDataRequirement;
};

const allowedDataRequirements: readonly OracleDataRequirement[] = [
  "data-free / CI-safe",
  "local/manual SPAU.PA",
];

function failure(label: string | undefined, message: string): Error {
  return new Error(`${label ?? "Oracle fixture"}: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireRecord(
  value: unknown,
  fieldName: string,
  label: string | undefined,
): Record<string, unknown> {
  if (!isRecord(value)) {
    throw failure(label, `${fieldName} must be an object.`);
  }

  return value;
}

export function assertOracleFixtureHeader(
  value: unknown,
  expected: OracleFixtureExpectation = {},
): OracleFixtureHeader {
  const record = requireRecord(value, "fixture", expected.label);
  const schemaVersion = record["schemaVersion"];

  if (schemaVersion !== 1) {
    throw failure(
      expected.label,
      `Unsupported oracle fixture schemaVersion ${String(schemaVersion)}.`,
    );
  }

  const targetId = record["targetId"];
  if (typeof targetId !== "string" || targetId.length === 0) {
    throw failure(expected.label, "targetId must be a non-empty string.");
  }

  if (expected.targetId !== undefined && targetId !== expected.targetId) {
    throw failure(
      expected.label,
      `targetId mismatch: expected ${expected.targetId}, received ${targetId}.`,
    );
  }

  const dataRequirement = record["dataRequirement"];
  if (
    typeof dataRequirement !== "string" ||
    !allowedDataRequirements.includes(dataRequirement as OracleDataRequirement)
  ) {
    throw failure(
      expected.label,
      `dataRequirement must be one of: ${allowedDataRequirements.join(", ")}.`,
    );
  }

  if (
    expected.dataRequirement !== undefined &&
    dataRequirement !== expected.dataRequirement
  ) {
    throw failure(
      expected.label,
      `dataRequirement mismatch: expected ${expected.dataRequirement}, received ${dataRequirement}.`,
    );
  }

  const source = requireRecord(record["source"], "source", expected.label);
  const generation = requireRecord(
    record["generation"],
    "generation",
    expected.label,
  );

  return {
    schemaVersion,
    targetId,
    dataRequirement: dataRequirement as OracleDataRequirement,
    source,
    generation,
  };
}

export { createDecodableGeneratedPaArchive } from "./decodable-pa-fixture.js";
