import { AlphaSignal } from "./schema.js";

export type OutcomeObservation = {
  targetSymbol: string;
  targetId: `0x${string}`;
  windowStart: string;
  windowEnd: string;
  startPriceUsd: number;
  endPriceUsd: number;
  realizedVolumeUsd: number;
  sourceDataHash: `0x${string}`;
};

export type ResolutionResult = {
  correct: boolean;
  pnlBps: number;
  reputationDelta: number;
  reason: string;
};

export type ContractResolutionPayload = {
  signalId: bigint;
  correct: boolean;
  pnlBps: bigint;
  reputationDelta: bigint;
};

export type ActivityOutcomeObservation = {
  targetSymbol: string;
  targetId: `0x${string}`;
  windowStart: string;
  windowEnd: string;
  baselineTxCount: number;
  outcomeTxCount: number;
  baselineUniqueWallets: number;
  outcomeUniqueWallets: number;
  activityThreshold: number;
  sourceDataHash: `0x${string}`;
};

export function resolveSignalOutcome(signal: AlphaSignal, outcome: OutcomeObservation): ResolutionResult {
  if (signal.targetId.toLowerCase() !== outcome.targetId.toLowerCase()) {
    throw new Error("outcome target does not match signal target");
  }
  if (outcome.startPriceUsd <= 0 || outcome.endPriceUsd <= 0) {
    throw new Error("outcome prices must be positive");
  }

  const pnlBps = Math.round(((outcome.endPriceUsd - outcome.startPriceUsd) / outcome.startPriceUsd) * 10000);
  const correct = isDirectionCorrect(signal.direction, pnlBps);
  const confidenceMultiplier = signal.confidenceBps / 10000;
  const magnitude = Math.min(Math.abs(pnlBps), 500);
  const baseDelta = correct ? 10 : -8;
  const reputationDelta = Math.round(baseDelta + (correct ? 1 : -1) * magnitude * confidenceMultiplier / 50);

  return {
    correct,
    pnlBps,
    reputationDelta,
    reason: buildResolutionReason(signal, outcome, pnlBps, correct, reputationDelta)
  };
}

export function resolveActivitySignalOutcome(
  signal: AlphaSignal,
  outcome: ActivityOutcomeObservation
): ResolutionResult {
  if (signal.targetId.toLowerCase() !== outcome.targetId.toLowerCase()) {
    throw new Error("outcome target does not match signal target");
  }
  if (outcome.baselineTxCount <= 0 || outcome.activityThreshold <= 0) {
    throw new Error("activity baseline and threshold must be positive");
  }
  if (outcome.outcomeTxCount < 0 || outcome.outcomeUniqueWallets < 0) {
    throw new Error("activity outcome cannot be negative");
  }

  const txActivityBps = Math.round(((outcome.outcomeTxCount - outcome.activityThreshold) / outcome.activityThreshold) * 10000);
  const walletActivityBps = outcome.baselineUniqueWallets === 0
    ? 0
    : Math.round(((outcome.outcomeUniqueWallets - outcome.baselineUniqueWallets) / outcome.baselineUniqueWallets) * 10000);
  const pnlBps = Math.round(txActivityBps * 0.8 + walletActivityBps * 0.2);
  const correct = isDirectionCorrect(signal.direction, pnlBps);
  const magnitude = Math.min(Math.abs(pnlBps), 750);
  const confidenceMultiplier = signal.confidenceBps / 10000;
  const baseDelta = correct ? 12 : -9;
  const reputationDelta = Math.round(baseDelta + (correct ? 1 : -1) * magnitude * confidenceMultiplier / 75);

  return {
    correct,
    pnlBps,
    reputationDelta,
    reason: buildActivityResolutionReason(signal, outcome, pnlBps, correct, reputationDelta)
  };
}

export function toContractResolutionPayload(
  signalId: bigint,
  resolution: ResolutionResult
): ContractResolutionPayload {
  return {
    signalId,
    correct: resolution.correct,
    pnlBps: BigInt(resolution.pnlBps),
    reputationDelta: BigInt(resolution.reputationDelta)
  };
}

function buildActivityResolutionReason(
  signal: AlphaSignal,
  outcome: ActivityOutcomeObservation,
  pnlBps: number,
  correct: boolean,
  reputationDelta: number
): string {
  const move = `${(pnlBps / 100).toFixed(2)}%`;
  const verdict = correct ? "matched" : "missed";
  return `${signal.agentName} ${verdict} its ${signal.direction} ${signal.targetSymbol} activity signal. The outcome window produced ${outcome.outcomeTxCount} transactions across ${outcome.outcomeUniqueWallets} wallets versus a ${outcome.activityThreshold}-transaction active-network threshold, producing a ${move} activity score and a ${reputationDelta >= 0 ? "+" : ""}${reputationDelta} reputation update.`;
}

export function toResolveSignalArgs(payload: ContractResolutionPayload) {
  return [
    payload.signalId,
    payload.correct,
    payload.pnlBps,
    payload.reputationDelta
  ] as const;
}

function isDirectionCorrect(direction: AlphaSignal["direction"], pnlBps: number): boolean {
  if (direction === "bullish") return pnlBps > 0;
  if (direction === "bearish") return pnlBps < 0;
  return Math.abs(pnlBps) <= 30;
}

function buildResolutionReason(
  signal: AlphaSignal,
  outcome: OutcomeObservation,
  pnlBps: number,
  correct: boolean,
  reputationDelta: number
): string {
  const move = `${(pnlBps / 100).toFixed(2)}%`;
  const verdict = correct ? "matched" : "missed";
  return `${signal.agentName} ${verdict} its ${signal.direction} ${signal.targetSymbol} signal. ${outcome.targetSymbol} moved ${move} during the outcome window, producing a ${reputationDelta >= 0 ? "+" : ""}${reputationDelta} reputation update.`;
}
