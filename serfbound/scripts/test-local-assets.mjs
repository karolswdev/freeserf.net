const enabled = process.env["SERFBOUND_RUN_LOCAL_ASSET_TESTS"] === "1";

if (!enabled) {
  console.log(
    "serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.",
  );
  process.exit(0);
}

const configuredPath = process.env["SERFBOUND_SPAU_PA"];

if (configuredPath === undefined || configuredPath.trim() === "") {
  console.log(
    "serfbound-local-asset-tests-enabled: set SERFBOUND_SPAU_PA to validate a local file.",
  );
  process.exit(0);
}

const fileName = configuredPath.split(/[\\/]/).at(-1) ?? "";
if (fileName.toLowerCase() !== "spau.pa") {
  console.error(
    `serfbound-local-asset-tests-failed: expected SPAU.PA, received ${fileName}.`,
  );
  process.exit(1);
}

console.log("serfbound-local-asset-tests-ok: configured local SPAU.PA path accepted.");
