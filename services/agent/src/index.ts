import { generateWhaleFlowSignal } from "./agents/whaleFlowAgent.js";
import { toCommitSignalArgs, toContractSignalPayload } from "./contractPayload.js";
import { loadDemoMantleObservations } from "./data/demoMantleData.js";

const command = process.argv[2] || "generate";

if (command !== "generate") {
  console.error(`Unknown command: ${command}`);
  console.error("Usage: npm run dev --workspace services/agent -- generate");
  process.exitCode = 1;
} else {
  const [observation] = loadDemoMantleObservations();
  const signal = generateWhaleFlowSignal(observation);
  const payload = toContractSignalPayload(signal, 1n);
  const args = toCommitSignalArgs(payload);

  console.log(JSON.stringify({
    signal,
    contract: {
      functionName: "commitSignal",
      payload: stringifyBigInts(payload),
      args: args.map((arg) => typeof arg === "bigint" ? arg.toString() : arg)
    }
  }, null, 2));
}

function stringifyBigInts(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(stringifyBigInts);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([key, inner]) => [key, stringifyBigInts(inner)])
  );
}

