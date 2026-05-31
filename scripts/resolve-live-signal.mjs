import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Contract, JsonRpcProvider, Wallet } from "ethers";
import { hashJson } from "../services/agent/dist/hash.js";
import { loadLiveMantleObservation } from "../services/agent/dist/data/liveMantleRpcData.js";
import {
  resolveActivitySignalOutcome,
  toContractResolutionPayload,
  toResolveSignalArgs
} from "../services/agent/dist/resolver.js";

const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
if (!privateKey) {
  throw new Error("DEPLOYER_PRIVATE_KEY is required");
}

const rpcUrl = process.env.MANTLE_SEPOLIA_RPC_URL || "https://rpc.sepolia.mantle.xyz";
const deploymentPath = resolve(process.cwd(), "deployment-artifacts/mantle-sepolia.json");
const liveSignalPath = resolve(process.cwd(), "deployment-artifacts/live-signal.json");
const deployment = JSON.parse(readFileSync(deploymentPath, "utf8"));
const liveSignal = JSON.parse(readFileSync(liveSignalPath, "utf8"));

const provider = new JsonRpcProvider(rpcUrl);
const wallet = new Wallet(privateKey, provider);

const signalRegistry = new Contract(
  deployment.contracts.SignalRegistry.address,
  [
    "function getSignal(uint256 signalId) view returns (tuple(uint256 agentId,uint8 kind,bytes32 targetId,uint16 confidenceBps,uint64 createdAt,uint64 expiresAt,bytes32 sourceDataHash,bytes32 explanationHash,bool resolved,bool correct,int256 pnlBps))",
    "function resolveSignal(uint256 signalId,bool correct,int256 pnlBps,int256 reputationDelta)"
  ],
  wallet
);

const scoreRegistry = new Contract(
  deployment.contracts.ScoreRegistry.address,
  [
    "function getScore(uint256 agentId) view returns (tuple(uint256 resolvedSignals,uint256 correctSignals,int256 reputation,int256 cumulativePnLBps,uint64 updatedAt))"
  ],
  wallet
);

const signalId = BigInt(liveSignal.signalId);
const agentId = BigInt(liveSignal.agentId);
const onchainSignal = await signalRegistry.getSignal(signalId);
const beforeScore = await scoreRegistry.getScore(agentId);
const now = BigInt(Math.floor(Date.now() / 1000));

if (!onchainSignal.resolved && BigInt(onchainSignal.expiresAt) > now) {
  throw new Error(`signal ${signalId} is not expired yet; retry after ${new Date(Number(onchainSignal.expiresAt) * 1000).toISOString()}`);
}

const outcomeObservation = await loadLiveMantleObservation();
const activityThreshold = Number(process.env.LIVE_ACTIVITY_THRESHOLD || 20);
const outcome = {
  targetSymbol: liveSignal.signal.targetSymbol,
  targetId: liveSignal.signal.targetId,
  windowStart: liveSignal.signal.expiresAt,
  windowEnd: outcomeObservation.observedAt,
  baselineTxCount: liveSignal.observation.txCount,
  outcomeTxCount: outcomeObservation.txCount,
  baselineUniqueWallets: liveSignal.observation.uniqueWallets,
  outcomeUniqueWallets: outcomeObservation.uniqueWallets,
  activityThreshold,
  sourceDataHash: hashJson(outcomeObservation)
};
const resolution = resolveActivitySignalOutcome(liveSignal.signal, outcome);
const payload = toContractResolutionPayload(signalId, resolution);
const args = toResolveSignalArgs(payload);

const output = {
  network: deployment.network,
  chainId: deployment.chainId,
  createdAt: new Date().toISOString(),
  agentId: agentId.toString(),
  signalId: signalId.toString(),
  alreadyResolved: Boolean(onchainSignal.resolved),
  baselineObservation: liveSignal.observation,
  outcomeObservation,
  outcome,
  resolution,
  contract: {
    functionName: "resolveSignal",
    payload,
    args
  },
  beforeScore: formatScore(beforeScore)
};

if (onchainSignal.resolved) {
  output.resolveSignalTx = null;
  output.afterScore = formatScore(beforeScore);
  console.log("Signal already resolved:", output.signalId);
} else {
  const tx = await signalRegistry.resolveSignal(...args);
  const receipt = await tx.wait();
  const afterScore = await scoreRegistry.getScore(agentId);

  output.resolveSignalTx = tx.hash;
  output.blockNumber = receipt?.blockNumber;
  output.afterScore = formatScore(afterScore);

  console.log("Signal ID:", output.signalId);
  console.log("resolveSignal tx:", output.resolveSignalTx);
}

const outputPath = resolve(process.cwd(), "deployment-artifacts/live-resolution.json");
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(stringifyBigInts(output), null, 2)}\n`);

console.log("Correct:", resolution.correct);
console.log("Activity bps:", resolution.pnlBps);
console.log("Reputation delta:", resolution.reputationDelta);
console.log("Outcome blocks:", `${outcomeObservation.fromBlock}-${outcomeObservation.toBlock}`);
console.log("Live resolution artifact:", outputPath);

function formatScore(score) {
  return {
    resolvedSignals: score.resolvedSignals.toString(),
    correctSignals: score.correctSignals.toString(),
    reputation: score.reputation.toString(),
    cumulativePnLBps: score.cumulativePnLBps.toString(),
    updatedAt: score.updatedAt.toString()
  };
}

function stringifyBigInts(value) {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(stringifyBigInts);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, inner]) => [key, stringifyBigInts(inner)])
  );
}
