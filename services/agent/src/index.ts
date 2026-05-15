import { buildDemoCommitBundle, buildDemoResolutionBundle, buildLiveCommitBundle, stringifyBigInts } from "./demoBundle.js";

const command = process.argv[2] || "generate";

if (!["generate", "resolve-demo"].includes(command)) {
  console.error(`Unknown command: ${command}`);
  console.error("Usage: npm run generate --workspace services/agent");
  process.exitCode = 1;
} else if (command === "generate") {
  try {
    console.log(JSON.stringify(stringifyBigInts(await buildLiveCommitBundle()), null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Live Mantle RPC observation failed, using demo fallback: ${message}`);
    console.log(JSON.stringify(stringifyBigInts(buildDemoCommitBundle()), null, 2));
  }
} else {
  console.log(JSON.stringify(stringifyBigInts(buildDemoResolutionBundle()), null, 2));
}
