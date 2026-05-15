import { MantleObservation, MantleObservationSchema } from "../schema.js";

const demoObservations: MantleObservation[] = [
  {
    chainId: 5003,
    observedAt: "2026-05-15T15:44:01.000Z",
    dataSource: "mantle-sepolia-rpc-native-transfers",
    fromBlock: 38657561,
    toBlock: 38657584,
    targetSymbol: "MNT",
    targetAddress: "0x0000000000000000000000000000000000000000",
    windowMinutes: 1,
    netFlowUsd: 0,
    uniqueWallets: 2,
    whaleWallets: 0,
    averageTransferUsd: 0,
    txCount: 24,
    sourceTxs: [
      "0x8b8dd245f28764a0250fc5f3fbf4adf646d9d7d3d65328d6bdeda8bca46959af",
      "0x95d73490c0d420f03383873e8951e9457c9d7a7d36be3361864964491a3d5bc9",
      "0xa2821c43c90df4626af995feb665704ab432dbff0e70748bb66457d2987771a6"
    ]
  }
];

export function loadDemoMantleObservations(): MantleObservation[] {
  return demoObservations.map((observation) => MantleObservationSchema.parse(observation));
}
