import assert from "node:assert/strict";
import { test } from "node:test";

import {
  assetImportBoundary,
  isSupportedArchiveName,
  validateArchiveFileSelection,
} from "@serfbound/assets";

test("asset import boundary accepts only the first supported DOS archive name", () => {
  assert.deepEqual(assetImportBoundary, {
    source: "user-provided-local-file",
    storesOriginalPayloadInGit: false,
    defaultArchiveExtension: ".PA",
    supportedDosArchiveNames: ["SPAU.PA"],
  });

  assert.equal(isSupportedArchiveName("SPAU.PA"), true);
  assert.equal(isSupportedArchiveName("spau.pa"), true);
  assert.equal(isSupportedArchiveName("SPAE.PA"), false);
  assert.equal(isSupportedArchiveName("SOUNDS.PA"), false);
});

test("archive selection validation exposes recoverable browser states", () => {
  assert.deepEqual(validateArchiveFileSelection(null), {
    state: "missing",
    message: "missing-user-data",
  });
  assert.deepEqual(validateArchiveFileSelection({ name: "", size: 0 }), {
    state: "missing",
    message: "missing-user-data",
  });
  assert.deepEqual(validateArchiveFileSelection({ name: "README.txt", size: 12 }), {
    state: "unsupported",
    message: "unsupported-archive-name",
    fileName: "README.txt",
  });
  assert.deepEqual(validateArchiveFileSelection({ name: "SPAU.PA", size: 32 }), {
    state: "supported",
    source: "dos-pa",
    normalizedName: "SPAU.PA",
    fileName: "SPAU.PA",
    byteLength: 32,
  });
});
