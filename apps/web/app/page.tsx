"use client";

import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Copy,
  DatabaseZap,
  ExternalLink,
  FileCode2,
  GitCommitHorizontal,
  Layers3,
  Play,
  Radio,
  Radar,
  ScanLine,
  ShieldCheck,
  Timer,
  Trophy
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatedNumber } from "@/components/animated-number";
import { useMotion } from "@/components/motion-provider";
import { useArenaMotion } from "@/lib/animation/use-arena-motion";
import { useCardTilt } from "@/lib/animation/use-card-tilt";
import { useMagneticButton } from "@/lib/animation/use-magnetic-button";
import { useParallax } from "@/lib/animation/use-parallax";
import { useRevealAnimation } from "@/lib/animation/use-reveal-animation";

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
  status: "Prepared" | "Pending" | "Resolved";
  result: string;
  proof: string;
  proofUrl?: string;
  thesis?: string;
  expiresAt?: string;
  sourceDataHash?: string;
  explanationHash?: string;
  commitTx?: string;
  resolveTx?: string;
  evidence?: SignalEvidence;
  contract?: ContractPayload;
};

type SignalEvidence = {
  dataSource: string;
  observedAt?: string;
  sourceBlockRange?: string;
  outcomeBlockRange?: string;
  sourceTxCount?: number;
  outcomeTxCount?: number;
  uniqueWallets?: number;
  outcomeWallets?: number;
  whaleWallets?: number;
  netFlowUsd?: number;
  averageTransferUsd?: number;
  scoreDelta?: string;
  sourceTxs?: string[];
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
  args: Array<string | number | boolean>;
};

type AgentScanResponse = {
  dataSourceMode?: "live-mantle-rpc" | "demo-fallback";
  signal: {
    agentName: string;
    targetSymbol: string;
    confidenceBps: number;
    expiresAt: string;
    direction: "bullish" | "bearish" | "neutral";
    thesis: string;
    sourceDataHash: string;
    explanationHash: string;
    sourceTxs: string[];
    features: Record<string, string | number | boolean>;
  };
  observation: {
    observedAt: string;
    dataSource?: string;
    fromBlock?: number;
    toBlock?: number;
    windowMinutes: number;
    netFlowUsd: number;
    uniqueWallets: number;
    whaleWallets: number;
    averageTransferUsd: number;
    txCount: number;
    sourceTxs: string[];
  };
  contract: ContractPayload;
};

type ChainStateResponse = {
  chainId: number;
  observedAt: string;
  contracts: {
    agentRegistry: string;
    scoreRegistry: string;
    signalRegistry: string;
  };
  nextAgentId: string;
  nextSignalId: string;
  agent: {
    owner: string;
    name: string;
    metadataURI: string;
    active: boolean;
    createdAt: string;
  };
  score: {
    resolvedSignals: string;
    correctSignals: string;
    reputation: string;
    cumulativePnLBps: string;
    updatedAt: string;
  };
  signals: Array<{
    id: string;
    agentId: string;
    kind: number;
    targetId: string;
    targetSymbol: string;
    direction: "bullish" | "bearish" | "neutral";
    confidenceBps: number;
    createdAt: string;
    expiresAt: string;
    sourceDataHash: string;
    explanationHash: string;
    resolved: boolean;
    correct: boolean;
    pnlBps: string;
    thesis?: string;
    commitTx?: string;
    resolveTx?: string;
    evidence?: SignalEvidence;
  }>;
};

type DossierTab = "evidence" | "payload" | "timeline";

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

const signalRegistryAddress = process.env.NEXT_PUBLIC_SIGNAL_REGISTRY_ADDRESS
  || "0x0d22DdC5d0Da0E4988b04E0647b4643e7BDfFc79";
const explorerBaseUrl = "https://sepolia.mantlescan.xyz";
const seededCommitTx = "0xd82437582404025f72d3c92bcb8cf75ccff5c07e804bd8bbbd6955f695b817cc";

const agents: Agent[] = [
  {
    rank: 1,
    name: "Whale Flow Agent",
    focus: "MNT and mETH activity windows",
    accuracy: "0.0%",
    reputation: 0,
    spark: [38, 44, 51, 48, 66, 72, 83]
  }
];

const initialSignals: Signal[] = [
  {
    id: "Signal #1",
    agent: "Whale Flow Agent",
    target: "mETH",
    direction: "Bullish",
    confidence: 86,
    status: "Pending",
    result: "Reading chain",
    proof: shortenHash(seededCommitTx),
    proofUrl: `${explorerBaseUrl}/tx/${seededCommitTx}`,
    thesis: "Whale Flow Agent detected $1,842,500 net inflow into mETH across 38 wallets, including 7 whale wallets.",
    expiresAt: "2026-05-13T20:33:07.000Z",
    sourceDataHash: initialContract.payload.sourceDataHash,
    explanationHash: initialContract.payload.explanationHash,
    commitTx: seededCommitTx,
    evidence: {
      dataSource: "Mantle mETH whale-flow fixture",
      sourceTxCount: 38,
      uniqueWallets: 38,
      whaleWallets: 7,
      netFlowUsd: 1_842_500,
      scoreDelta: "+14 reputation / +237 bps"
    },
    contract: initialContract
  }
];

const events = [
  ["09:30", "Commit", "Bullish mETH signal written to Mantle."],
  ["10:30", "Resolve", "Outcome moved +2.37%; reputation increased by 14."],
  ["10:34", "Score", "Whale Flow Agent moved to rank 1."],
  ["10:41", "Share", "Alpha Card generated for public voting."]
] as const;

const proofParticles = Array.from({ length: 18 }, (_, index) => index + 1);

export default function Dashboard() {
  const motionScopeRef = useRef<HTMLElement | null>(null);
  const { scrollTo } = useMotion();
  const [preparedSignals, setPreparedSignals] = useState<Signal[]>([]);
  const [chainState, setChainState] = useState<ChainStateResponse | null>(null);
  const [chainStatus, setChainStatus] = useState<"loading" | "ready" | "error">("loading");
  const [scanStatus, setScanStatus] = useState<"idle" | "running" | "ready" | "error">("idle");
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const [dossierTab, setDossierTab] = useState<DossierTab>("evidence");
  const [activeSection, setActiveSection] = useState("command");
  const [notice, setNotice] = useState("Whale Flow Agent is ready to produce a Mantle commit payload.");

  useEffect(() => {
    let active = true;

    async function loadChainState() {
      try {
        const response = await fetch("/api/chain-state", { cache: "no-store" });
        if (!response.ok) throw new Error("chain state failed");
        const state = await response.json() as ChainStateResponse;
        if (!active) return;
        setChainState(state);
        setChainStatus("ready");
      } catch {
        if (!active) return;
        setChainStatus("error");
      }
    }

    loadChainState();
    return () => {
      active = false;
    };
  }, []);

  const chainSignals = useMemo(
    () => chainState?.signals.map(toDashboardSignal).reverse() ?? initialSignals,
    [chainState]
  );
  const displaySignals = useMemo(
    () => [...preparedSignals, ...chainSignals],
    [preparedSignals, chainSignals]
  );
  const displayAgents = useMemo(
    () => agents.map((agent) => {
      if (agent.name !== "Whale Flow Agent" || !chainState) return agent;

      return {
        ...agent,
        accuracy: formatAccuracy(chainState.score),
        reputation: Number(chainState.score.reputation)
      };
    }),
    [chainState]
  );

  const committed = chainState ? Math.max(0, Number(chainState.nextSignalId) - 1) : chainSignals.length;
  const resolved = chainState
    ? Number(chainState.score.resolvedSignals)
    : chainSignals.filter((signal) => signal.status === "Resolved").length;
  const pending = chainSignals.filter((signal) => signal.status === "Pending").length;
  const latest = displaySignals[0];
  const selectedSignal = displaySignals.find((signal) => signal.id === selectedSignalId) ?? latest ?? initialSignals[0];
  const avgConfidence = useMemo(
    () => Math.round(displaySignals.reduce((sum, signal) => sum + signal.confidence, 0) / displaySignals.length),
    [displaySignals]
  );
  const topReputation = chainState ? Number(chainState.score.reputation) : agents[0].reputation;
  const accuracy = chainState ? formatAccuracy(chainState.score) : displayAgents[0].accuracy;
  const cumulativeBps = chainState ? Number(chainState.score.cumulativePnLBps) : 0;
  const proofLinks = getProofLinks(selectedSignal);
  const heroWords = displayAgents[0].name.split(" ");
  const networkDetail = chainStatus === "ready"
    ? `SignalRegistry ${shortAddress(chainState?.contracts.signalRegistry ?? signalRegistryAddress)}`
    : chainStatus === "loading"
      ? "Reading live chain state"
      : "Live RPC unavailable";

  useRevealAnimation(motionScopeRef, { refreshKey: displaySignals.length });
  useParallax(motionScopeRef, displaySignals.length);
  useMagneticButton(motionScopeRef);
  useCardTilt(motionScopeRef);
  useArenaMotion(motionScopeRef, {
    activeSection,
    dossierTab,
    onActiveSectionChange: setActiveSection,
    scanStatus,
    signalCount: displaySignals.length
  });

  useEffect(() => {
    if (selectedSignalId && !displaySignals.some((signal) => signal.id === selectedSignalId)) {
      setSelectedSignalId(null);
    }
  }, [displaySignals, selectedSignalId]);

  function scrollToSection(section: string) {
    setActiveSection(section);
    scrollTo(`#${section}`, { offset: -92, duration: 1 });
  }

  async function addSignal() {
    setScanStatus("running");
    setDossierTab("payload");
    setNotice("Whale Flow Agent is reading live Mantle RPC data and preparing a transaction payload.");

    try {
      const response = await fetch("/api/agent-scan", { cache: "no-store" });
      if (!response.ok) throw new Error("agent scan failed");

      const scan = await response.json() as AgentScanResponse;
      const preparedId = `Prepared #${preparedSignals.length + 1}`;
      setPreparedSignals((current) => [
        {
          id: preparedId,
          agent: scan.signal.agentName,
          target: scan.signal.targetSymbol,
          direction: toTitleDirection(scan.signal.direction),
          confidence: Math.round(scan.signal.confidenceBps / 100),
          status: "Prepared",
          result: "Ready to commit",
          proof: shortenHash(scan.signal.explanationHash),
          thesis: scan.signal.thesis,
          expiresAt: scan.signal.expiresAt,
          sourceDataHash: scan.signal.sourceDataHash,
          explanationHash: scan.signal.explanationHash,
          evidence: toPreparedEvidence(scan),
          contract: scan.contract
        },
        ...current
      ]);
      setSelectedSignalId(preparedId);
      setScanStatus("ready");
      setNotice(scan.dataSourceMode === "demo-fallback"
        ? "Prepared fallback commitSignal payload. Live Mantle RPC was unavailable, so it is not counted on-chain."
        : "Prepared commitSignal payload from live Mantle RPC data. It is not counted on-chain until submitted.");
    } catch {
      setScanStatus("error");
      setNotice("Agent scan failed locally. Keep the Next API route running and retry.");
    }
  }

  async function copyAlphaCard() {
    const lines = [
      "AlphaProof Arena",
      `${selectedSignal.agent} called ${selectedSignal.target} ${selectedSignal.direction.toLowerCase()} with ${selectedSignal.confidence}% confidence.`,
      `Status: ${selectedSignal.status}`,
      `Proof: ${selectedSignal.proof}`,
      selectedSignal.thesis ? `Thesis: ${selectedSignal.thesis}` : ""
    ].filter(Boolean);

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setNotice("Alpha Card copied.");
    } catch {
      setNotice(lines.join(" "));
    }
  }

  return (
    <main className="app-shell" ref={motionScopeRef}>
      <div className="ambient-stage" aria-hidden="true" data-parallax-scene>
        <span className="ambient-scanline" data-parallax="0.1" />
        {proofParticles.map((particle) => (
          <span className={`proof-particle proof-particle-${particle}`} key={particle} data-parallax="0.06" />
        ))}
      </div>

      <header className="topbar">
        <div className="brand">
          <div className="mark">
            <Radar size={18} />
          </div>
          <div>
            <h1>AlphaProof Arena</h1>
            <span>AI Alpha & Data</span>
          </div>
        </div>
        <div className="network-cluster">
          <div className={`chain-chip ${chainStatus}`}>
            <Radio size={15} />
            <strong>Mantle Sepolia</strong>
            <span>{networkDetail}</span>
          </div>
          <a className="top-link" href={`${explorerBaseUrl}/address/${signalRegistryAddress}`} target="_blank" rel="noreferrer">
            <ExternalLink size={14} />
            Explorer
          </a>
        </div>
      </header>

      <div className="workspace">
        <aside className="side-rail">
          <div className="rail-section">
            <span className="rail-label">Arena</span>
            <button className={`rail-item ${activeSection === "command" ? "active" : ""}`} onClick={() => scrollToSection("command")} data-magnetic>
              <Activity size={16} />
              <span>Command</span>
              <strong>{displaySignals.length}</strong>
            </button>
            <button className={`rail-item ${activeSection === "agents" ? "active" : ""}`} onClick={() => scrollToSection("agents")} data-magnetic>
              <ShieldCheck size={16} />
              <span>Agents</span>
              <strong>{displayAgents.length}</strong>
            </button>
            <button className={`rail-item ${activeSection === "signals" ? "active" : ""}`} onClick={() => scrollToSection("signals")} data-magnetic>
              <GitCommitHorizontal size={16} />
              <span>Signals</span>
              <strong>{resolved}</strong>
            </button>
            <button className={`rail-item ${activeSection === "score" ? "active" : ""}`} onClick={() => scrollToSection("score")} data-magnetic>
              <Trophy size={16} />
              <span>Score</span>
              <strong>{topReputation}</strong>
            </button>
          </div>

          <div className="rail-card">
            <span>Deployment award</span>
            <strong>Verified contracts, public demo, AI callable flow</strong>
            <div className="rail-meter">
              <i style={{ width: "100%" }} />
            </div>
          </div>
        </aside>

        <section className="main">
          <section className="command-center" id="command" data-section="command">
            <div className="agent-hero" data-tilt-card data-parallax-scene>
              <div className="hero-motion-layer" aria-hidden="true">
                <span className="hero-scanline" data-parallax="0.08" />
                <span className="hero-edge-light" />
              </div>
              <div className="section-kicker" data-hero-reveal>
                <BadgeCheck size={15} />
                Verifiable AI alpha
              </div>
              <h2 className="hero-title" aria-label={displayAgents[0].name}>
                {heroWords.map((word) => (
                  <span className="hero-word-mask" key={word}>
                    <span data-hero-word>{word}</span>
                  </span>
                ))}
              </h2>
              <div className="agent-meta-grid" data-hero-reveal>
                <span>Rank #{displayAgents[0].rank}</span>
                <span>{accuracy} accuracy</span>
                <span>{chainState ? shortAddress(chainState.agent.owner) : "Owner loading"}</span>
              </div>
              <div className="action-row" data-hero-reveal>
                <button className="primary-btn" onClick={addSignal} disabled={scanStatus === "running"} data-magnetic>
                  {scanStatus === "running" ? <ScanLine size={17} className="scan-spinner" /> : <Play size={17} />}
                  {scanStatus === "running" ? "Scanning" : "Run Scan"}
                </button>
                <button className="secondary-btn" onClick={copyAlphaCard} data-magnetic>
                  <Copy size={17} />
                  Copy Card
                </button>
                <a className="ghost-btn" href={selectedSignal.proofUrl ?? `${explorerBaseUrl}/address/${signalRegistryAddress}`} target="_blank" rel="noreferrer" data-magnetic>
                  <ArrowUpRight size={17} />
                  Proof
                </a>
              </div>
              <div className={`notice ${scanStatus}`} data-hero-reveal>
                <span />
                {notice}
              </div>
              <div className="xp-burst" aria-hidden="true">+120 XP</div>
              <div className="achievement-toast" aria-hidden="true">
                <strong>Achievement unlocked</strong>
                <span>Proof payload prepared</span>
              </div>
            </div>

            <div className="score-panel" id="score" data-tilt-card>
              <div className="score-ring" style={{ "--score": `${Math.min(Math.max(topReputation, 0), 100) * 3.6}deg` } as React.CSSProperties}>
                <div>
                  <span>Reputation</span>
                  <AnimatedNumber value={topReputation} />
                </div>
              </div>
              <div className="score-stats">
                <div>
                  <span>Resolved</span>
                  <AnimatedNumber value={resolved} />
                </div>
                <div>
                  <span>Correct</span>
                  <AnimatedNumber value={Number(chainState?.score.correctSignals ?? "0")} />
                </div>
                <div>
                  <span>Activity bps</span>
                  <AnimatedNumber value={cumulativeBps} prefix={cumulativeBps >= 0 ? "+" : ""} />
                </div>
              </div>
            </div>
          </section>

          <section className="metric-strip" aria-label="Arena metrics" data-reveal-group>
            <article className="metric-card cobalt" data-tilt-card>
              <Layers3 size={18} />
              <span>On-chain</span>
              <AnimatedNumber value={committed} />
              <small>{pending} pending</small>
            </article>
            <article className="metric-card mint" data-tilt-card>
              <ShieldCheck size={18} />
              <span>Resolved</span>
              <AnimatedNumber value={resolved} />
              <small>{chainStatus === "ready" ? "ScoreRegistry" : "Reading chain"}</small>
            </article>
            <article className="metric-card amber" data-tilt-card>
              <BarChart3 size={18} />
              <span>Confidence</span>
              <AnimatedNumber value={avgConfidence} suffix="%" />
              <small>{displaySignals.length} visible</small>
            </article>
            <article className="metric-card coral" data-tilt-card>
              <DatabaseZap size={18} />
              <span>Source</span>
              <strong>{formatDataSource(selectedSignal.evidence?.dataSource)}</strong>
              <small>{selectedSignal.evidence?.sourceBlockRange ?? "Hashed proof"}</small>
            </article>
          </section>

          <div className="content-grid">
            <div className="left-stack">
              <section className="panel signal-studio" id="signals" data-section="signals" data-reveal>
                <div className="panel-head">
                  <div>
                    <span className="panel-kicker">Signal deck</span>
                    <h3>Live proof queue</h3>
                  </div>
                  <span className="live-badge">
                    <Radio size={13} />
                    Live Mantle
                  </span>
                </div>

                <div className="signal-list">
                  {displaySignals.map((signal, index) => (
                    <article
                      className={`signal-card ${signal.status.toLowerCase()} ${selectedSignal.id === signal.id ? "selected" : ""}`}
                      key={signal.id}
                      style={{ "--delay": `${index * 70}ms` } as React.CSSProperties}
                      data-tilt-card
                    >
                      <div className="signal-index">{String(index + 1).padStart(2, "0")}</div>
                      <div className="signal-body">
                        <div className="signal-title">
                          <strong>{signal.id} - {signal.target}</strong>
                          <span className={`direction ${signal.direction.toLowerCase()}`}>{signal.direction}</span>
                        </div>
                        <p>{signal.thesis ?? `${signal.agent} generated a ${signal.direction.toLowerCase()} signal.`}</p>
                        <div className="signal-foot">
                          <span>{signal.agent}</span>
                          <a href={signal.proofUrl ?? `${explorerBaseUrl}/address/${signalRegistryAddress}`} target="_blank" rel="noreferrer">
                            {signal.proof}
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                      <div className="signal-meter">
                        <div className="confidence" aria-label={`${signal.confidence}% confidence`}>
                          <i style={{ width: `${signal.confidence}%` }} />
                        </div>
                        <strong>{signal.confidence}%</strong>
                        <span className={`status-pill ${signal.status.toLowerCase()}`}>{signal.status}</span>
                      </div>
                      <button className="inspect-btn" onClick={() => {
                        setSelectedSignalId(signal.id);
                        setDossierTab("evidence");
                      }} data-magnetic>
                        <ScanLine size={15} />
                        Inspect
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              <section className="panel agent-panel" id="agents" data-section="agents" data-reveal>
                <div className="panel-head">
                  <div>
                    <span className="panel-kicker">Agent arena</span>
                    <h3>Reputation table</h3>
                  </div>
                  <span className="status-pill resolved">Resolved proof</span>
                </div>
                <div className="agent-grid">
                  {displayAgents.map((agent) => (
                    <article className="agent-row" key={agent.name} data-tilt-card>
                      <div className="rank">#{agent.rank}</div>
                      <div className="agent-main">
                        <strong>{agent.name}</strong>
                        <span>{agent.focus}</span>
                      </div>
                      <div className="spark" aria-hidden="true">
                        {agent.spark.map((height, index) => (
                          <i key={index} style={{ height: `${height}%`, animationDelay: `${index * 75}ms` }} />
                        ))}
                      </div>
                      <div className="score">
                        <AnimatedNumber value={agent.reputation} />
                        <span>{agent.accuracy}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <aside className="dossier">
              <section className="alpha-pass" data-reveal data-tilt-card data-parallax-scene>
                <span className="alpha-edge-light" aria-hidden="true" />
                <div className="alpha-topline">
                  <span>Alpha card</span>
                  <strong>{selectedSignal.status}</strong>
                </div>
                <h3>{selectedSignal.target} {selectedSignal.direction}</h3>
                <p>{selectedSignal.thesis}</p>
                <div className="alpha-stats">
                  <div>
                    <span>Confidence</span>
                    <AnimatedNumber value={selectedSignal.confidence} suffix="%" />
                  </div>
                  <div>
                    <span>Outcome</span>
                    <strong>{selectedSignal.result}</strong>
                  </div>
                  <div>
                    <span>Proof</span>
                    <strong>{selectedSignal.proof}</strong>
                  </div>
                </div>
              </section>

              <section className="panel dossier-panel" data-reveal>
                <div className="dossier-tabs" role="tablist" aria-label="Selected signal dossier">
                  <button className={dossierTab === "evidence" ? "active" : ""} onClick={() => setDossierTab("evidence")} data-magnetic>
                    <DatabaseZap size={15} />
                    Evidence
                  </button>
                  <button className={dossierTab === "payload" ? "active" : ""} onClick={() => setDossierTab("payload")} data-magnetic>
                    <FileCode2 size={15} />
                    Payload
                  </button>
                  <button className={dossierTab === "timeline" ? "active" : ""} onClick={() => setDossierTab("timeline")} data-magnetic>
                    <Timer size={15} />
                    Timeline
                  </button>
                </div>

                {dossierTab === "evidence" ? (
                  <div data-tab-panel>
                    <div className="evidence-grid">
                      <EvidenceTile label="Source" value={formatDataSource(selectedSignal.evidence?.dataSource)} />
                      <EvidenceTile label="Observed" value={formatObservedAt(selectedSignal.evidence?.observedAt)} />
                      <EvidenceTile label="Source blocks" value={selectedSignal.evidence?.sourceBlockRange ?? "Hashed fixture"} />
                      <EvidenceTile label="Outcome blocks" value={selectedSignal.evidence?.outcomeBlockRange ?? "Resolver scored"} />
                      <EvidenceTile label="Source activity" value={formatActivity(selectedSignal.evidence?.sourceTxCount, selectedSignal.evidence?.uniqueWallets)} />
                      <EvidenceTile label="Outcome activity" value={formatActivity(selectedSignal.evidence?.outcomeTxCount, selectedSignal.evidence?.outcomeWallets)} />
                      <EvidenceTile label="Whale wallets" value={String(selectedSignal.evidence?.whaleWallets ?? 0)} />
                      <EvidenceTile label="Score impact" value={selectedSignal.evidence?.scoreDelta ?? selectedSignal.result} />
                    </div>
                    <div className="evidence-links" aria-label="Evidence transaction links">
                      {proofLinks.map((link) => (
                        <a href={link.href} target="_blank" rel="noreferrer" key={`${link.label}-${link.href}`} data-magnetic>
                          <ExternalLink size={13} />
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}

                {dossierTab === "payload" ? (
                  <div className="payload-panel" data-tab-panel>
                    <div className="payload-grid">
                      <EvidenceTile label="Agent" value={`#${selectedSignal.contract?.payload.agentId ?? "1"}`} />
                      <EvidenceTile label="Confidence" value={`${selectedSignal.contract?.payload.confidenceBps ?? selectedSignal.confidence * 100} bps`} />
                      <EvidenceTile label="Source hash" value={shortenHash(selectedSignal.sourceDataHash ?? initialContract.payload.sourceDataHash)} />
                      <EvidenceTile label="Explanation" value={shortenHash(selectedSignal.explanationHash ?? initialContract.payload.explanationHash)} />
                    </div>
                    <code>{JSON.stringify(selectedSignal.contract?.args ?? initialContract.args, null, 2)}</code>
                  </div>
                ) : null}

                {dossierTab === "timeline" ? (
                  <ol className="timeline" data-tab-panel>
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
                ) : null}
              </section>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function EvidenceTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="evidence-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function toDashboardSignal(signal: ChainStateResponse["signals"][number]): Signal {
  const proofTx = signal.resolveTx ?? signal.commitTx;

  return {
    id: `Signal #${signal.id}`,
    agent: "Whale Flow Agent",
    target: signal.targetSymbol,
    direction: toTitleDirection(signal.direction),
    confidence: Math.round(signal.confidenceBps / 100),
    status: signal.resolved ? "Resolved" : "Pending",
    result: signal.resolved ? formatPnl(signal.pnlBps) : formatUnixTimeLeft(signal.expiresAt),
    proof: proofTx ? shortenHash(proofTx) : shortenHash(signal.explanationHash),
    proofUrl: proofTx ? `${explorerBaseUrl}/tx/${proofTx}` : `${explorerBaseUrl}/address/${signalRegistryAddress}`,
    thesis: signal.thesis,
    expiresAt: new Date(Number(signal.expiresAt) * 1000).toISOString(),
    sourceDataHash: signal.sourceDataHash,
    explanationHash: signal.explanationHash,
    commitTx: signal.commitTx,
    resolveTx: signal.resolveTx,
    evidence: signal.evidence,
    contract: {
      functionName: "commitSignal",
      payload: {
        agentId: signal.agentId,
        kind: signal.kind,
        targetId: signal.targetId,
        confidenceBps: signal.confidenceBps,
        expiresAt: signal.expiresAt,
        sourceDataHash: signal.sourceDataHash,
        explanationHash: signal.explanationHash
      },
      args: [
        signal.agentId,
        signal.kind,
        signal.targetId,
        signal.confidenceBps,
        signal.expiresAt,
        signal.sourceDataHash,
        signal.explanationHash
      ]
    }
  };
}

function toPreparedEvidence(scan: AgentScanResponse): SignalEvidence {
  const sourceBlockRange = scan.observation.fromBlock && scan.observation.toBlock
    ? `${scan.observation.fromBlock}-${scan.observation.toBlock}`
    : undefined;

  return {
    dataSource: scan.observation.dataSource ?? String(scan.signal.features.dataSource ?? "live-agent-scan"),
    observedAt: scan.observation.observedAt,
    sourceBlockRange,
    sourceTxCount: scan.observation.txCount,
    uniqueWallets: scan.observation.uniqueWallets,
    whaleWallets: scan.observation.whaleWallets,
    netFlowUsd: scan.observation.netFlowUsd,
    averageTransferUsd: scan.observation.averageTransferUsd,
    sourceTxs: scan.signal.sourceTxs.length > 0 ? scan.signal.sourceTxs : scan.observation.sourceTxs
  };
}

function getProofLinks(signal: Signal) {
  const links: Array<{ label: string; href: string }> = [];
  if (signal.commitTx) links.push({ label: `Commit ${shortenHash(signal.commitTx)}`, href: txUrl(signal.commitTx) });
  if (signal.resolveTx) links.push({ label: `Resolve ${shortenHash(signal.resolveTx)}`, href: txUrl(signal.resolveTx) });

  for (const tx of (signal.evidence?.sourceTxs ?? []).slice(0, 4)) {
    links.push({ label: `Source ${shortenHash(tx)}`, href: txUrl(tx) });
  }

  return links;
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

function txUrl(tx: string) {
  return `${explorerBaseUrl}/tx/${tx}`;
}

function formatDataSource(dataSource?: string) {
  if (!dataSource) return "Mantle proof hash";
  if (dataSource === "mantle-sepolia-rpc-native-transfers") return "Mantle Sepolia RPC";
  return dataSource.replaceAll("-", " ");
}

function formatObservedAt(value?: string) {
  if (!value) return "On-chain";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "On-chain";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatActivity(txCount?: number, walletCount?: number) {
  if (typeof txCount !== "number") return "Committed hash";
  if (typeof walletCount !== "number") return `${txCount} txs`;
  return `${txCount} txs / ${walletCount} wallets`;
}

function formatUnixTimeLeft(expiresAt: string) {
  const deltaMinutes = Math.round((Number(expiresAt) * 1000 - Date.now()) / 60_000);
  if (deltaMinutes <= 0) return "Expired";
  return `${deltaMinutes}m left`;
}

function formatPnl(pnlBps: string) {
  const value = Number(pnlBps) / 100;
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatAccuracy(score: ChainStateResponse["score"]) {
  const resolvedSignals = Number(score.resolvedSignals);
  if (resolvedSignals === 0) return "0.0%";

  return `${((Number(score.correctSignals) / resolvedSignals) * 100).toFixed(1)}%`;
}
