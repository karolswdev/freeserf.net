import {
  dosResourceDefinitions,
  parseDosPaCatalog,
  type DosPaCatalog,
  type DosResourceDefinition,
} from "./index.js";

export type DecodedDosSprite = {
  readonly deltaX: number;
  readonly deltaY: number;
  readonly width: number;
  readonly height: number;
  readonly offsetX: number;
  readonly offsetY: number;
  readonly rgba: Uint8ClampedArray;
};

export type DosPalette = Uint8Array;

export const dosSpriteHeaderByteLength = 10;
export const dosPaletteByteLength = 256 * 3;

export class DosSpriteDecodeError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "DosSpriteDecodeError";
  }
}

export class DosPaArchive {
  public readonly catalog: DosPaCatalog;
  readonly #bytes: Uint8Array;

  public constructor(input: ArrayBuffer | ArrayBufferView, catalog?: DosPaCatalog) {
    this.#bytes =
      input instanceof ArrayBuffer
        ? new Uint8Array(input)
        : new Uint8Array(input.buffer as ArrayBuffer, input.byteOffset, input.byteLength);
    this.catalog = catalog ?? parseDosPaCatalog(input);
  }

  public getEntryBytes(index: number): Uint8Array | null {
    const entry = this.catalog.entries[index];
    if (entry === undefined || !entry.defined) {
      return null;
    }

    if (entry.offset + entry.size > this.#bytes.byteLength) {
      return null;
    }

    return this.#bytes.subarray(entry.offset, entry.offset + entry.size);
  }

  public getPalette(index: number): DosPalette | null {
    const data = this.getEntryBytes(index);
    if (data === null || data.byteLength !== dosPaletteByteLength) {
      return null;
    }

    return data;
  }
}

type DosSpriteHeader = Omit<DecodedDosSprite, "rgba">;

function decodeDosSpriteHeader(data: Uint8Array): DosSpriteHeader {
  if (data.byteLength < dosSpriteHeaderByteLength) {
    throw new DosSpriteDecodeError(
      `DOS sprite data is truncated: expected at least ${dosSpriteHeaderByteLength} header bytes, received ${data.byteLength}.`,
    );
  }

  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return {
    deltaX: view.getInt8(0),
    deltaY: view.getInt8(1),
    width: view.getUint16(2, true),
    height: view.getUint16(4, true),
    offsetX: view.getInt16(6, true),
    offsetY: view.getInt16(8, true),
  };
}

function writePaletteColor(
  rgba: Uint8ClampedArray,
  pixelIndex: number,
  palette: DosPalette,
  paletteIndex: number,
  alpha: number,
): void {
  const colorOffset = paletteIndex * 3;
  const byteOffset = pixelIndex * 4;
  rgba[byteOffset] = palette[colorOffset] ?? 0;
  rgba[byteOffset + 1] = palette[colorOffset + 1] ?? 0;
  rgba[byteOffset + 2] = palette[colorOffset + 2] ?? 0;
  rgba[byteOffset + 3] = alpha;
}

function requirePalette(palette: DosPalette): void {
  if (palette.byteLength !== dosPaletteByteLength) {
    throw new DosSpriteDecodeError(
      `DOS palette must contain ${dosPaletteByteLength} bytes, received ${palette.byteLength}.`,
    );
  }
}

export function decodeDosSolidSprite(data: Uint8Array, palette: DosPalette): DecodedDosSprite {
  requirePalette(palette);
  const header = decodeDosSpriteHeader(data);
  const pixelCount = header.width * header.height;

  if (data.byteLength !== pixelCount + dosSpriteHeaderByteLength) {
    throw new DosSpriteDecodeError(
      `DOS solid sprite payload mismatch: ${header.width}x${header.height} needs ${pixelCount} bytes, received ${data.byteLength - dosSpriteHeaderByteLength}.`,
    );
  }

  const rgba = new Uint8ClampedArray(pixelCount * 4);
  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    writePaletteColor(rgba, pixel, palette, data[dosSpriteHeaderByteLength + pixel] ?? 0, 0xff);
  }

  return { ...header, rgba };
}

type RunLengthFill = (
  rgba: Uint8ClampedArray,
  pixelIndex: number,
  payloadByte: number,
) => void;

function decodeDosRunLengthSprite(
  data: Uint8Array,
  spriteKind: string,
  fillConsumesPayload: boolean,
  fill: RunLengthFill,
): DecodedDosSprite {
  const header = decodeDosSpriteHeader(data);
  const pixelCount = header.width * header.height;
  const rgba = new Uint8ClampedArray(pixelCount * 4);
  let pixel = 0;
  let cursor = dosSpriteHeaderByteLength;

  while (cursor < data.byteLength) {
    pixel += data[cursor] ?? 0;
    cursor += 1;
    if (cursor >= data.byteLength) {
      break;
    }

    const fillCount = data[cursor] ?? 0;
    cursor += 1;

    for (let i = 0; i < fillCount; i += 1) {
      if (pixel >= pixelCount) {
        throw new DosSpriteDecodeError(
          `DOS ${spriteKind} sprite overflows ${header.width}x${header.height} pixels.`,
        );
      }

      fill(rgba, pixel, fillConsumesPayload ? (data[cursor] ?? 0) : 0);
      if (fillConsumesPayload) {
        cursor += 1;
      }

      pixel += 1;
    }
  }

  return { ...header, rgba };
}

export function decodeDosTransparentSprite(
  data: Uint8Array,
  palette: DosPalette,
  colorOffset = 0,
): DecodedDosSprite {
  requirePalette(palette);
  return decodeDosRunLengthSprite(data, "transparent", true, (rgba, pixel, payload) => {
    writePaletteColor(rgba, pixel, palette, (payload + colorOffset) & 0xff, 0xff);
  });
}

export function decodeDosOverlaySprite(
  data: Uint8Array,
  palette: DosPalette,
  value = 0x80,
): DecodedDosSprite {
  requirePalette(palette);
  return decodeDosRunLengthSprite(data, "overlay", false, (rgba, pixel) => {
    writePaletteColor(rgba, pixel, palette, value, value);
  });
}

export function decodeDosMaskSprite(data: Uint8Array): DecodedDosSprite {
  return decodeDosRunLengthSprite(data, "mask", false, (rgba, pixel) => {
    const byteOffset = pixel * 4;
    rgba[byteOffset] = 0xff;
    rgba[byteOffset + 1] = 0xff;
    rgba[byteOffset + 2] = 0xff;
    rgba[byteOffset + 3] = 0xff;
  });
}

const mapObjectFlagFirstIndex = 128;
const mapObjectFlagLastIndex = 143;
const mapObjectFlagFrameCount = 4;

let resourceDefinitionsByName: ReadonlyMap<string, DosResourceDefinition> | undefined;

function requireSpriteResourceDefinition(resourceName: string): DosResourceDefinition {
  resourceDefinitionsByName ??= new Map(
    dosResourceDefinitions.map((definition) => [definition.name, definition]),
  );
  const definition = resourceDefinitionsByName.get(resourceName);
  if (definition === undefined || definition.type !== "Sprite") {
    throw new DosSpriteDecodeError(`'${resourceName}' is not a decodable DOS sprite resource.`);
  }

  return definition;
}

export function dosSpriteArchiveIndex(resourceName: string, spriteIndex: number): number {
  const definition = requireSpriteResourceDefinition(resourceName);
  if (!Number.isInteger(spriteIndex) || spriteIndex < 0 || spriteIndex >= definition.count) {
    throw new DosSpriteDecodeError(
      `Sprite index ${spriteIndex} is out of range for '${resourceName}' (0..${definition.count - 1}).`,
    );
  }

  if (
    resourceName === "map_object" &&
    spriteIndex >= mapObjectFlagFirstIndex &&
    spriteIndex <= mapObjectFlagLastIndex
  ) {
    // Flag sprites cycle through four animation frames in the reference decoder.
    const flagFrame = (spriteIndex - mapObjectFlagFirstIndex) % mapObjectFlagFrameCount;
    return definition.dosIndex + mapObjectFlagFirstIndex + flagFrame;
  }

  return definition.dosIndex + spriteIndex;
}

export function decodeDosResourceSprite(
  archive: DosPaArchive,
  resourceName: string,
  spriteIndex: number,
): DecodedDosSprite | null {
  const definition = requireSpriteResourceDefinition(resourceName);
  const data = archive.getEntryBytes(dosSpriteArchiveIndex(resourceName, spriteIndex));
  if (data === null) {
    return null;
  }

  if (definition.spriteType === "Mask") {
    return decodeDosMaskSprite(data);
  }

  const palette = archive.getPalette(definition.dosPalette);
  if (palette === null) {
    return null;
  }

  switch (definition.spriteType) {
    case "Solid":
      return decodeDosSolidSprite(data, palette);
    case "Transparent":
      return decodeDosTransparentSprite(data, palette);
    case "Overlay":
      return decodeDosOverlaySprite(data, palette);
    default:
      throw new DosSpriteDecodeError(
        `'${resourceName}' uses unsupported sprite type '${definition.spriteType}'.`,
      );
  }
}
