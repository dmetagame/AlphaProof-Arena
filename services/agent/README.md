# AlphaProof Agent Service

The agent service turns Mantle on-chain observations into structured alpha signals that can be committed to `SignalRegistry`.

The first milestone is deterministic and demo-friendly:

- loads sample Mantle wallet-flow observations
- generates a Whale Flow signal
- validates the signal schema
- emits contract-ready arguments for `SignalRegistry.commitSignal`

This lets the demo show the full product loop before live data indexing is added.

## Commands

```bash
npm run build --workspace services/agent
npm test --workspace services/agent
npm run generate --workspace services/agent
npm run resolve-demo --workspace services/agent
```

## Next Integrations

- Mantle RPC log reader
- DEX pool event adapter
- LLM explanation generator
- transaction submitter for `SignalRegistry`
