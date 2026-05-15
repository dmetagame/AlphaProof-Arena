import { z } from "zod";

export const SignalKind = {
  WhaleFlow: 0,
  LiquidityShift: 1,
  Volatility: 2,
  Sentiment: 3,
  Yield: 4
} as const;

export type SignalKindName = keyof typeof SignalKind;

export const MantleObservationSchema = z.object({
  chainId: z.literal(5003),
  observedAt: z.string().datetime(),
  dataSource: z.string().min(1).optional(),
  fromBlock: z.number().int().nonnegative().optional(),
  toBlock: z.number().int().nonnegative().optional(),
  targetSymbol: z.string().min(1),
  targetAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  windowMinutes: z.number().int().positive(),
  netFlowUsd: z.number(),
  uniqueWallets: z.number().int().nonnegative(),
  whaleWallets: z.number().int().nonnegative(),
  averageTransferUsd: z.number().nonnegative(),
  txCount: z.number().int().nonnegative(),
  sourceTxs: z.array(z.string().regex(/^0x[a-fA-F0-9]{64}$/)).min(1)
});

export type MantleObservation = z.infer<typeof MantleObservationSchema>;

export const AlphaSignalSchema = z.object({
  agentName: z.string().min(1),
  kind: z.enum(["WhaleFlow", "LiquidityShift", "Volatility", "Sentiment", "Yield"]),
  targetId: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  targetSymbol: z.string().min(1),
  confidenceBps: z.number().int().min(1).max(10000),
  expiresAt: z.string().datetime(),
  direction: z.enum(["bullish", "bearish", "neutral"]),
  thesis: z.string().min(1),
  sourceDataHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  explanationHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  sourceTxs: z.array(z.string().regex(/^0x[a-fA-F0-9]{64}$/)).min(1),
  features: z.record(z.union([z.string(), z.number(), z.boolean()]))
});

export type AlphaSignal = z.infer<typeof AlphaSignalSchema>;

export const ContractSignalPayloadSchema = z.object({
  agentId: z.bigint().positive(),
  kind: z.number().int().min(0).max(4),
  targetId: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  confidenceBps: z.number().int().min(1).max(10000),
  expiresAt: z.bigint().positive(),
  sourceDataHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  explanationHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/)
});

export type ContractSignalPayload = z.infer<typeof ContractSignalPayloadSchema>;
