import { generateWhaleFlowSignal } from "./agents/whaleFlowAgent.js";
import { toCommitSignalArgs, toContractSignalPayload } from "./contractPayload.js";
import { buildDemoOutcome } from "./data/demoOutcomeData.js";
import { loadDemoMantleObservations } from "./data/demoMantleData.js";
import { resolveSignalOutcome, toContractResolutionPayload, toResolveSignalArgs } from "./resolver.js";

export function buildDemoCommitBundle(now = new Date(), agentId = BigInt(1)) {
  const [observation] = loadDemoMantleObservations();
  const signal = generateWhaleFlowSignal(observation, now);
  const payload = toContractSignalPayload(signal, agentId);
  const args = toCommitSignalArgs(payload);

  return {
    signal,
    observation,
    contract: {
      functionName: "commitSignal",
      payload,
      args
    }
  };
}

export function buildDemoResolutionBundle(now = new Date("2026-05-12T10:00:00.000Z")) {
  const [observation] = loadDemoMantleObservations();
  const signal = generateWhaleFlowSignal(observation, now);
  const outcome = buildDemoOutcome(signal);
  const resolution = resolveSignalOutcome(signal, outcome);
  const payload = toContractResolutionPayload(BigInt(1), resolution);
  const args = toResolveSignalArgs(payload);

  return {
    signal,
    outcome,
    resolution,
    contract: {
      functionName: "resolveSignal",
      payload,
      args
    }
  };
}

export function stringifyBigInts(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(stringifyBigInts);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([key, inner]) => [key, stringifyBigInts(inner)])
  );
}
