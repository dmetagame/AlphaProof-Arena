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

