import { hashJson } from "../hash.js";
import { AlphaSignal } from "../schema.js";
import { OutcomeObservation } from "../resolver.js";

export function buildDemoOutcome(signal: AlphaSignal): OutcomeObservation {
  const outcome = {
    targetSymbol: signal.targetSymbol,
    targetId: signal.targetId as `0x${string}`,
    windowStart: "2026-05-12T10:00:00.000Z",
    windowEnd: "2026-05-12T11:00:00.000Z",
    startPriceUsd: 3025.42,
    endPriceUsd: 3097.18,
    realizedVolumeUsd: 4_875_000
  };

  return {
    ...outcome,
    sourceDataHash: hashJson(outcome)
  };
}
