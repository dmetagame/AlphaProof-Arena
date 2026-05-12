# Deployment Runbook

## Mantle Sepolia Contracts

1. Copy `contracts/.env.example` values into your shell or local `.env`.
2. Fund the deployer wallet with Mantle Sepolia test MNT.
3. Deploy:

```bash
npm run deploy:mantle-sepolia --workspace contracts
```

The script writes `deployment-artifacts/mantle-sepolia.json` with the deployed addresses and transaction hashes.

## Frontend Environment

Copy `apps/web/.env.example` into your hosting environment and fill these values from the deployment artifact:

```bash
NEXT_PUBLIC_CHAIN_ID=5003
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=
NEXT_PUBLIC_SIGNAL_REGISTRY_ADDRESS=
NEXT_PUBLIC_SCORE_REGISTRY_ADDRESS=
```

## Verification Checklist

- Contract addresses are present in `deployment-artifacts/mantle-sepolia.json`.
- Mantle Explorer verification is complete for `AgentRegistry`, `ScoreRegistry`, and `SignalRegistry`.
- The public frontend shows the deployed `SignalRegistry` address in the top bar.
- `/api/agent-scan` returns a JSON payload with `contract.functionName` equal to `commitSignal`.
