# AlphaProof Agent Service

The agent service turns Mantle on-chain observations into structured alpha signals that can be committed to `SignalRegistry`.

The current signal path is live by default:

- reads recent Mantle Sepolia blocks over RPC
- extracts real transaction hashes, wallet counts, block range, and activity features
- generates a Whale Flow signal from the live Mantle observation
- validates the signal schema
- emits contract-ready arguments for `SignalRegistry.commitSignal`

The deterministic sample observations remain as an explicit fallback for offline local development.

## Commands

```bash
npm run build --workspace services/agent
npm test --workspace services/agent
npm run generate --workspace services/agent
npm run resolve-demo --workspace services/agent
```

## Next Integrations

- DEX pool event adapter
- LLM explanation generator
- transaction submitter for `SignalRegistry`
