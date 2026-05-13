# Deployment Runbook

## Mantle Sepolia Contracts

1. Copy `contracts/.env.example` values into your shell or local `.env`.
2. Fund the deployer wallet with Mantle Sepolia test MNT.
3. Deploy:

```bash
npm run deploy:mantle-sepolia --workspace contracts
```

The script writes `deployment-artifacts/mantle-sepolia.json` with the deployed addresses and transaction hashes.

Current deployment:

| Contract | Address | Deployment Tx |
| --- | --- | --- |
| `AgentRegistry` | `0x3517b74800E6A731656D8cc809d77f730da4d1dA` | `0x3ec78b3b1576a4845e52fc18b1ce16d129c11af2d30a1cd147ff538f64a74f55` |
| `ScoreRegistry` | `0x746A932D764d37f10c2f474D170734A05a20e87a` | `0x12419c4f51bbafb3135e2578efb06cd61a8d130a15dcad14796ec0618896e1a3` |
| `SignalRegistry` | `0x0d22DdC5d0Da0E4988b04E0647b4643e7BDfFc79` | `0xba803fb0f9c807c69879ec9d0cec9a870c78f0c4e03db6102b279cbbab6f6b22` |

Verified source:

- `AgentRegistry`: `https://sepolia.mantlescan.xyz/address/0x3517b74800E6A731656D8cc809d77f730da4d1dA#code`
- `ScoreRegistry`: `https://sepolia.mantlescan.xyz/address/0x746A932D764d37f10c2f474D170734A05a20e87a#code`
- `SignalRegistry`: `https://sepolia.mantlescan.xyz/address/0x0d22DdC5d0Da0E4988b04E0647b4643e7BDfFc79#code`

## Seeded Demo Signal

Run this after deployment to register the demo agent and write an AI-generated `commitSignal` proof:

```bash
npm run seed:mantle-sepolia
```

Current seeded proof:

- Agent ID: `1`
- Signal ID: `1`
- `registerAgent` transaction: `0x599584dd950624f27b388fb46bb744b29ba50d3424fba6100b36a93adc3c88ab`
- `commitSignal` transaction: `0xd82437582404025f72d3c92bcb8cf75ccff5c07e804bd8bbbd6955f695b817cc`

## Frontend Environment

Current public frontend: `https://alphaproof-arena.vercel.app`

Copy `apps/web/.env.example` into your hosting environment and fill these values from the deployment artifact:

```bash
NEXT_PUBLIC_CHAIN_ID=5003
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=0x3517b74800E6A731656D8cc809d77f730da4d1dA
NEXT_PUBLIC_SIGNAL_REGISTRY_ADDRESS=0x0d22DdC5d0Da0E4988b04E0647b4643e7BDfFc79
NEXT_PUBLIC_SCORE_REGISTRY_ADDRESS=0x746A932D764d37f10c2f474D170734A05a20e87a
```

## Verification Checklist

- Contract addresses are present in `deployment-artifacts/mantle-sepolia.json`.
- Mantle Explorer verification is complete for `AgentRegistry`, `ScoreRegistry`, and `SignalRegistry`.
- The public frontend shows the deployed `SignalRegistry` address in the top bar.
- `/api/agent-scan` returns a JSON payload with `contract.functionName` equal to `commitSignal`.

Run explorer verification:

```bash
export ETHERSCAN_API_KEY=...
npm run verify:mantle-sepolia --workspace contracts
```
