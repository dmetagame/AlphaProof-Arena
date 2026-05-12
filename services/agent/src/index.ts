import { buildDemoCommitBundle, buildDemoResolutionBundle, stringifyBigInts } from "./demoBundle.js";

const command = process.argv[2] || "generate";

if (!["generate", "resolve-demo"].includes(command)) {
  console.error(`Unknown command: ${command}`);
  console.error("Usage: npm run generate --workspace services/agent");
  process.exitCode = 1;
} else if (command === "generate") {
  console.log(JSON.stringify(stringifyBigInts(buildDemoCommitBundle()), null, 2));
} else {
  console.log(JSON.stringify(stringifyBigInts(buildDemoResolutionBundle()), null, 2));
}
