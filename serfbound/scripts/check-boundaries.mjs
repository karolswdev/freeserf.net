import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const workspaceRoot = new URL("..", import.meta.url).pathname;
const forbiddenDependencyPattern =
  /(^|[/@-])(electron|tauri|dotnet|mono|blazor|edge-js|node-gyp|nativefier)([/@-]|$)/i;
const forbiddenAssetPathPattern =
  /(^|[/\\])(SPA[A-Z]?\.PA|SOUNDS\.PA|SERF\.EXE|.*\.adf|serfbound-local-data)([/\\]|$)/i;
const productSourceForbiddenPattern =
  /pm[/\\]roadmap[/\\]serfbound[/\\]reference-tools|reference-tools|serfbound-local-data/i;

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function packageJsonPaths() {
  const packagesDir = join(workspaceRoot, "packages");
  return [
    join(workspaceRoot, "package.json"),
    ...readdirSync(packagesDir)
      .map((name) => join(packagesDir, name, "package.json"))
      .filter((path) => statSync(path).isFile()),
  ];
}

function sourceFilePaths(dir) {
  const paths = [];

  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      if (name !== "dist" && name !== "node_modules") {
        paths.push(...sourceFilePaths(path));
      }
      continue;
    }

    if (/\.(mjs|js|ts|tsx)$/.test(name)) {
      paths.push(path);
    }
  }

  return paths;
}

const violations = [];

for (const path of packageJsonPaths()) {
  const manifest = readJson(path);
  const dependencyGroups = [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies",
  ];

  for (const group of dependencyGroups) {
    for (const dependencyName of Object.keys(manifest[group] ?? {})) {
      if (forbiddenDependencyPattern.test(dependencyName)) {
        violations.push(`${path}: forbidden dependency ${dependencyName}`);
      }
    }
  }

  const serialized = JSON.stringify(manifest);
  if (forbiddenAssetPathPattern.test(serialized)) {
    violations.push(`${path}: forbidden local/original asset path reference`);
  }
}

for (const path of sourceFilePaths(join(workspaceRoot, "packages"))) {
  if (productSourceForbiddenPattern.test(readFileSync(path, "utf8"))) {
    violations.push(
      `${path}: product package source must not reference local data or reference tools`,
    );
  }
}

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(violation);
  }
  process.exit(1);
}

console.log("serfbound-boundaries-ok");
