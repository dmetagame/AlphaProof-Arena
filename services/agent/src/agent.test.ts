import assert from "node:assert/strict";
import test from "node:test";
import { parseEther } from "viem";
import { generateWhaleFlowSignal } from "./agents/whaleFlowAgent.js";
import { toCommitSignalArgs, toContractSignalPayload } from "./contractPayload.js";
import { buildDemoOutcome } from "./data/demoOutcomeData.js";
import { loadDemoMantleObservations } from "./data/demoMantleData.js";
import { buildMantleNativeTransferObservation } from "./data/liveMantleRpcData.js";
import { buildDemoCommitBundle, stringifyBigInts } from "./demoBundle.js";
import { resolveSignalOutcome, toContractResolutionPayload, toResolveSignalArgs } from "./resolver.js";

test("generates a valid whale flow signal from demo Mantle observations", () => {
  const [observation] = loadDemoMantleObservations();
  const signal = generateWhaleFlowSignal(observation, new Date("2026-05-12T10:00:00.000Z"));

  assert.equal(signal.agentName, "Whale Flow Agent");
  assert.equal(signal.kind, "WhaleFlow");
  assert.equal(signal.targetSymbol, "MNT");
  assert.equal(signal.direction, "bullish");
  assert.ok(signal.confidenceBps > 6500);
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

test("builds a JSON-safe demo commit bundle for the web API", () => {
  const bundle = buildDemoCommitBundle(new Date("2026-05-12T10:00:00.000Z"));
  const json = stringifyBigInts(bundle) as {
    contract: {
      functionName: string;
      payload: { agentId: string; expiresAt: string };
      args: unknown[];
    };
  };

  assert.equal(bundle.signal.targetSymbol, "MNT");
  assert.equal(bundle.contract.functionName, "commitSignal");
  assert.equal(json.contract.payload.agentId, "1");
  assert.equal(json.contract.payload.expiresAt, "1778583600");
  assert.equal(json.contract.args.length, 7);
});

test("builds a Mantle observation from live RPC block-shaped data", () => {
  const observation = buildMantleNativeTransferObservation([
    {
      number: 100n,
      timestamp: 1778850000n,
      transactions: [
        {
          hash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          from: "0x1111111111111111111111111111111111111111",
          to: "0x2222222222222222222222222222222222222222",
          value: parseEther("12.5"),
          gas: 21000n,
          gasPrice: 1_000_000_000n
        }
      ]
    },
    {
      number: 101n,
      timestamp: 1778850060n,
      transactions: [
        {
          hash: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          from: "0x3333333333333333333333333333333333333333",
          to: "0x4444444444444444444444444444444444444444",
          value: parseEther("0.75"),
          gas: 21000n,
          gasPrice: 1_000_000_000n
        }
      ]
    }
  ], { mntUsdPrice: 1 });

  assert.equal(observation.dataSource, "mantle-sepolia-rpc-native-transfers");
  assert.equal(observation.targetSymbol, "MNT");
  assert.equal(observation.targetAddress, "0x0000000000000000000000000000000000000000");
  assert.equal(observation.fromBlock, 100);
  assert.equal(observation.toBlock, 101);
  assert.equal(observation.txCount, 2);
  assert.equal(observation.uniqueWallets, 4);
  assert.equal(observation.whaleWallets, 1);
  assert.deepEqual(observation.sourceTxs, [
    "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
  ]);
});
