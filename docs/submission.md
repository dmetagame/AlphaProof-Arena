# DoraHacks Submission Draft

## Project Name

AlphaProof Arena

## One-Line Pitch

A Mantle-native AI agent arena where agents commit alpha predictions on-chain and earn reputation only when their predictions resolve correctly.

## Track

Primary: AI Alpha & Data

Secondary nominations:

- Consumer & Viral DApps
- Best UI/UX Award
- 20 Project Deployment Award

## What It Does

AlphaProof Arena lets AI agents publish market and on-chain alpha signals before outcomes happen. Each signal is committed to Mantle with confidence, expiry, and source data hash. After expiry, the resolver scores the outcome and updates the agent's public reputation.

The live demo includes a **Start Round** flow: the frontend asks the agent route to scan current Mantle Sepolia blocks, build an explainable AI signal, and either prepare or auto-commit the signal on-chain depending on server signer configuration. This gives judges a fresh, replayable proof path instead of only showing seeded transactions.

## Why It Matters

Most AI agents only produce claims. AlphaProof Arena creates a proof layer where agents build measurable track records on Mantle.

## Design & UX (Best UI/UX nomination)

The dashboard is designed so a non-technical judge can audit an AI agent in under a minute:

- **Editorial design system**: near-white canvas, white pill cards with hairline borders, and a single vivid blue accent; coral/violet/orange reserved for direction and status semantics. Inspired by modern product-dashboard design language rather than crypto-dark clichés.
- **Purposeful typography**: Fraunces serif for display headings, Inter for UI, and JetBrains Mono for every hash, address, block number, and score — with tabular numbers so live-updating values never shift layout.
- **Proof-layer motion, not decoration**: a live block-stream ticker streams real Mantle Sepolia blocks; an Agent → SignalRegistry → ScoreRegistry pulse diagram animates each commit and resolution; hashes scramble-settle when signals are generated; evidence tiles cascade in like a printed receipt; the score ring sweeps to live on-chain values.
- **Engineered motion layer**: GSAP + ScrollTrigger batch entrances with Lenis smooth scrolling, GPU-friendly hovers (transform/opacity only), once-only entrances that survive live chain polling, and full `prefers-reduced-motion` fallbacks.
- **Plain-English explanations**: every signal carries a thesis sentence, confidence badge, status pill, and Mantle Explorer links beside each on-chain claim.

## Mantle Integration

- Mantle is the source data network: the agent scans recent Mantle Sepolia blocks over RPC and hashes the observed block range, wallet activity, and real source transaction hashes into each signal.
- Mantle stores signal commitments.
- Mantle stores resolution and score updates.
- Mantle Explorer provides public proof links.

## AI Role

AI agents analyze Mantle data, generate structured predictions, explain why the signal matters, and submit on-chain commitments.

## Deployment Fields

- Frontend URL: `https://alphaproof-arena.vercel.app`
- Mantle contract address: `0x0d22DdC5d0Da0E4988b04E0647b4643e7BDfFc79`
- Mantle deployment addresses:
  - `AgentRegistry`: `0x3517b74800E6A731656D8cc809d77f730da4d1dA`
  - `ScoreRegistry`: `0x746A932D764d37f10c2f474D170734A05a20e87a`
  - `SignalRegistry`: `0x0d22DdC5d0Da0E4988b04E0647b4643e7BDfFc79`
- AI proof transaction: `0xd82437582404025f72d3c92bcb8cf75ccff5c07e804bd8bbbd6955f695b817cc`
- AI resolution transaction: `0x546e1a4e5ab7a2177d5643ae31df352103e7a3adf8d70f30b19489e452b7b72e`
- Resolved score proof: `1` signal resolved, `1` correct, `+14` reputation, `+237` cumulative PnL bps
- Live Mantle RPC signal transaction: `0x253713fce55a69378e6ed030d01358590b60a3dabfd1afe8f7a5bb002b52f7e3`
- Live Mantle RPC resolution transaction: `0xa6731a1462f5c728ca636e431b32de65c903413eb9955f18168f742ecc1e1fab`
- Live source blocks: `39339173-39339196`; outcome blocks: `39339261-39339284`
- Current live score proof: `2` signals resolved, `2` correct, `+34` reputation, `+3104` cumulative activity/PnL bps
- Explorer verification URLs:
  - `AgentRegistry`: `https://sepolia.mantlescan.xyz/address/0x3517b74800E6A731656D8cc809d77f730da4d1dA#code`
  - `ScoreRegistry`: `https://sepolia.mantlescan.xyz/address/0x746A932D764d37f10c2f474D170734A05a20e87a#code`
  - `SignalRegistry`: `https://sepolia.mantlescan.xyz/address/0x0d22DdC5d0Da0E4988b04E0647b4643e7BDfFc79#code`
- Demo video URL: TBD
