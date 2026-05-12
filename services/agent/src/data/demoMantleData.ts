import { MantleObservation, MantleObservationSchema } from "../schema.js";

const demoObservations: MantleObservation[] = [
  {
    chainId: 5003,
    observedAt: "2026-05-12T09:30:00.000Z",
    targetSymbol: "mETH",
    targetAddress: "0x0000000000000000000000000000000000005003",
    windowMinutes: 45,
    netFlowUsd: 1842500,
    uniqueWallets: 38,
    whaleWallets: 7,
    averageTransferUsd: 129400,
    txCount: 62,
    sourceTxs: [
      "0x1111111111111111111111111111111111111111111111111111111111111111",
      "0x2222222222222222222222222222222222222222222222222222222222222222",
      "0x3333333333333333333333333333333333333333333333333333333333333333"
    ]
  },
  {
    chainId: 5003,
    observedAt: "2026-05-12T09:45:00.000Z",
    targetSymbol: "USDY",
    targetAddress: "0x0000000000000000000000000000000000000d0a",
    windowMinutes: 60,
    netFlowUsd: -420000,
    uniqueWallets: 19,
    whaleWallets: 2,
    averageTransferUsd: 38000,
    txCount: 27,
    sourceTxs: [
      "0x4444444444444444444444444444444444444444444444444444444444444444",
      "0x5555555555555555555555555555555555555555555555555555555555555555"
    ]
  }
];

export function loadDemoMantleObservations(): MantleObservation[] {
  return demoObservations.map((observation) => MantleObservationSchema.parse(observation));
}

