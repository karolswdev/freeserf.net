import assert from "node:assert/strict";
import { test } from "node:test";

import { parseDosPaCatalog } from "@serfbound/assets";

function createGeneratedPaArchive(entryCount, entryFacts) {
  const tableStart = 8;
  const tableEnd = tableStart + entryCount * 8;
  const payloadEnd = Math.max(
    tableEnd,
    ...entryFacts.map((entry) => entry.offset + entry.size),
  );
  const bytes = new Uint8Array(payloadEnd);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, payloadEnd, true);
  view.setUint32(4, entryCount, true);

  for (const entry of entryFacts) {
    const tableOffset = tableStart + (entry.index - 1) * 8;
    view.setUint32(tableOffset, entry.size, true);
    view.setUint32(tableOffset + 4, entry.offset, true);
  }

  return bytes;
}

test("DOS PA catalog parser reads generated archive metadata without payload fixtures", () => {
  const archive = createGeneratedPaArchive(4000, [
    { index: 1, offset: 32008, size: 16 },
    { index: 3, offset: 32024, size: 768 },
    { index: 3450, offset: 32792, size: 24 },
    { index: 3997, offset: 32816, size: 768 },
    { index: 3999, offset: 33584, size: 32 },
  ]);

  const catalog = parseDosPaCatalog(archive);

  assert.deepEqual(catalog.header, {
    declaredSize: 33616,
    declaredSizeMatchesFileSize: true,
    entryCount: 4000,
    tableStart: 8,
    tableSize: 32000,
    tableEnd: 32008,
  });
  assert.equal(catalog.entries[1].source, "catalog");
  assert.equal(catalog.entries[3451].source, "fixup");
  assert.equal(catalog.entries[3451].inheritedFrom, 3450);
  assert.equal(catalog.entries[3451].offset, 32792);
  assert.equal(catalog.fixupSummary.count, 255);
  assert.equal(catalog.entrySummary.overlapCount, 5);
  assert.equal(catalog.resources[1].name, "art_landscape");
  assert.equal(catalog.resources[1].availableCount, 1);
  assert.equal(catalog.resources[1].paletteAvailable, true);
  assert.equal(catalog.resources[33].name, "cursor");
  assert.equal(catalog.resources[33].availableCount, 1);
});

test("DOS PA catalog parser rejects malformed and truncated archives with useful errors", () => {
  assert.throws(
    () => parseDosPaCatalog(new Uint8Array(7)),
    /header is truncated: expected at least 8 bytes/,
  );

  const declaredSizeMismatch = createGeneratedPaArchive(1, [{ index: 1, offset: 16, size: 1 }]);
  new DataView(declaredSizeMismatch.buffer).setUint32(0, 999, true);
  assert.throws(
    () => parseDosPaCatalog(declaredSizeMismatch),
    /declared size 999 does not match file size 17/,
  );

  const tableExceedsFile = new Uint8Array(15);
  const tableExceedsFileView = new DataView(tableExceedsFile.buffer);
  tableExceedsFileView.setUint32(0, 15, true);
  tableExceedsFileView.setUint32(4, 1, true);
  assert.throws(
    () => parseDosPaCatalog(tableExceedsFile),
    /catalog table exceeds file size/,
  );

  assert.throws(
    () => parseDosPaCatalog(createGeneratedPaArchive(1, [{ index: 1, offset: 8, size: 1 }])),
    /entry 1 has invalid bounds \(entry-before-payload-table-end\)/,
  );
});
