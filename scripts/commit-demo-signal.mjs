import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Contract, JsonRpcProvider, Wallet } from "ethers";
import { buildDemoCommitBundle, buildLiveCommitBundle, stringifyBigInts } from "../services/agent/dist/demoBundle.js";

const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
if (!privateKey) {
  throw new Error("DEPLOYER_PRIVATE_KEY is required");
}

const rpcUrl = process.env.MANTLE_SEPOLIA_RPC_URL || "https://rpc.sepolia.mantle.xyz";
const deploymentPath = resolve(process.cwd(), "deployment-artifacts/mantle-sepolia.json");
const deployment = JSON.parse(readFileSync(deploymentPath, "utf8"));

const provider = new JsonRpcProvider(rpcUrl);
const wallet = new Wallet(privateKey, provider);

const agentRegistry = new Contract(
  deployment.contracts.AgentRegistry.address,
  [
    "function nextAgentId() view returns (uint256)",
    "function registerAgent(string name,string metadataURI) returns (uint256)"
  ],
  wallet
);

const signalRegistry = new Contract(
  deployment.contracts.SignalRegistry.address,
  [
    "function nextSignalId() view returns (uint256)",
    "function commitSignal(uint256 agentId,uint8 kind,bytes32 targetId,uint16 confidenceBps,uint64 expiresAt,bytes32 sourceDataHash,bytes32 explanationHash) returns (uint256)"
  ],
  wallet
);

const agentId = await agentRegistry.nextAgentId();
const registerTx = await agentRegistry.registerAgent(
  "Whale Flow Agent",
  "https://github.com/dmetagame/AlphaProof-Arena/tree/main/services/agent"
);
await registerTx.wait();

const signalId = await signalRegistry.nextSignalId();
let bundle;
let dataSourceMode = "live-mantle-rpc";
try {
  bundle = await buildLiveCommitBundle(new Date(), agentId);
} catch (error) {
  dataSourceMode = "demo-fallback";
  console.warn(`Live Mantle RPC observation failed, using demo fallback: ${error instanceof Error ? error.message : String(error)}`);
  bundle = buildDemoCommitBundle(new Date(), agentId);
}
const commitTx = await signalRegistry.commitSignal(...bundle.contract.args);
await commitTx.wait();

const output = {
  network: deployment.network,
  chainId: deployment.chainId,
  createdAt: new Date().toISOString(),
  agentId: agentId.toString(),
  signalId: signalId.toString(),
  registerAgentTx: registerTx.hash,
  commitSignalTx: commitTx.hash,
  dataSourceMode,
  signal: bundle.signal,
  contract: stringifyBigInts(bundle.contract)
};

const outputPath = resolve(process.cwd(), "deployment-artifacts/demo-signal.json");
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);

console.log("Agent ID:", output.agentId);
console.log("Signal ID:", output.signalId);
console.log("registerAgent tx:", output.registerAgentTx);
console.log("commitSignal tx:", output.commitSignalTx);
console.log("Demo signal artifact:", outputPath);
