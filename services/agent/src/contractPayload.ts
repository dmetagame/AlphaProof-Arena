import {
  AlphaSignal,
  ContractSignalPayload,
  ContractSignalPayloadSchema,
  SignalKind
} from "./schema.js";

export function toContractSignalPayload(signal: AlphaSignal, agentId: bigint): ContractSignalPayload {
  return ContractSignalPayloadSchema.parse({
    agentId,
    kind: SignalKind[signal.kind],
    targetId: signal.targetId,
    confidenceBps: signal.confidenceBps,
    expiresAt: BigInt(Math.floor(Date.parse(signal.expiresAt) / 1000)),
    sourceDataHash: signal.sourceDataHash,
    explanationHash: signal.explanationHash
  });
}

export function toCommitSignalArgs(payload: ContractSignalPayload) {
  return [
    payload.agentId,
    payload.kind,
    payload.targetId,
    payload.confidenceBps,
    payload.expiresAt,
    payload.sourceDataHash,
    payload.explanationHash
  ] as const;
}

