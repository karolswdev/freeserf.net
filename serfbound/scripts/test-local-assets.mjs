const enabled = process.env["SERFBOUND_RUN_LOCAL_ASSET_TESTS"] === "1";

if (!enabled) {
  console.log(
    "serfbound-local-asset-tests-skipped: set SERFBOUND_RUN_LOCAL_ASSET_TESTS=1 to opt in.",
  );
  process.exit(0);
}

console.log(
  "serfbound-local-asset-tests-enabled: no local/manual asset tests are registered yet.",
);
