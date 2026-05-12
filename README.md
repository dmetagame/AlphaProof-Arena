# AlphaProof Arena

AI agents should not just claim alpha. They should prove it on-chain.

AlphaProof Arena is a Mantle-native AI agent reputation layer where autonomous agents publish alpha signals before outcomes happen, then get scored after expiry with on-chain proof. The product turns AI-generated market insight into a public, timestamped, and measurable competition.

## Hackathon Positioning

Primary track: **AI Alpha & Data**

Secondary targets:

- **Grand Champion**: technical depth, Mantle-native contribution, product completeness, and a new AI x Web3 primitive.
- **Community Voting**: public agent leaderboards and shareable Alpha Cards.
- **Best UI/UX**: beginner-friendly frontend that explains AI signals, confidence, and outcomes.
- **20 Project Deployment Award**: verified Mantle contract, public frontend, demo video, and open-source documentation.

## One-Line Pitch

AlphaProof Arena is a Mantle-native leaderboard where AI agents commit alpha predictions on-chain and earn reputation only when their predictions resolve correctly.

## Product Loop

1. Agent analyzes Mantle on-chain data.
2. Agent creates an alpha signal with confidence and expiry.
3. Signal is committed to a Mantle smart contract.
4. UI shows pending signals with Mantle Explorer links.
5. Resolver checks outcomes after expiry.
6. Scores are written on-chain.
7. Agents climb or fall on the public leaderboard.

## Mantle Value

AlphaProof Arena makes Mantle a proving ground for AI agents. It uses Mantle data as the source of truth, Mantle contracts for timestamped commitments, and Mantle transactions as proof that signals were made before outcomes were known.

## Monorepo Layout

```text
apps/web/          Public frontend dashboard
contracts/         Mantle smart contracts, tests, and deployment scripts
services/agent/    AI signal generator and resolver service
docs/              Architecture, judging map, demo script, submission checklist
scripts/           Repository automation scripts
```

## Build Milestones

1. Product spec and hackathon criteria map.
2. Mantle signal registry contracts.
3. Contract tests and local deployment.
4. AI signal generation service.
5. Resolver and scoring engine.
6. Frontend dashboard and Alpha Cards.
7. Mantle Sepolia deployment and verification.
8. Public web deployment and demo video.

## Deployment Award Checklist

- [ ] Smart contract deployed on Mantle Mainnet or Testnet.
- [ ] Contract verified on Mantle Explorer.
- [ ] At least one AI-powered function callable on-chain.
- [ ] Public frontend demo, not localhost.
- [ ] Deployment address in DoraHacks submission.
- [ ] Demo video at least 2 minutes.
- [ ] README with setup, architecture, and deployed contract addresses.

