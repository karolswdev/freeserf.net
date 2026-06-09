export type EngineBoundary = {
  readonly name: "@serfbound/engine";
  readonly allowsBrowserGlobals: false;
  readonly consumesOracleFixtures: true;
};

export const engineBoundary: EngineBoundary = {
  name: "@serfbound/engine",
  allowsBrowserGlobals: false,
  consumesOracleFixtures: true,
};

export function uint16(value: number): number {
  return value & 0xffff;
}

export function uint32(value: number): number {
  return value >>> 0;
}
