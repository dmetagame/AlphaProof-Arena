import { hashJson, hashText } from "../hash.js";
import { AlphaSignal, AlphaSignalSchema, MantleObservation } from "../schema.js";

const AGENT_NAME = "Whale Flow Agent";

export function generateWhaleFlowSignal(observation: MantleObservation, now = new Date()): AlphaSignal {
  const whaleConcentration = observation.uniqueWallets === 0
    ? 0
    : observation.whaleWallets / observation.uniqueWallets;
  const flowIntensity = Math.min(Math.abs(observation.netFlowUsd) / 2_000_000, 1);
  const transferIntensity = Math.min(observation.averageTransferUsd / 150_000, 1);

  const rawConfidence = 4500
    + Math.round(flowIntensity * 2600)
    + Math.round(transferIntensity * 1300)
    + Math.round(Math.min(whaleConcentration, 0.5) * 3000);
  const confidenceBps = Math.max(1, Math.min(rawConfidence, 9200));

  const direction = observation.netFlowUsd > 250_000
    ? "bullish"
    : observation.netFlowUsd < -250_000
      ? "bearish"
      : "neutral";

  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000);
  const sourceDataHash = hashJson(observation);
  const thesis = buildThesis(observation, direction, confidenceBps);
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
      windowMinutes: observation.windowMinutes
    }
  });
}

function buildThesis(
  observation: MantleObservation,
  direction: AlphaSignal["direction"],
  confidenceBps: number
): string {
  const flow = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(observation.netFlowUsd);
  const confidence = `${(confidenceBps / 100).toFixed(2)}%`;

  if (direction === "bullish") {
    return `${AGENT_NAME} detected ${flow} net inflow into ${observation.targetSymbol} across ${observation.uniqueWallets} wallets, including ${observation.whaleWallets} whale wallets. The agent marks this as bullish with ${confidence} confidence for the next hour.`;
  }

  if (direction === "bearish") {
    return `${AGENT_NAME} detected ${flow} net outflow from ${observation.targetSymbol} across ${observation.uniqueWallets} wallets, including ${observation.whaleWallets} whale wallets. The agent marks this as bearish with ${confidence} confidence for the next hour.`;
  }

  return `${AGENT_NAME} detected mixed flow in ${observation.targetSymbol} with ${flow} net movement. The agent marks this as neutral with ${confidence} confidence for the next hour.`;
}

