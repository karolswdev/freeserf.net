import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));

const docs = new Map([
  ["player", normalizeDoc(readDoc("docs/player-guide.md"))],
  ["developer", normalizeDoc(readDoc("docs/developer-guide.md"))],
  ["static", normalizeDoc(readDoc("docs/static-hosting-release.md"))],
  ["index", normalizeDoc(readDoc("docs/README.md"))],
]);

const requiredText = new Map([
  [
    "player",
    [
      "The app does not include, host, sell, download, or redistribute original DOS/Amiga game data.",
      "Use `Import data`.",
      "Choose your local `SPAU.PA` file.",
      "Use `Start game`.",
      "Use `Save game` after a local game is running.",
      "`Clear save` deletes only the local-game save.",
      "`Clear data` deletes imported data",
      "Browser storage is tied to the origin",
      "If imported data cannot be restored",
      "If saving fails because storage is full or blocked",
    ],
  ],
  [
    "developer",
    [
      "npm ci",
      "npm test",
      "npm run ci:release",
      "pm/roadmap/serfbound/reference-fixtures/ci/",
      "Product runtime code must not import or run",
      "SERFBOUND_RUN_LOCAL_ASSET_TESTS=1",
      "npm run test:local:assets",
      "npm run release:static",
      "npm run test:release:static",
      "evidence-story-{n}.md",
      "Do not use `--no-verify`.",
    ],
  ],
  [
    "static",
    [
      "The release artifact is `serfbound/dist/`.",
      "The static host never receives, stores, or serves that data.",
      "index.html: Cache-Control: no-cache",
      "assets/*: Cache-Control: public, max-age=31536000, immutable",
    ],
  ],
  [
    "index",
    [
      "[Player guide](./player-guide.md)",
      "[Developer guide](./developer-guide.md)",
      "[Static hosting release](./static-hosting-release.md)",
    ],
  ],
]);

const forbiddenPhrases = [
  "Serfbound includes original game data",
  "Serfbound hosts original game data",
  "download SPAU.PA from Serfbound",
  "commit SPAU.PA",
  "bundle SPAU.PA",
  "run SERF.EXE",
  "requires .NET",
  "desktop launcher required",
];

const violations = [];

for (const [docName, needles] of requiredText) {
  const text = docs.get(docName);
  if (text === undefined) {
    violations.push(`${docName}: doc not loaded`);
    continue;
  }

  for (const needle of needles) {
    if (!text.includes(needle)) {
      violations.push(`${docName}: missing required text: ${needle}`);
    }
  }
}

for (const [docName, text] of docs) {
  for (const phrase of forbiddenPhrases) {
    if (text.includes(phrase)) {
      violations.push(`${docName}: forbidden release/docs phrase: ${phrase}`);
    }
  }
}

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(violation);
  }
  process.exit(1);
}

console.log("serfbound-docs-ok: player, developer, and static hosting docs cover required release topics.");

function readDoc(path) {
  return readFileSync(join(workspaceRoot, path), "utf8");
}

function normalizeDoc(text) {
  return text.replace(/\s+/g, " ").trim();
}
