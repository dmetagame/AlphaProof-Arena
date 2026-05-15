import { createPublicClient, formatEther, http } from "viem";
import { MantleObservation, MantleObservationSchema } from "../schema.js";

const NATIVE_MNT_ADDRESS = "0x0000000000000000000000000000000000000000";
const DEFAULT_BLOCK_WINDOW = 24;
const DEFAULT_MNT_USD_PRICE = 1;
const WHALE_TRANSFER_MNT = 10;

type NativeTransfer = {
  hash: `0x${string}`;
  from: `0x${string}`;
  to: `0x${string}` | null;
  value: bigint;
  gas: bigint;
  gasPrice: bigint;
};

export type MantleRpcBlock = {
  number: bigint;
  timestamp: bigint;
  transactions: NativeTransfer[];
};

export type LiveMantleObservationOptions = {
  rpcUrl?: string;
  blockWindow?: number;
  mntUsdPrice?: number;
};

export async function loadLiveMantleObservation(
  options: LiveMantleObservationOptions = {}
): Promise<MantleObservation> {
  const rpcUrl = options.rpcUrl || process.env.MANTLE_SEPOLIA_RPC_URL || "https://rpc.sepolia.mantle.xyz";
  const blockWindow = options.blockWindow
    ?? Number(process.env.MANTLE_OBSERVATION_BLOCKS || DEFAULT_BLOCK_WINDOW);
  const mntUsdPrice = options.mntUsdPrice
    ?? Number(process.env.MNT_USD_PRICE || DEFAULT_MNT_USD_PRICE);
  const client = createPublicClient({ transport: http(rpcUrl) });
  const [chainId, latestBlockNumber] = await Promise.all([
    client.getChainId(),
    client.getBlockNumber()
  ]);

  if (chainId !== 5003) {
    throw new Error(`expected Mantle Sepolia chain 5003, received ${chainId}`);
  }

  const safeWindow = Math.max(1, Math.min(blockWindow, 120));
  const fromBlockNumber = latestBlockNumber > BigInt(safeWindow - 1)
    ? latestBlockNumber - BigInt(safeWindow - 1)
    : 0n;
  const blockNumbers = Array.from({ length: Number(latestBlockNumber - fromBlockNumber + 1n) }, (_, index) => (
    fromBlockNumber + BigInt(index)
  ));

  const blockResults = await Promise.allSettled(
    blockNumbers.map((blockNumber) => client.getBlock({ blockNumber, includeTransactions: true }))
  );
  const blocks = blockResults
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);

  if (blocks.length === 0) {
    blocks.push(await client.getBlock({ blockTag: "latest", includeTransactions: true }));
  }

  return buildMantleNativeTransferObservation(
    blocks.map((block) => ({
      number: block.number ?? 0n,
      timestamp: block.timestamp,
      transactions: block.transactions.map((transaction) => ({
        hash: transaction.hash,
        from: transaction.from,
        to: transaction.to,
        value: transaction.value,
        gas: transaction.gas,
        gasPrice: transaction.gasPrice ?? transaction.maxFeePerGas ?? 0n
      }))
    })),
    { mntUsdPrice }
  );
}

export function buildMantleNativeTransferObservation(
  blocks: MantleRpcBlock[],
  options: { mntUsdPrice?: number; now?: Date } = {}
): MantleObservation {
  if (blocks.length === 0) {
    throw new Error("cannot build Mantle observation without blocks");
  }

  const sortedBlocks = [...blocks].sort((a, b) => Number(a.number - b.number));
  const transfers = sortedBlocks.flatMap((block) => (
    block.transactions
      .filter((transaction) => transaction.value > 0n)
      .map((transaction) => ({ ...transaction, blockNumber: block.number }))
  ));
  const sourceTransactions = transfers.length > 0
    ? transfers
    : sortedBlocks.flatMap((block) => block.transactions.map((transaction) => ({ ...transaction, blockNumber: block.number })));

  if (sourceTransactions.length === 0) {
    throw new Error("recent Mantle blocks had no transactions to analyze");
  }

  const mntUsdPrice = options.mntUsdPrice ?? DEFAULT_MNT_USD_PRICE;
  const wallets = new Set<string>();
  let totalMnt = 0;
  let whaleWallets = 0;

  for (const transaction of sourceTransactions) {
    wallets.add(transaction.from.toLowerCase());
    if (transaction.to) wallets.add(transaction.to.toLowerCase());

    const valueMnt = Number(formatEther(transaction.value));
    const gasBudgetMnt = Number(formatEther(transaction.gas * transaction.gasPrice));
    const activityMnt = valueMnt + gasBudgetMnt;
    totalMnt += activityMnt;
    if (valueMnt >= WHALE_TRANSFER_MNT || gasBudgetMnt >= 0.1) whaleWallets += 1;
  }

  const latestBlock = sortedBlocks[sortedBlocks.length - 1];
  const firstBlock = sortedBlocks[0];
  const windowSeconds = Math.max(1, Number(latestBlock.timestamp - firstBlock.timestamp));
  const txCount = sourceTransactions.length;
  const totalTransferUsd = totalMnt * mntUsdPrice;
  const sourceTxs = [...new Set(sourceTransactions.map((transaction) => transaction.hash))].slice(0, 12);

  return MantleObservationSchema.parse({
    chainId: 5003,
    observedAt: new Date(Number(latestBlock.timestamp) * 1000).toISOString(),
    dataSource: "mantle-sepolia-rpc-native-transfers",
    fromBlock: Number(firstBlock.number),
    toBlock: Number(latestBlock.number),
    targetSymbol: "MNT",
    targetAddress: NATIVE_MNT_ADDRESS,
    windowMinutes: Math.max(1, Math.round(windowSeconds / 60)),
    netFlowUsd: Number(totalTransferUsd.toFixed(4)),
    uniqueWallets: wallets.size,
    whaleWallets,
    averageTransferUsd: txCount === 0 ? 0 : Number((totalTransferUsd / txCount).toFixed(4)),
    txCount,
    sourceTxs
  });
}
