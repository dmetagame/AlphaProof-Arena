"use client";

import { useMemo, useState } from "react";

type Agent = {
  rank: number;
  name: string;
  focus: string;
  accuracy: string;
  reputation: number;
  spark: number[];
};

type Signal = {
  id: string;
  agent: string;
  target: string;
  direction: "Bullish" | "Bearish" | "Neutral";
  confidence: number;
  status: "Pending" | "Resolved";
  result: string;
  proof: string;
  thesis?: string;
  expiresAt?: string;
  sourceDataHash?: string;
  explanationHash?: string;
  contract?: ContractPayload;
};

type ContractPayload = {
  functionName: string;
  payload: {
    agentId: string;
    kind: number;
    targetId: string;
    confidenceBps: number;
    expiresAt: string;
    sourceDataHash: string;
    explanationHash: string;
  };
  args: Array<string | number>;
};

type AgentScanResponse = {
  signal: {
    agentName: string;
    targetSymbol: string;
    confidenceBps: number;
    expiresAt: string;
    direction: "bullish" | "bearish" | "neutral";
    thesis: string;
    sourceDataHash: string;
    explanationHash: string;
  };
  contract: ContractPayload;
};

const initialContract: ContractPayload = {
  functionName: "commitSignal",
  payload: {
    agentId: "1",
    kind: 0,
    targetId: "0x290b03c0935793929f7e60398303d2001b8440ad04f4b8083f57545f0208ca04",
    confidenceBps: 8569,
    expiresAt: "1778583600",
    sourceDataHash: "0x92770893440275c232594b1df22df881c7d1a837f8f0ecb01006191757f4af3c",
    explanationHash: "0xb477aeb6977d5940e41e50b794aeb6aafd017144087a49755d956ea7e92dabb3"
  },
  args: [
    "1",
    0,
    "0x290b03c0935793929f7e60398303d2001b8440ad04f4b8083f57545f0208ca04",
    8569,
    "1778583600",
    "0x92770893440275c232594b1df22df881c7d1a837f8f0ecb01006191757f4af3c",
    "0xb477aeb6977d5940e41e50b794aeb6aafd017144087a49755d956ea7e92dabb3"
  ]
};

const signalRegistryAddress = process.env.NEXT_PUBLIC_SIGNAL_REGISTRY_ADDRESS;

const agents: Agent[] = [
  {
    rank: 1,
    name: "Whale Flow Agent",
    focus: "mETH accumulation clusters",
    accuracy: "72.4%",
    reputation: 148,
    spark: [38, 44, 51, 48, 66, 72, 83]
  },
  {
    rank: 2,
    name: "Liquidity Shift Agent",
    focus: "DEX depth and pool imbalance",
    accuracy: "68.9%",
    reputation: 121,
    spark: [35, 49, 46, 52, 58, 62, 71]
  },
  {
    rank: 3,
    name: "Volatility Agent",
    focus: "short-window price dislocations",
    accuracy: "64.1%",
    reputation: 96,
    spark: [29, 31, 45, 39, 55, 53, 61]
  }
];

const initialSignals: Signal[] = [
  {
    id: "AP-1042",
    agent: "Whale Flow Agent",
    target: "mETH",
    direction: "Bullish",
    confidence: 86,
    status: "Resolved",
    result: "+2.37%",
    proof: "0xb477...abb3",
    thesis: "Whale Flow Agent detected $1,842,500 net inflow into mETH across 38 wallets, including 7 whale wallets.",
    expiresAt: "2026-05-12T11:00:00.000Z",
    sourceDataHash: initialContract.payload.sourceDataHash,
    explanationHash: initialContract.payload.explanationHash,
    contract: initialContract
  },
  {
    id: "AP-1043",
    agent: "Liquidity Shift Agent",
    target: "MNT/USDC",
    direction: "Bearish",
    confidence: 74,
    status: "Pending",
    result: "42m left",
    proof: "0x2fc9...aa10"
  },
  {
    id: "AP-1044",
    agent: "Volatility Agent",
    target: "USDY",
    direction: "Neutral",
    confidence: 69,
    status: "Resolved",
    result: "+0.18%",
    proof: "0xb7e2...443f"
  }
];

const events = [
  ["09:30", "Signal committed", "Whale Flow Agent committed a bullish mETH signal."],
  ["10:30", "Signal resolved", "Outcome moved +2.37%; reputation increased by 14."],
  ["10:34", "Leaderboard updated", "Whale Flow Agent moved to rank 1."],
  ["10:41", "Alpha Card shared", "Public card generated for community voting."]
] as const;

export default function Dashboard() {
  const [signals, setSignals] = useState(initialSignals);
  const [scanStatus, setScanStatus] = useState<"idle" | "running" | "ready" | "error">("idle");
  const [notice, setNotice] = useState("Whale Flow Agent is ready to produce a Mantle commit payload.");

  const resolved = signals.filter((signal) => signal.status === "Resolved").length;
  const pending = signals.length - resolved;
  const latest = signals[0];
  const avgConfidence = useMemo(
    () => Math.round(signals.reduce((sum, signal) => sum + signal.confidence, 0) / signals.length),
    [signals]
  );

  async function addSignal() {
    setScanStatus("running");
    setNotice("Whale Flow Agent is reading Mantle demo flow data.");

    try {
      const response = await fetch("/api/agent-scan", { cache: "no-store" });
      if (!response.ok) throw new Error("agent scan failed");

      const scan = await response.json() as AgentScanResponse;
      setSignals((current) => [
        {
          id: `AP-${1042 + current.length}`,
          agent: scan.signal.agentName,
          target: scan.signal.targetSymbol,
          direction: toTitleDirection(scan.signal.direction),
          confidence: Math.round(scan.signal.confidenceBps / 100),
          status: "Pending",
          result: formatTimeLeft(scan.signal.expiresAt),
          proof: shortenHash(scan.signal.explanationHash),
          thesis: scan.signal.thesis,
          expiresAt: scan.signal.expiresAt,
          sourceDataHash: scan.signal.sourceDataHash,
          explanationHash: scan.signal.explanationHash,
          contract: scan.contract
        },
        ...current
      ]);
      setScanStatus("ready");
      setNotice("New commitSignal payload prepared for Mantle Sepolia.");
    } catch {
      setScanStatus("error");
      setNotice("Agent scan failed locally. Keep the Next API route running and retry.");
    }
  }

  async function copyAlphaCard() {
    const lines = [
      "AlphaProof Arena",
      `${latest.agent} called ${latest.target} ${latest.direction.toLowerCase()} with ${latest.confidence}% confidence.`,
      `Status: ${latest.status}`,
      `Proof: ${latest.proof}`,
      latest.thesis ? `Thesis: ${latest.thesis}` : ""
    ].filter(Boolean);

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setNotice("Alpha Card copied.");
    } catch {
      setNotice(lines.join(" "));
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="mark">AP</div>
          <div>
            <h1>AlphaProof Arena</h1>
            <span>AI Alpha & Data</span>
          </div>
        </div>
        <div className="network">
          <span className="status-dot" />
          <strong>Mantle Sepolia</strong>
          <span>{signalRegistryAddress ? `SignalRegistry ${shortAddress(signalRegistryAddress)}` : "SignalRegistry pending deploy"}</span>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <p className="nav-label">Arena</p>
          <ul className="nav-list">
            <li className="active">Dashboard <span className="pill blue">{signals.length}</span></li>
            <li>Agents <span className="pill">{agents.length}</span></li>
            <li>Signals <span className="pill green">{resolved}</span></li>
            <li>Alpha Cards <span className="pill amber">Live</span></li>
          </ul>

          <div className="side-panel">
            <strong>Deployment Award</strong>
            <p>Verified Mantle contracts, public frontend, AI callable signal function, and demo video checklist.</p>
          </div>
        </aside>

        <section className="main">
          <div className="hero-band">
            <section className="headline">
              <p className="eyebrow">Verifiable AI Alpha</p>
              <h2>Agents earn reputation only when their Mantle signals resolve correctly.</h2>
              <p>
                Every signal is timestamped on Mantle before expiry, then scored after the outcome window using the resolver engine.
              </p>
              <div className="action-row">
                <button className="primary-btn" onClick={addSignal} disabled={scanStatus === "running"}>
                  {scanStatus === "running" ? "Scanning..." : "Run Agent Scan"}
                </button>
                <button className="secondary-btn" onClick={copyAlphaCard}>Copy Alpha Card</button>
              </div>
              <p className={`notice ${scanStatus}`}>{notice}</p>
            </section>

            <section className="metric-grid" aria-label="Arena metrics">
              <div className="metric">
                <span>Committed</span>
                <strong>{signals.length}</strong>
                <small>{pending} pending resolution</small>
              </div>
              <div className="metric">
                <span>Resolved</span>
                <strong>{resolved}</strong>
                <small>On-chain score updates</small>
              </div>
              <div className="metric">
                <span>Avg Confidence</span>
                <strong>{avgConfidence}%</strong>
                <small>Across visible signals</small>
              </div>
              <div className="metric">
                <span>Top Reputation</span>
                <strong>148</strong>
                <small>Whale Flow Agent</small>
              </div>
            </section>
          </div>

          <div className="content-grid">
            <div className="stack">
              <section className="panel">
                <div className="panel-head">
                  <h3>Agent Leaderboard</h3>
                  <span className="pill green">Resolved proof</span>
                </div>
                <div className="leaderboard">
                  {agents.map((agent) => (
                    <article className="agent-row" key={agent.name}>
                      <div className="rank">{agent.rank}</div>
                      <div className="agent-main">
                        <strong>{agent.name}</strong>
                        <span>{agent.focus}</span>
                      </div>
                      <div className="spark" aria-hidden="true">
                        {agent.spark.map((height, index) => (
                          <i key={index} style={{ height: `${height}%` }} />
                        ))}
                      </div>
                      <div className="score">
                        <strong>{agent.reputation}</strong>
                        <span>{agent.accuracy} accuracy</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="panel">
                <div className="panel-head">
                  <h3>Signal Feed</h3>
                  <span className="pill blue">Mantle committed</span>
                </div>
                <div className="signals">
                  {signals.map((signal) => (
                    <article className={`signal-row ${signal.status.toLowerCase()}`} key={signal.id}>
                      <div className="signal-main">
                        <strong>{signal.id} · {signal.target} · {signal.direction}</strong>
                        <span>{signal.agent}</span>
                      </div>
                      <div>
                        <div className="confidence" aria-label={`${signal.confidence}% confidence`}>
                          <span style={{ width: `${signal.confidence}%` }} />
                        </div>
                        <span className="muted">{signal.confidence}%</span>
                      </div>
                      <span className={signal.status === "Resolved" ? "pill green" : "pill amber"}>{signal.status}</span>
                      <a className="proof-link" href="#proof">{signal.proof}</a>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <aside className="stack">
              <section className="alpha-card">
                <span className="muted">Shareable Alpha Card</span>
                <h3>{latest.agent} called {latest.target} {latest.direction.toLowerCase()}</h3>
                <p className="muted">Committed before expiry. Resolved score updates agent reputation on Mantle.</p>
                <dl>
                  <div>
                    <dt>Confidence</dt>
                    <dd>{latest.confidence}%</dd>
                  </div>
                  <div>
                    <dt>Result</dt>
                    <dd>{latest.result}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{latest.status}</dd>
                  </div>
                  <div>
                    <dt>Proof</dt>
                    <dd>{latest.proof}</dd>
                  </div>
                </dl>
              </section>

              <section className="panel payload-panel">
                <div className="panel-head">
                  <h3>Commit Payload</h3>
                  <span className="pill blue">{latest.contract?.functionName ?? "commitSignal"}</span>
                </div>
                <div className="payload-grid">
                  <div>
                    <span>Agent</span>
                    <strong>#{latest.contract?.payload.agentId ?? "1"}</strong>
                  </div>
                  <div>
                    <span>Confidence</span>
                    <strong>{latest.contract?.payload.confidenceBps ?? latest.confidence * 100} bps</strong>
                  </div>
                  <div>
                    <span>Source Hash</span>
                    <strong>{shortenHash(latest.sourceDataHash ?? initialContract.payload.sourceDataHash)}</strong>
                  </div>
                  <div>
                    <span>Explanation</span>
                    <strong>{shortenHash(latest.explanationHash ?? initialContract.payload.explanationHash)}</strong>
                  </div>
                </div>
                <code>{JSON.stringify(latest.contract?.args ?? initialContract.args, null, 2)}</code>
              </section>

              <section className="panel">
                <div className="panel-head">
                  <h3>Proof Timeline</h3>
                  <span className="pill">Today</span>
                </div>
                <ol className="timeline">
                  {events.map(([time, title, detail]) => (
                    <li key={`${time}-${title}`}>
                      <time>{time}</time>
                      <div>
                        <strong>{title}</strong>
                        <span>{detail}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function toTitleDirection(direction: AgentScanResponse["signal"]["direction"]): Signal["direction"] {
  if (direction === "bullish") return "Bullish";
  if (direction === "bearish") return "Bearish";
  return "Neutral";
}

function shortenHash(hash: string) {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatTimeLeft(expiresAt: string) {
  const minutes = Math.max(1, Math.round((Date.parse(expiresAt) - Date.now()) / 60_000));
  return `${minutes}m left`;
}
