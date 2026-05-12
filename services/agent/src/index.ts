import { generateWhaleFlowSignal } from "./agents/whaleFlowAgent.js";
import { toCommitSignalArgs, toContractSignalPayload } from "./contractPayload.js";
import { buildDemoOutcome } from "./data/demoOutcomeData.js";
import { loadDemoMantleObservations } from "./data/demoMantleData.js";
import { resolveSignalOutcome, toContractResolutionPayload, toResolveSignalArgs } from "./resolver.js";

const command = process.argv[2] || "generate";

if (!["generate", "resolve-demo"].includes(command)) {
  console.error(`Unknown command: ${command}`);
  console.error("Usage: npm run generate --workspace services/agent");
  process.exitCode = 1;
} else if (command === "generate") {
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
} else {
  const [observation] = loadDemoMantleObservations();
  const signal = generateWhaleFlowSignal(observation, new Date("2026-05-12T10:00:00.000Z"));
  const outcome = buildDemoOutcome(signal);
  const resolution = resolveSignalOutcome(signal, outcome);
  const payload = toContractResolutionPayload(1n, resolution);
  const args = toResolveSignalArgs(payload);

  console.log(JSON.stringify({
    signal,
    outcome,
    resolution,
    contract: {
      functionName: "resolveSignal",
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
