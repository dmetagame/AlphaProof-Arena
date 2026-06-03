import { createPublicClient, getAddress, http, parseAbi } from "viem";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const mantleSepoliaRpcUrl = process.env.MANTLE_SEPOLIA_RPC_URL || "https://rpc.sepolia.mantle.xyz";
const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 5003);

const agentRegistryAddress = getAddress(
  process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS || "0x3517b74800E6A731656D8cc809d77f730da4d1dA"
);
const scoreRegistryAddress = getAddress(
  process.env.NEXT_PUBLIC_SCORE_REGISTRY_ADDRESS || "0x746A932D764d37f10c2f474D170734A05a20e87a"
);
const signalRegistryAddress = getAddress(
  process.env.NEXT_PUBLIC_SIGNAL_REGISTRY_ADDRESS || "0x0d22DdC5d0Da0E4988b04E0647b4643e7BDfFc79"
);

const agentAbi = parseAbi([
  "function nextAgentId() view returns (uint256)",
  "function getAgent(uint256 agentId) view returns ((address owner,string name,string metadataURI,bool active,uint64 createdAt))"
]);

const scoreAbi = parseAbi([
  "function getScore(uint256 agentId) view returns ((uint256 resolvedSignals,uint256 correctSignals,int256 reputation,int256 cumulativePnLBps,uint64 updatedAt))"
]);

const signalAbi = parseAbi([
  "function nextSignalId() view returns (uint256)",
  "function signalsOfAgent(uint256 agentId) view returns (uint256[])",
  "function getSignal(uint256 signalId) view returns ((uint256 agentId,uint8 kind,bytes32 targetId,uint16 confidenceBps,uint64 createdAt,uint64 expiresAt,bytes32 sourceDataHash,bytes32 explanationHash,bool resolved,bool correct,int256 pnlBps))"
]);

const seededSignalMetadata: Record<string, {
  targetSymbol: string;
  direction: "bullish" | "bearish" | "neutral";
  thesis: string;
  commitTx: `0x${string}`;
  resolveTx?: `0x${string}`;
  evidence: {
    dataSource: string;
    observedAt?: string;
    sourceBlockRange?: string;
    outcomeBlockRange?: string;
    sourceTxCount?: number;
    outcomeTxCount?: number;
    uniqueWallets?: number;
    outcomeWallets?: number;
    whaleWallets?: number;
    netFlowUsd?: number;
    averageTransferUsd?: number;
    scoreDelta?: string;
    sourceTxs?: `0x${string}`[];
  };
}> = {
  "1": {
    targetSymbol: "mETH",
    direction: "bullish",
    thesis: "Whale Flow Agent detected $1,842,500 net inflow into mETH across 38 wallets, including 7 whale wallets.",
    commitTx: "0xd82437582404025f72d3c92bcb8cf75ccff5c07e804bd8bbbd6955f695b817cc",
    resolveTx: "0x546e1a4e5ab7a2177d5643ae31df352103e7a3adf8d70f30b19489e452b7b72e",
    evidence: {
      dataSource: "Mantle mETH whale-flow fixture",
      sourceTxCount: 38,
      uniqueWallets: 38,
      whaleWallets: 7,
      netFlowUsd: 1_842_500,
      scoreDelta: "+14 reputation / +237 bps"
    }
  },
  "2": {
    targetSymbol: "MNT",
    direction: "bullish",
    thesis: "Whale Flow Agent scanned live Mantle Sepolia blocks 39339173-39339196 and found 29 transactions across 12 wallets. The outcome window produced 28 transactions across 10 wallets, keeping activity above the active-network threshold.",
    commitTx: "0x253713fce55a69378e6ed030d01358590b60a3dabfd1afe8f7a5bb002b52f7e3",
    resolveTx: "0xa6731a1462f5c728ca636e431b32de65c903413eb9955f18168f742ecc1e1fab",
    evidence: {
      dataSource: "Mantle Sepolia RPC",
      observedAt: "2026-05-31T09:44:37.000Z",
      sourceBlockRange: "39339173-39339196",
      outcomeBlockRange: "39339261-39339284",
      sourceTxCount: 29,
      outcomeTxCount: 28,
      uniqueWallets: 12,
      outcomeWallets: 10,
      scoreDelta: "+20 reputation / +2867 bps"
    }
  }
};

const client = createPublicClient({
  transport: http(mantleSepoliaRpcUrl)
});

export async function GET() {
  try {
    const agentId = 1n;
    const nextAgentId = await readWithRetry(() => (
      client.readContract({ address: agentRegistryAddress, abi: agentAbi, functionName: "nextAgentId" })
    ));
    const nextSignalId = await readWithRetry(() => (
      client.readContract({ address: signalRegistryAddress, abi: signalAbi, functionName: "nextSignalId" })
    ));
    const agent = await readWithRetry(() => (
      client.readContract({ address: agentRegistryAddress, abi: agentAbi, functionName: "getAgent", args: [agentId] })
    ));
    const score = await readWithRetry(() => (
      client.readContract({ address: scoreRegistryAddress, abi: scoreAbi, functionName: "getScore", args: [agentId] })
    ));
    const signalIds = await readWithRetry(() => (
      client.readContract({ address: signalRegistryAddress, abi: signalAbi, functionName: "signalsOfAgent", args: [agentId] })
    ));

    const signals = [];
    for (const signalId of signalIds) {
      const signal = await readWithRetry(() => (
        client.readContract({
          address: signalRegistryAddress,
          abi: signalAbi,
          functionName: "getSignal",
          args: [signalId]
        })
      ));
      const id = signalId.toString();
      const metadata = seededSignalMetadata[id];

      signals.push({
        id,
        agentId: signal.agentId,
        kind: signal.kind,
        targetId: signal.targetId,
        targetSymbol: metadata?.targetSymbol || shortenHash(signal.targetId),
        direction: metadata?.direction || "neutral",
        confidenceBps: signal.confidenceBps,
        createdAt: signal.createdAt,
        expiresAt: signal.expiresAt,
        sourceDataHash: signal.sourceDataHash,
        explanationHash: signal.explanationHash,
        resolved: signal.resolved,
        correct: signal.correct,
        pnlBps: signal.pnlBps,
        thesis: metadata?.thesis,
        commitTx: metadata?.commitTx,
        resolveTx: metadata?.resolveTx,
        evidence: metadata?.evidence
      });
    }

    return Response.json(stringifyBigInts({
      chainId,
      observedAt: new Date().toISOString(),
      contracts: {
        agentRegistry: agentRegistryAddress,
        scoreRegistry: scoreRegistryAddress,
        signalRegistry: signalRegistryAddress
      },
      nextAgentId,
      nextSignalId,
      agent,
      score,
      signals
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "failed to read Mantle state";
    return Response.json({ error: message }, { status: 502 });
  }
}

function stringifyBigInts(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(stringifyBigInts);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, inner]) => [key, stringifyBigInts(inner)])
  );
}

function shortenHash(hash: string) {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

async function readWithRetry<T>(read: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await read();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await delay(350 * attempt);
    }
  }

  throw lastError;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
