import { createPublicClient, http } from "viem";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const mantleSepoliaRpcUrl = process.env.MANTLE_SEPOLIA_RPC_URL || "https://rpc.sepolia.mantle.xyz";
const TICKER_BLOCK_COUNT = 8;

const client = createPublicClient({ transport: http(mantleSepoliaRpcUrl) });

type TickerEntry = {
  blockNumber: string;
  timestamp: string;
  txCount: number;
  sampleTx?: `0x${string}`;
};

export async function GET() {
  try {
    const latest = await client.getBlockNumber();
    const numbers = Array.from({ length: TICKER_BLOCK_COUNT }, (_, index) => latest - BigInt(index));
    const results = await Promise.allSettled(
      numbers.map((blockNumber) => client.getBlock({ blockNumber, includeTransactions: true }))
    );

    const entries: TickerEntry[] = [];
    for (const result of results) {
      if (result.status !== "fulfilled") continue;
      const block = result.value;
      const sample = block.transactions.find((tx) => typeof tx !== "string");
      const sampleHash = sample && typeof sample !== "string" ? sample.hash : undefined;
      entries.push({
        blockNumber: (block.number ?? 0n).toString(),
        timestamp: block.timestamp.toString(),
        txCount: block.transactions.length,
        sampleTx: sampleHash
      });
    }

    return Response.json({
      observedAt: new Date().toISOString(),
      chainId: 5003,
      entries
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ticker fetch failed";
    return Response.json({ error: message, entries: [] }, { status: 502 });
  }
}
