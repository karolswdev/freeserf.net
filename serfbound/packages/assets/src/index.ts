export {
  DosPaArchive,
  DosSpriteDecodeError,
  decodeDosMaskSprite,
  decodeDosOverlaySprite,
  decodeDosResourceSprite,
  decodeDosSolidSprite,
  decodeDosTransparentSprite,
  dosPaletteByteLength,
  dosSpriteArchiveIndex,
  dosSpriteHeaderByteLength,
  type DecodedDosSprite,
  type DosPalette,
} from "./dos-sprites.js";

export {
  composeSerfTorso,
  createDifferenceMask,
  getMasked,
  makeAlphaMask,
  parseSerfAnimationTable,
  stick,
  type ComposedSerfTorso,
  type SerfAnimationFrame,
  type SerfAnimationTable,
} from "./serf-sprites.js";

export {
  composeMaskedTile,
  terrainGroundSpriteIndex,
  terrainTypeCount,
  tileHeight,
  tileMaskDown,
  tileMaskUp,
  tileRenderMaxHeight,
  tileTerrainSprites,
  tileWidth,
  triangleMaskCodeDown,
  triangleMaskCodeUp,
} from "./terrain-tiles.js";

export {
  buildSpriteAtlas,
  type SpriteAtlas,
  type SpriteAtlasRegion,
} from "./sprite-atlas.js";

export {
  parseXmi,
  parseXmiTrack,
  xmiArchiveBase,
  type XmiEvent,
} from "./audio-xmi.js";

export {
  convertSfxToPcm16,
  decodeSfxSamples,
  dosSfxLevel,
  sfxArchiveBase,
  sfxSampleRate,
  sfxType,
  type SfxTypeValue,
} from "./audio-sfx.js";

export {
  decodeUiCursor,
  decodeUiFontGlyph,
  decodeUiFontShadowGlyph,
  decodeUiFrame,
  decodeUiIcon,
  decodeUiLogo,
  decodeUiPanelButton,
  layoutUiText,
  mapCharacterToGlyphIndex,
  tintDecodedSprite,
  uiFontAdvance,
  uiFontGlyphCount,
  uiResourceBase,
  type UiFrameKind,
  type UiTextGlyphPlacement,
} from "./ui-art.js";

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

export type DosPaCatalogEntrySource = "catalog" | "fixup";

export type DosPaCatalogEntry = {
  readonly index: number;
  readonly offset: number;
  readonly size: number;
  readonly defined: boolean;
  readonly source: DosPaCatalogEntrySource;
  readonly inheritedFrom?: number;
};

export type DosPaCatalogHeader = {
  readonly declaredSize: number;
  readonly declaredSizeMatchesFileSize: boolean;
  readonly entryCount: number;
  readonly tableStart: 8;
  readonly tableSize: number;
  readonly tableEnd: number;
};

export type DosPaCatalogInvalidBound = {
  readonly index: number;
  readonly offset: number;
  readonly size: number;
  readonly reason: "entry-before-payload-table-end" | "entry-exceeds-file-size";
};

export type DosPaCatalogOverlap = {
  readonly leftIndex: number;
  readonly rightIndex: number;
};

export type DosPaCatalogEntrySummary = {
  readonly defined: number;
  readonly undefined: number;
  readonly totalWithPlaceholder: number;
  readonly invalidBounds: readonly DosPaCatalogInvalidBound[];
  readonly invalidBoundsCount: number;
  readonly overlapCount: number;
  readonly overlapSamples: readonly DosPaCatalogOverlap[];
  readonly sizeStats: {
    readonly min: number;
    readonly max: number;
    readonly totalDeclaredPayloadBytes: number;
  };
  readonly largestEntries: readonly Pick<DosPaCatalogEntry, "index" | "offset" | "size">[];
};

export type DosPaCatalogFixup = {
  readonly source: number;
  readonly target: number;
};

export type DosPaCatalogFixupSummary = {
  readonly count: number;
  readonly samples: readonly DosPaCatalogFixup[];
};

export type DosPaResourceCatalogEntry = {
  readonly availableCount: number;
  readonly count: number;
  readonly dosIndex: number;
  readonly dosPalette: number;
  readonly firstArchiveIndex: number | null;
  readonly firstAvailableIndex: number | null;
  readonly lastArchiveIndex: number | null;
  readonly lastAvailableIndex: number | null;
  readonly missingCount: number;
  readonly name: string;
  readonly paletteAvailable: boolean | null;
  readonly spriteType: "Unknown" | "Solid" | "Transparent" | "Overlay" | "Mask";
  readonly type: "Unknown" | "Sprite" | "Animation" | "Sound" | "Music";
};

export type DosPaCatalog = {
  readonly format: "DOS PA catalog, little-endian uint32 metadata";
  readonly header: DosPaCatalogHeader;
  readonly entries: readonly DosPaCatalogEntry[];
  readonly entrySummary: DosPaCatalogEntrySummary;
  readonly fixupSummary: DosPaCatalogFixupSummary;
  readonly selectedEntries: readonly DosPaCatalogEntry[];
  readonly resources: Readonly<Record<number, DosPaResourceCatalogEntry>>;
};

export type TypedAssetCatalogSource = {
  readonly archiveFormat: DosPaCatalog["format"];
  readonly entryCount: number;
  readonly definedArchiveEntries: number;
  readonly fixupCount: number;
};

export type TypedAssetGroupKey = "terrain" | "objects" | "serfs" | "ui" | "audio";

export type TypedAssetAvailabilityStatus = "available" | "partial" | "missing" | "empty";

export type TypedAssetDecoderStatus =
  | "sprite-decoder-deferred"
  | "animation-decoder-deferred"
  | "sound-decoder-deferred"
  | "music-decoder-deferred"
  | "unknown-decoder-deferred";

export type TypedAssetPaletteStatus = "available" | "missing" | "not-applicable";

export type TypedAssetResourceReference = {
  readonly source: "dos-pa-resource";
  readonly resourceIndex: number;
  readonly name: string;
  readonly dosIndex: number;
  readonly count: number;
};

export type TypedAssetResource = {
  readonly name: string;
  readonly resourceIndex: number;
  readonly type: DosPaResourceCatalogEntry["type"];
  readonly spriteType: DosPaResourceCatalogEntry["spriteType"];
  readonly groupKeys: readonly TypedAssetGroupKey[];
  readonly availability: {
    readonly status: TypedAssetAvailabilityStatus;
    readonly availableCount: number;
    readonly missingCount: number;
    readonly totalCount: number;
    readonly firstAvailableIndex: number | null;
    readonly lastAvailableIndex: number | null;
  };
  readonly palette: {
    readonly status: TypedAssetPaletteStatus;
    readonly dosPalette: number;
  };
  readonly decoderStatus: TypedAssetDecoderStatus;
  readonly decoderPath: string;
  readonly reference: TypedAssetResourceReference;
};

export type TypedAssetGroup = {
  readonly key: TypedAssetGroupKey;
  readonly label: string;
  readonly resources: readonly TypedAssetResource[];
  readonly missingResourceNames: readonly string[];
};

export type TypedAssetCatalog = {
  readonly source: TypedAssetCatalogSource;
  readonly groups: Readonly<Record<TypedAssetGroupKey, TypedAssetGroup>>;
  readonly resources: readonly TypedAssetResource[];
  readonly resourcesByName: Readonly<Record<string, TypedAssetResource>>;
  readonly requests: {
    readonly renderer: {
      readonly mapGround: TypedAssetResource;
      readonly pathGround: TypedAssetResource;
      readonly mapObjects: TypedAssetResource;
      readonly gameObjects: TypedAssetResource;
      readonly mapShadows: TypedAssetResource;
    };
    readonly ui: {
      readonly font: TypedAssetResource;
      readonly fontShadow: TypedAssetResource;
      readonly icons: TypedAssetResource;
      readonly cursor: TypedAssetResource;
    };
    readonly audio: {
      readonly soundEffects: TypedAssetResource;
      readonly music: TypedAssetResource;
    };
  };
};

export class DosPaCatalogParseError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "DosPaCatalogParseError";
  }
}

export type DosResourceDefinition = {
  readonly name: string;
  readonly type: DosPaResourceCatalogEntry["type"];
  readonly count: number;
  readonly dosIndex: number;
  readonly dosPalette: number;
  readonly spriteType: DosPaResourceCatalogEntry["spriteType"];
};

export const dosResourceDefinitions: readonly DosResourceDefinition[] = [
  { name: "none", type: "Unknown", count: 0, dosIndex: 0, dosPalette: 0, spriteType: "Unknown" },
  { name: "art_landscape", type: "Sprite", count: 1, dosIndex: 1, dosPalette: 3997, spriteType: "Solid" },
  { name: "animation", type: "Animation", count: 200, dosIndex: 2, dosPalette: 0, spriteType: "Unknown" },
  { name: "serf_shadow", type: "Sprite", count: 1, dosIndex: 4, dosPalette: 3, spriteType: "Overlay" },
  { name: "dotted_lines", type: "Sprite", count: 7, dosIndex: 5, dosPalette: 3, spriteType: "Solid" },
  { name: "art_flag", type: "Sprite", count: 7, dosIndex: 15, dosPalette: 3997, spriteType: "Solid" },
  { name: "art_box", type: "Sprite", count: 14, dosIndex: 25, dosPalette: 3, spriteType: "Solid" },
  { name: "credits_bg", type: "Sprite", count: 1, dosIndex: 40, dosPalette: 3998, spriteType: "Solid" },
  { name: "logo", type: "Sprite", count: 1, dosIndex: 41, dosPalette: 3998, spriteType: "Solid" },
  { name: "symbol", type: "Sprite", count: 16, dosIndex: 42, dosPalette: 3, spriteType: "Solid" },
  { name: "map_mask_up", type: "Sprite", count: 81, dosIndex: 60, dosPalette: 3, spriteType: "Mask" },
  { name: "map_mask_down", type: "Sprite", count: 81, dosIndex: 141, dosPalette: 3, spriteType: "Mask" },
  { name: "path_mask", type: "Sprite", count: 27, dosIndex: 230, dosPalette: 3, spriteType: "Mask" },
  { name: "map_ground", type: "Sprite", count: 33, dosIndex: 260, dosPalette: 3, spriteType: "Solid" },
  { name: "path_ground", type: "Sprite", count: 10, dosIndex: 300, dosPalette: 3, spriteType: "Solid" },
  { name: "game_object", type: "Sprite", count: 279, dosIndex: 321, dosPalette: 3, spriteType: "Transparent" },
  { name: "frame_top", type: "Sprite", count: 4, dosIndex: 600, dosPalette: 3, spriteType: "Solid" },
  { name: "map_border", type: "Sprite", count: 10, dosIndex: 610, dosPalette: 3, spriteType: "Transparent" },
  { name: "map_waves", type: "Sprite", count: 16, dosIndex: 630, dosPalette: 3, spriteType: "Transparent" },
  { name: "frame_popup", type: "Sprite", count: 4, dosIndex: 660, dosPalette: 3, spriteType: "Solid" },
  { name: "indicator", type: "Sprite", count: 8, dosIndex: 670, dosPalette: 3, spriteType: "Solid" },
  { name: "font", type: "Sprite", count: 44, dosIndex: 750, dosPalette: 3, spriteType: "Transparent" },
  { name: "font_shadow", type: "Sprite", count: 44, dosIndex: 810, dosPalette: 3, spriteType: "Transparent" },
  { name: "icon", type: "Sprite", count: 318, dosIndex: 870, dosPalette: 3, spriteType: "Solid" },
  { name: "map_object", type: "Sprite", count: 194, dosIndex: 1250, dosPalette: 3, spriteType: "Transparent" },
  { name: "map_shadow", type: "Sprite", count: 194, dosIndex: 1500, dosPalette: 3, spriteType: "Overlay" },
  { name: "panel_button", type: "Sprite", count: 25, dosIndex: 1750, dosPalette: 3, spriteType: "Solid" },
  { name: "frame_bottom", type: "Sprite", count: 26, dosIndex: 1780, dosPalette: 3, spriteType: "Solid" },
  { name: "serf_torso", type: "Sprite", count: 541, dosIndex: 2500, dosPalette: 3, spriteType: "Transparent" },
  { name: "serf_head", type: "Sprite", count: 630, dosIndex: 3150, dosPalette: 3, spriteType: "Transparent" },
  { name: "frame_split", type: "Sprite", count: 3, dosIndex: 3880, dosPalette: 3, spriteType: "Solid" },
  { name: "sound", type: "Sound", count: 90, dosIndex: 3900, dosPalette: 0, spriteType: "Unknown" },
  { name: "music", type: "Music", count: 7, dosIndex: 3990, dosPalette: 0, spriteType: "Unknown" },
  { name: "cursor", type: "Sprite", count: 1, dosIndex: 3999, dosPalette: 3, spriteType: "Transparent" },
];

const selectedEntryIndices = [
  1, 2, 3, 4, 5, 60, 321, 750, 1250, 2500, 3150, 3880, 3900, 3990, 3997, 3998, 3999,
] as const;

const typedAssetGroupDefinitions = [
  {
    key: "terrain",
    label: "Terrain and map masks",
    resourceNames: [
      "art_landscape",
      "map_mask_up",
      "map_mask_down",
      "path_mask",
      "map_ground",
      "path_ground",
      "map_waves",
    ],
  },
  {
    key: "objects",
    label: "Map and game objects",
    resourceNames: ["game_object", "map_object", "map_shadow", "art_flag", "art_box"],
  },
  {
    key: "serfs",
    label: "Serf sprites and shadows",
    resourceNames: ["serf_shadow", "serf_torso", "serf_head"],
  },
  {
    key: "ui",
    label: "Interface, fonts, cursors, and frames",
    resourceNames: [
      "dotted_lines",
      "credits_bg",
      "logo",
      "symbol",
      "frame_top",
      "map_border",
      "frame_popup",
      "indicator",
      "font",
      "font_shadow",
      "icon",
      "panel_button",
      "frame_bottom",
      "frame_split",
      "cursor",
    ],
  },
  {
    key: "audio",
    label: "Sound effects and music",
    resourceNames: ["sound", "music"],
  },
] as const satisfies readonly {
  readonly key: TypedAssetGroupKey;
  readonly label: string;
  readonly resourceNames: readonly string[];
}[];

function toDataView(input: ArrayBuffer | ArrayBufferView): DataView {
  if (input instanceof ArrayBuffer) {
    return new DataView(input);
  }

  return new DataView(input.buffer as ArrayBuffer, input.byteOffset, input.byteLength);
}

function isDefinedEntry(entry: Pick<DosPaCatalogEntry, "offset" | "size">): boolean {
  return entry.offset !== 0 && entry.size !== 0;
}

function createEntry(
  index: number,
  offset: number,
  size: number,
  source: DosPaCatalogEntrySource,
  inheritedFrom?: number,
): DosPaCatalogEntry {
  const base = {
    index,
    offset,
    size,
    defined: isDefinedEntry({ offset, size }),
    source,
  };

  return inheritedFrom === undefined ? base : { ...base, inheritedFrom };
}

function collectDosPaFixups(entries: DosPaCatalogEntry[]): DosPaCatalogFixup[] {
  const fixups: DosPaCatalogFixup[] = [];
  const copyEntry = (source: number, target: number): void => {
    if (source >= entries.length || target >= entries.length) {
      return;
    }

    const sourceEntry = entries[source];
    if (sourceEntry === undefined) {
      return;
    }

    entries[target] = createEntry(target, sourceEntry.offset, sourceEntry.size, "fixup", source);
    fixups.push({ source, target });
  };

  for (let i = 0; i < 48; i += 1) {
    for (let j = 1; j < 6; j += 1) {
      copyEntry(3450 + 6 * i, 3450 + 6 * i + j);
    }
  }

  for (let i = 0; i < 3; i += 1) {
    copyEntry(3762 + i, 3765 + i);
  }

  for (let i = 0; i < 6; i += 1) {
    copyEntry(1352, 1363 + i);
    copyEntry(1602, 1613 + i);
  }

  return fixups;
}

function summarizeEntries(
  entries: readonly DosPaCatalogEntry[],
  tableEnd: number,
  byteLength: number,
): DosPaCatalogEntrySummary {
  const definedEntries = entries.filter((entry) => entry.defined);
  const invalidBounds: DosPaCatalogInvalidBound[] = [];

  for (const entry of definedEntries) {
    const end = entry.offset + entry.size;
    if (entry.offset < tableEnd) {
      invalidBounds.push({
        index: entry.index,
        offset: entry.offset,
        size: entry.size,
        reason: "entry-before-payload-table-end",
      });
    } else if (end > byteLength) {
      invalidBounds.push({
        index: entry.index,
        offset: entry.offset,
        size: entry.size,
        reason: "entry-exceeds-file-size",
      });
    }
  }

  const overlapSamples: DosPaCatalogOverlap[] = [];
  let overlapCount = 0;
  const byRange = new Map<string, number[]>();
  for (const entry of definedEntries) {
    const key = `${entry.offset}:${entry.size}`;
    const indices = byRange.get(key);
    if (indices === undefined) {
      byRange.set(key, [entry.index]);
    } else {
      indices.push(entry.index);
    }
  }

  for (const indices of byRange.values()) {
    if (indices.length < 2) {
      continue;
    }

    indices.sort((left, right) => left - right);
    overlapCount += indices.length - 1;
    for (let index = 1; index < indices.length && overlapSamples.length < 20; index += 1) {
      const leftIndex = indices[index - 1];
      const rightIndex = indices[index];
      if (leftIndex !== undefined && rightIndex !== undefined) {
        overlapSamples.push({ leftIndex, rightIndex });
      }
    }
  }

  const sizes = definedEntries.map((entry) => entry.size);
  const largestEntries = [...definedEntries]
    .sort((left, right) => right.size - left.size || left.index - right.index)
    .slice(0, 12)
    .map(({ index, offset, size }) => ({ index, offset, size }));

  return {
    defined: definedEntries.length,
    undefined: entries.length - definedEntries.length,
    totalWithPlaceholder: entries.length,
    invalidBounds,
    invalidBoundsCount: invalidBounds.length,
    overlapCount,
    overlapSamples,
    sizeStats: {
      min: sizes.length === 0 ? 0 : Math.min(...sizes),
      max: sizes.length === 0 ? 0 : Math.max(...sizes),
      totalDeclaredPayloadBytes: sizes.reduce((total, size) => total + size, 0),
    },
    largestEntries,
  };
}

function buildResourceCatalog(
  entries: readonly DosPaCatalogEntry[],
): Readonly<Record<number, DosPaResourceCatalogEntry>> {
  const resources: Record<number, DosPaResourceCatalogEntry> = {};
  const entryAt = (index: number): DosPaCatalogEntry | undefined => entries[index];

  dosResourceDefinitions.forEach((definition, resourceIndex) => {
    const archiveIndices = Array.from({ length: definition.count }, (_, index) => definition.dosIndex + index);
    const availableArchiveIndices = archiveIndices.filter((index) => entryAt(index)?.defined === true);
    const firstArchiveIndex = archiveIndices[0] ?? null;
    const lastArchiveIndex = archiveIndices.at(-1) ?? null;
    const firstAvailableIndex = availableArchiveIndices[0] ?? null;
    const lastAvailableIndex = availableArchiveIndices.at(-1) ?? null;
    const paletteAvailable =
      definition.dosPalette === 0 ? null : entryAt(definition.dosPalette)?.defined === true;

    resources[resourceIndex] = {
      availableCount: availableArchiveIndices.length,
      count: definition.count,
      dosIndex: definition.dosIndex,
      dosPalette: definition.dosPalette,
      firstArchiveIndex,
      firstAvailableIndex,
      lastArchiveIndex,
      lastAvailableIndex,
      missingCount: definition.count - availableArchiveIndices.length,
      name: definition.name,
      paletteAvailable,
      spriteType: definition.spriteType,
      type: definition.type,
    };
  });

  return resources;
}

export function parseDosPaCatalog(input: ArrayBuffer | ArrayBufferView): DosPaCatalog {
  const view = toDataView(input);
  const byteLength = view.byteLength;

  if (byteLength < 8) {
    throw new DosPaCatalogParseError(
      `DOS PA catalog header is truncated: expected at least 8 bytes, received ${byteLength}.`,
    );
  }

  const declaredSize = view.getUint32(0, true);
  const entryCount = view.getUint32(4, true);
  const tableStart = 8;
  const tableSize = entryCount * 8;
  const tableEnd = tableStart + tableSize;

  if (declaredSize !== byteLength) {
    throw new DosPaCatalogParseError(
      `DOS PA declared size ${declaredSize} does not match file size ${byteLength}.`,
    );
  }

  if (tableEnd > byteLength) {
    throw new DosPaCatalogParseError(
      `DOS PA catalog table exceeds file size: table ends at ${tableEnd}, file has ${byteLength} bytes.`,
    );
  }

  const entries: DosPaCatalogEntry[] = [createEntry(0, 0, 0, "catalog")];

  for (let index = 1; index <= entryCount; index += 1) {
    const tableOffset = tableStart + (index - 1) * 8;
    const size = view.getUint32(tableOffset, true);
    const offset = view.getUint32(tableOffset + 4, true);
    entries.push(createEntry(index, offset, size, "catalog"));
  }

  const fixups = collectDosPaFixups(entries);
  const entrySummary = summarizeEntries(entries, tableEnd, byteLength);

  if (entrySummary.invalidBounds.length > 0) {
    const firstInvalid = entrySummary.invalidBounds[0];
    throw new DosPaCatalogParseError(
      `DOS PA catalog entry ${firstInvalid?.index ?? "unknown"} has invalid bounds (${firstInvalid?.reason ?? "unknown"}).`,
    );
  }

  return {
    format: "DOS PA catalog, little-endian uint32 metadata",
    header: {
      declaredSize,
      declaredSizeMatchesFileSize: declaredSize === byteLength,
      entryCount,
      tableStart,
      tableSize,
      tableEnd,
    },
    entries,
    entrySummary,
    fixupSummary: {
      count: fixups.length,
      samples: fixups.slice(0, 12),
    },
    selectedEntries: selectedEntryIndices.flatMap((index) => {
      const entry = entries[index];
      return entry === undefined ? [] : [entry];
    }),
    resources: buildResourceCatalog(entries),
  };
}

export function buildTypedAssetCatalog(catalog: DosPaCatalog): TypedAssetCatalog {
  const groups = createEmptyTypedAssetGroups();
  const resources: TypedAssetResource[] = [];
  const resourcesByName: Record<string, TypedAssetResource> = {};

  dosResourceDefinitions.forEach((definition, resourceIndex) => {
    const resource = catalog.resources[resourceIndex];
    if (resource === undefined) {
      return;
    }

    const groupKeys = groupsForResource(definition.name);
    const typedResource: TypedAssetResource = {
      name: definition.name,
      resourceIndex,
      type: resource.type,
      spriteType: resource.spriteType,
      groupKeys,
      availability: {
        status: availabilityStatus(resource),
        availableCount: resource.availableCount,
        missingCount: resource.missingCount,
        totalCount: resource.count,
        firstAvailableIndex: resource.firstAvailableIndex,
        lastAvailableIndex: resource.lastAvailableIndex,
      },
      palette: {
        status: paletteStatus(resource),
        dosPalette: resource.dosPalette,
      },
      decoderStatus: decoderStatus(resource),
      decoderPath: `dos-pa:${resource.type.toLowerCase()}:${resource.name}`,
      reference: {
        source: "dos-pa-resource",
        resourceIndex,
        name: resource.name,
        dosIndex: resource.dosIndex,
        count: resource.count,
      },
    };

    resources.push(typedResource);
    resourcesByName[typedResource.name] = typedResource;
    for (const groupKey of groupKeys) {
      groups[groupKey].resources.push(typedResource);
    }
  });

  return {
    source: {
      archiveFormat: catalog.format,
      entryCount: catalog.header.entryCount,
      definedArchiveEntries: catalog.entrySummary.defined,
      fixupCount: catalog.fixupSummary.count,
    },
    groups: finalizeTypedAssetGroups(groups),
    resources,
    resourcesByName,
    requests: {
      renderer: {
        mapGround: requireTypedAssetResource(resourcesByName, "map_ground"),
        pathGround: requireTypedAssetResource(resourcesByName, "path_ground"),
        mapObjects: requireTypedAssetResource(resourcesByName, "map_object"),
        gameObjects: requireTypedAssetResource(resourcesByName, "game_object"),
        mapShadows: requireTypedAssetResource(resourcesByName, "map_shadow"),
      },
      ui: {
        font: requireTypedAssetResource(resourcesByName, "font"),
        fontShadow: requireTypedAssetResource(resourcesByName, "font_shadow"),
        icons: requireTypedAssetResource(resourcesByName, "icon"),
        cursor: requireTypedAssetResource(resourcesByName, "cursor"),
      },
      audio: {
        soundEffects: requireTypedAssetResource(resourcesByName, "sound"),
        music: requireTypedAssetResource(resourcesByName, "music"),
      },
    },
  };
}

export function lookupTypedAssetResource(
  catalog: TypedAssetCatalog,
  name: string,
): TypedAssetResource | undefined {
  return catalog.resourcesByName[name];
}

type MutableTypedAssetGroup = Omit<TypedAssetGroup, "resources" | "missingResourceNames"> & {
  readonly resources: TypedAssetResource[];
};

function createEmptyTypedAssetGroups(): Record<TypedAssetGroupKey, MutableTypedAssetGroup> {
  return {
    terrain: { key: "terrain", label: "Terrain and map masks", resources: [] },
    objects: { key: "objects", label: "Map and game objects", resources: [] },
    serfs: { key: "serfs", label: "Serf sprites and shadows", resources: [] },
    ui: { key: "ui", label: "Interface, fonts, cursors, and frames", resources: [] },
    audio: { key: "audio", label: "Sound effects and music", resources: [] },
  };
}

function finalizeTypedAssetGroups(
  groups: Record<TypedAssetGroupKey, MutableTypedAssetGroup>,
): Record<TypedAssetGroupKey, TypedAssetGroup> {
  return {
    terrain: finalizeTypedAssetGroup(groups.terrain),
    objects: finalizeTypedAssetGroup(groups.objects),
    serfs: finalizeTypedAssetGroup(groups.serfs),
    ui: finalizeTypedAssetGroup(groups.ui),
    audio: finalizeTypedAssetGroup(groups.audio),
  };
}

function finalizeTypedAssetGroup(group: MutableTypedAssetGroup): TypedAssetGroup {
  return {
    ...group,
    resources: group.resources,
    missingResourceNames: group.resources
      .filter((resource) => resource.availability.status === "missing")
      .map((resource) => resource.name),
  };
}

function groupsForResource(name: string): TypedAssetGroupKey[] {
  return typedAssetGroupDefinitions.flatMap((group) =>
    (group.resourceNames as readonly string[]).includes(name) ? [group.key] : [],
  );
}

function availabilityStatus(resource: DosPaResourceCatalogEntry): TypedAssetAvailabilityStatus {
  if (resource.count === 0) {
    return "empty";
  }

  if (resource.availableCount === 0) {
    return "missing";
  }

  if (resource.missingCount === 0) {
    return "available";
  }

  return "partial";
}

function paletteStatus(resource: DosPaResourceCatalogEntry): TypedAssetPaletteStatus {
  if (resource.paletteAvailable === null) {
    return "not-applicable";
  }

  return resource.paletteAvailable ? "available" : "missing";
}

function decoderStatus(resource: DosPaResourceCatalogEntry): TypedAssetDecoderStatus {
  switch (resource.type) {
    case "Sprite":
      return "sprite-decoder-deferred";
    case "Animation":
      return "animation-decoder-deferred";
    case "Sound":
      return "sound-decoder-deferred";
    case "Music":
      return "music-decoder-deferred";
    case "Unknown":
      return "unknown-decoder-deferred";
  }
}

function requireTypedAssetResource(
  resourcesByName: Readonly<Record<string, TypedAssetResource>>,
  name: string,
): TypedAssetResource {
  const resource = resourcesByName[name];
  if (resource === undefined) {
    throw new Error(`Typed asset resource '${name}' is missing from the DOS catalog.`);
  }

  return resource;
}
