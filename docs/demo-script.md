# Demo Script

Target length: 2-3 minutes.

## Opening (0:00–0:15)

AI alpha is easy to claim and hard to trust. AlphaProof Arena makes agents prove their calls on Mantle.

Open `https://alphaproof-arena.vercel.app`. Call out the design language as the page loads: a clean near-white canvas, white pill cards, and a single vivid blue accent — built so a non-technical judge can read every number. The hero headline is set in Fraunces serif; every stat, hash, and block number renders in JetBrains Mono with tabular figures so live values never shift layout.

## Live chain, before any clicks (0:15–0:35)

1. Point at the **block-stream ticker** under the hero: it streams the eight most recent Mantle Sepolia blocks over RPC, refreshed every 12 seconds. Hover to pause it; click any entry to open that block's transaction on Mantle Explorer.
2. Point at the **architecture pulse diagram** (Agent → SignalRegistry → ScoreRegistry). This is the whole product in one line: agents commit, the resolver scores.
3. Show the top bar chain chip: the live `SignalRegistry` address is one click from its verified source on Mantle Explorer.

## Start a live proof round (0:35–1:15)

4. Click **Start Round**. Narrate what is happening: the agent reads recent Mantle Sepolia blocks over RPC, builds an explainable signal, and produces a contract-ready `commitSignal` payload.
5. Watch the motion confirm the story: a blue pulse travels Agent → SignalRegistry on the diagram, the new card drops into the **Live proof queue** with a pop-in status badge, and the dossier flips to the **Payload** tab showing the exact on-chain arguments — agent ID, confidence in bps, expiry, and the source-data and explanation hashes (watch them scramble-settle in mono).
6. If autocommit is enabled, open the committed transaction on Mantle Explorer. If the demo runs in prepared mode, call out that no signer is exposed to the frontend — the payload is ready for the registry.

## Inspect a resolved proof (1:15–2:00)

7. Click **Inspect** on a resolved signal (Signal #2 MNT). The **Evidence** tab cascades in like a receipt: data source, observed time, source block range, transaction counts, wallet activity, and score impact — each tile a verifiable claim.
8. Click the **Commit** and **Resolve** pills to show both transactions on Mantle Explorer. This is the trust loop: committed before the outcome, scored after expiry, all public.
9. Show the **Reputation table**: the agent's reputation and accuracy come straight from `ScoreRegistry` reads — the score ring sweeps to the live on-chain value.

## Share and close (2:00–2:30)

10. Click **Copy Card** — the Alpha Card copies with direction, confidence, outcome, thesis, and the Mantle Explorer proof link, ready to paste anywhere.
11. Close: AlphaProof Arena turns Mantle into the public scoreboard for AI agents. The product is not asking users to trust an agent. It lets agents earn trust with on-chain results.

## Recording notes

- Use a 1600px-wide viewport; the dashboard is fully responsive but the two-column dossier layout reads best on desktop.
- The entrance animations fire once per scroll position — record in one continuous pass from the top.
- `prefers-reduced-motion` users get instant static rendering; mention accessibility if there is time.
