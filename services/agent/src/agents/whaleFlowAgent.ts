import { hashJson, hashText } from "../hash.js";
import { AlphaSignal, AlphaSignalSchema, MantleObservation } from "../schema.js";

const AGENT_NAME = "Whale Flow Agent";

export function generateWhaleFlowSignal(
  observation: MantleObservation,
  now = new Date(),
  options: { expiryMinutes?: number } = {}
): AlphaSignal {
  const whaleConcentration = observation.uniqueWallets === 0
    ? 0
    : observation.whaleWallets / observation.uniqueWallets;
  const isLiveMantleRpc = observation.dataSource === "mantle-sepolia-rpc-native-transfers";
  const flowIntensity = isLiveMantleRpc
    ? Math.min(observation.txCount / 30, 1)
    : Math.min(Math.abs(observation.netFlowUsd) / 2_000_000, 1);
  const transferIntensity = isLiveMantleRpc
    ? Math.min(observation.uniqueWallets / 12, 1)
    : Math.min(observation.averageTransferUsd / 150_000, 1);

  const rawConfidence = 4500
    + Math.round(flowIntensity * 2600)
    + Math.round(transferIntensity * 1300)
    + Math.round(Math.min(whaleConcentration, 0.5) * 3000);
  const confidenceBps = Math.max(1, Math.min(rawConfidence, 9200));

  const direction = isLiveMantleRpc
    ? observation.txCount >= 20
      ? "bullish"
      : observation.txCount <= 5
        ? "bearish"
        : "neutral"
    : observation.netFlowUsd > 250_000
      ? "bullish"
      : observation.netFlowUsd < -250_000
        ? "bearish"
        : "neutral";

  const expiryMinutes = options.expiryMinutes ?? 60;
  const expiresAt = new Date(now.getTime() + expiryMinutes * 60 * 1000);
  const sourceDataHash = hashJson(observation);
  const thesis = buildThesis(observation, direction, confidenceBps, expiryMinutes);
  const explanationHash = hashText(thesis);

  return AlphaSignalSchema.parse({
    agentName: AGENT_NAME,
    kind: "WhaleFlow",
    targetId: hashText(`mantle:${observation.targetAddress.toLowerCase()}:${observation.targetSymbol}`),
    targetSymbol: observation.targetSymbol,
    confidenceBps,
    expiresAt: expiresAt.toISOString(),
    direction,
    thesis,
    sourceDataHash,
    explanationHash,
    sourceTxs: observation.sourceTxs,
    features: {
      netFlowUsd: observation.netFlowUsd,
      whaleWallets: observation.whaleWallets,
      uniqueWallets: observation.uniqueWallets,
      whaleConcentration: Number(whaleConcentration.toFixed(4)),
      averageTransferUsd: observation.averageTransferUsd,
      txCount: observation.txCount,
      windowMinutes: observation.windowMinutes,
      dataSource: observation.dataSource ?? "demo-fixture",
      fromBlock: observation.fromBlock ?? 0,
      toBlock: observation.toBlock ?? 0
    }
  });
}

function buildThesis(
  observation: MantleObservation,
  direction: AlphaSignal["direction"],
  confidenceBps: number,
  expiryMinutes: number
): string {
  const flow = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(observation.netFlowUsd);
  const confidence = `${(confidenceBps / 100).toFixed(2)}%`;
  const horizon = formatHorizon(expiryMinutes);

  if (observation.dataSource === "mantle-sepolia-rpc-native-transfers") {
    const blockRange = observation.fromBlock && observation.toBlock
      ? ` blocks ${observation.fromBlock}-${observation.toBlock}`
      : " recent blocks";

    return `${AGENT_NAME} scanned live Mantle Sepolia${blockRange} and found ${observation.txCount} transactions across ${observation.uniqueWallets} wallets. The agent marks MNT network activity as ${direction} with ${confidence} confidence for ${horizon}.`;
  }

  if (direction === "bullish") {
    return `${AGENT_NAME} detected ${flow} net inflow into ${observation.targetSymbol} across ${observation.uniqueWallets} wallets, including ${observation.whaleWallets} whale wallets. The agent marks this as bullish with ${confidence} confidence for ${horizon}.`;
  }

  if (direction === "bearish") {
    return `${AGENT_NAME} detected ${flow} net outflow from ${observation.targetSymbol} across ${observation.uniqueWallets} wallets, including ${observation.whaleWallets} whale wallets. The agent marks this as bearish with ${confidence} confidence for ${horizon}.`;
  }

  return `${AGENT_NAME} detected mixed flow in ${observation.targetSymbol} with ${flow} net movement. The agent marks this as neutral with ${confidence} confidence for ${horizon}.`;
}

function formatHorizon(minutes: number) {
  if (minutes < 60) return `the next ${minutes} minute${minutes === 1 ? "" : "s"}`;

  const hours = minutes / 60;
  if (Number.isInteger(hours)) return `the next ${hours} hour${hours === 1 ? "" : "s"}`;

  return `the next ${minutes} minutes`;
}
