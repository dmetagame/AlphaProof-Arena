import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Contract, JsonRpcProvider, Wallet } from "ethers";
import { buildLiveCommitBundle, stringifyBigInts } from "../services/agent/dist/demoBundle.js";

const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
if (!privateKey) {
  throw new Error("DEPLOYER_PRIVATE_KEY is required");
}

const rpcUrl = process.env.MANTLE_SEPOLIA_RPC_URL || "https://rpc.sepolia.mantle.xyz";
const agentId = BigInt(process.env.LIVE_AGENT_ID || "1");
const expiryMinutes = Number(process.env.LIVE_SIGNAL_EXPIRY_MINUTES || 2);
const deploymentPath = resolve(process.cwd(), "deployment-artifacts/mantle-sepolia.json");
const deployment = JSON.parse(readFileSync(deploymentPath, "utf8"));

const provider = new JsonRpcProvider(rpcUrl);
const wallet = new Wallet(privateKey, provider);

const signalRegistry = new Contract(
  deployment.contracts.SignalRegistry.address,
  [
    "function nextSignalId() view returns (uint256)",
    "function commitSignal(uint256 agentId,uint8 kind,bytes32 targetId,uint16 confidenceBps,uint64 expiresAt,bytes32 sourceDataHash,bytes32 explanationHash) returns (uint256)"
  ],
  wallet
);

const signalId = await signalRegistry.nextSignalId();
const bundle = await buildLiveCommitBundle(new Date(), agentId, { expiryMinutes });
const commitTx = await signalRegistry.commitSignal(...bundle.contract.args);
const receipt = await commitTx.wait();

const output = {
  network: deployment.network,
  chainId: deployment.chainId,
  createdAt: new Date().toISOString(),
  agentId: agentId.toString(),
  signalId: signalId.toString(),
  commitSignalTx: commitTx.hash,
  blockNumber: receipt?.blockNumber,
  dataSourceMode: "live-mantle-rpc",
  observation: bundle.observation,
  signal: bundle.signal,
  contract: stringifyBigInts(bundle.contract)
};

const outputPath = resolve(process.cwd(), "deployment-artifacts/live-signal.json");
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);

console.log("Agent ID:", output.agentId);
console.log("Signal ID:", output.signalId);
console.log("commitSignal tx:", output.commitSignalTx);
console.log("Expires at:", output.signal.expiresAt);
console.log("Source blocks:", `${output.observation.fromBlock}-${output.observation.toBlock}`);
console.log("Live signal artifact:", outputPath);
