import assert from "node:assert/strict";
import test from "node:test";
import { generateWhaleFlowSignal } from "./agents/whaleFlowAgent.js";
import { toCommitSignalArgs, toContractSignalPayload } from "./contractPayload.js";
import { buildDemoOutcome } from "./data/demoOutcomeData.js";
import { loadDemoMantleObservations } from "./data/demoMantleData.js";
import { resolveSignalOutcome, toContractResolutionPayload, toResolveSignalArgs } from "./resolver.js";

test("generates a valid whale flow signal from demo Mantle observations", () => {
  const [observation] = loadDemoMantleObservations();
  const signal = generateWhaleFlowSignal(observation, new Date("2026-05-12T10:00:00.000Z"));

  assert.equal(signal.agentName, "Whale Flow Agent");
  assert.equal(signal.kind, "WhaleFlow");
  assert.equal(signal.targetSymbol, "mETH");
  assert.equal(signal.direction, "bullish");
  assert.ok(signal.confidenceBps > 7000);
  assert.equal(signal.expiresAt, "2026-05-12T11:00:00.000Z");
  assert.match(signal.sourceDataHash, /^0x[a-fA-F0-9]{64}$/);
  assert.match(signal.explanationHash, /^0x[a-fA-F0-9]{64}$/);
});

test("converts a signal into SignalRegistry commit args", () => {
  const [observation] = loadDemoMantleObservations();
  const signal = generateWhaleFlowSignal(observation, new Date("2026-05-12T10:00:00.000Z"));
  const payload = toContractSignalPayload(signal, 12n);
  const args = toCommitSignalArgs(payload);

  assert.equal(payload.agentId, 12n);
  assert.equal(payload.kind, 0);
  assert.equal(payload.confidenceBps, signal.confidenceBps);
  assert.equal(payload.expiresAt, 1778583600n);
  assert.equal(args[0], 12n);
  assert.equal(args[1], 0);
  assert.equal(args[2], signal.targetId);
});

test("resolves a bullish signal into contract-ready score args", () => {
  const [observation] = loadDemoMantleObservations();
  const signal = generateWhaleFlowSignal(observation, new Date("2026-05-12T10:00:00.000Z"));
  const outcome = buildDemoOutcome(signal);
  const resolution = resolveSignalOutcome(signal, outcome);
  const payload = toContractResolutionPayload(99n, resolution);
  const args = toResolveSignalArgs(payload);

  assert.equal(resolution.correct, true);
  assert.ok(resolution.pnlBps > 0);
  assert.ok(resolution.reputationDelta > 0);
  assert.equal(args[0], 99n);
  assert.equal(args[1], true);
  assert.equal(args[2], BigInt(resolution.pnlBps));
  assert.equal(args[3], BigInt(resolution.reputationDelta));
});
