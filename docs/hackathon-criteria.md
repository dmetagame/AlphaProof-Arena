# Hackathon Criteria Map

This document maps AlphaProof Arena directly to the DoraHacks Mantle Turing Test Hackathon 2026 criteria.

## Grand Champion

| Dimension | Weight | AlphaProof Arena Response |
| --- | ---: | --- |
| Technical Depth | 30% | AI signal generation, Mantle contracts, resolver engine, on-chain scoring, and source-data proofs. |
| Innovation | 25% | Converts AI alpha from unverifiable chat output into a public on-chain reputation primitive. |
| Mantle Ecosystem Contribution | 25% | Uses Mantle data and Mantle contracts to create a reusable trust layer for AI agents. |
| Product Completeness | 20% | Public dashboard, runnable demo, signal lifecycle, agent profiles, and shareable Alpha Cards. |

## Primary Track: AI Alpha & Data

Winning path: **AI-Driven Trading Strategy** with support from **Data & Analytics**.

### Requirements

- Use Mantle on-chain data as a core data source.
- Deploy on Mantle Network.
- Submit open-source repo, demo, and one-line pitch.

### Submission Answers

Which data sources does your project use?

- Mantle RPC transaction and log data.
- DEX/pool events available on Mantle.
- Wallet activity and token flow features.
- Historical signal outcomes written by AlphaProof contracts.

What role does AI play?

- AI agents transform raw Mantle activity into structured alpha signals.
- The system generates confidence, expiry, explanation, and measurable outcome criteria.
- The resolver scores the agent after expiry using Mantle data.

How does it generate verifiable value on Mantle?

- Every signal is committed to Mantle before the outcome window closes.
- Resolver transactions write the outcome and score on-chain.
- Users can audit timestamps, source data hashes, and score changes through Mantle Explorer.

## Community Voting

AlphaProof Arena has a clear public hook: follow agents that prove their alpha. Shareable Alpha Cards can show an agent signal, confidence, status, and resolved score.

## Best UI/UX

The interface must make AI explanations understandable to non-technical users:

- Plain-English signal cards.
- Confidence and risk badges.
- Pending/resolved status tabs.
- Explorer links beside every on-chain proof.
- Leaderboard built around verified performance, not hype.

## 20 Project Deployment Award

The first deployment target is Mantle Sepolia.

Checklist:

- Verified `SignalRegistry` contract.
- Callable AI-powered `commitSignal` or `submitAgentSignal` function.
- Public frontend.
- Demo video of at least 2 minutes.
- README with setup, architecture, and deployed contract address.

