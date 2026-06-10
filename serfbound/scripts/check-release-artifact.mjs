import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const workspaceRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distRoot = join(workspaceRoot, "dist");

const forbiddenArtifactPathPattern =
  /(^|[/\\])(?:serfbound-local-data|SPA[A-Z]?\.PA|SOUNDS\.PA|SERF\.EXE|.*\.adf|.*\.exe|.*\.dll|.*\.dylib|.*\.so|.*\.dmg|.*\.app)(?:[/\\]|$)/i;
const forbiddenTextPattern =
  /\b(?:dotnet|FreeserfNet|Silk\.NET|libglfw|libbass|serfbound-local-data)\b/i;

function walkFiles(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      files.push(...walkFiles(path));
    } else {
      files.push(path);
    }
  }
  return files;
}

function isTextFile(path) {
  return /\.(?:html|css|js|json|txt|svg|map)$/i.test(path);
}

const violations = [];

if (!existsSync(distRoot)) {
  violations.push("dist artifact is missing; run npm run build:web first");
}

const files = violations.length === 0 ? walkFiles(distRoot) : [];

if (files.length === 0) {
  violations.push("dist artifact is empty");
}

for (const path of files) {
  const artifactPath = relative(distRoot, path);
  if (forbiddenArtifactPathPattern.test(artifactPath)) {
    violations.push(`${artifactPath}: forbidden desktop/runtime/original-data artifact path`);
  }

  if (!isTextFile(path)) {
    continue;
  }

  const contents = readFileSync(path, "utf8");
  if (forbiddenTextPattern.test(contents)) {
    violations.push(`${artifactPath}: forbidden desktop/runtime/local-data reference`);
  }
}

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(violation);
  }
  process.exit(1);
}

console.log(`serfbound-release-artifact-ok: inspected ${files.length} static files in dist/.`);
