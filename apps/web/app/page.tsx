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
import { BlockStreamTicker } from "@/components/block-stream-ticker";
import { ProofPulse } from "@/components/proof-pulse";
import { useMotion } from "@/components/motion-provider";
import { useArenaMotion } from "@/lib/animation/use-arena-motion";
import { useCardMotion } from "@/lib/animation/use-card-motion";
import { useCardTilt } from "@/lib/animation/use-card-tilt";
import { useHashScramble } from "@/lib/animation/use-hash-scramble";
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
  commitBlock?: string;
  roundStage?: string;
  commitMode?: string;
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

type ArenaRoundResponse = AgentScanResponse & {
  warning?: string;
  round: {
    id: string;
    status: "prepared" | "committed";
    mode: "live-mantle-rpc" | "demo-fallback";
    committed: boolean;
    chainId: number;
    agentId: string;
    signalId?: string;
    createdAt: string;
    expiresAt?: string;
    resolverEtaSeconds?: number;
    commitTx?: string;
    commitBlock?: string;
    explorerUrl?: string;
    signer?: string;
    reason?: string;
    nextStep?: string;
  };
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
  const [notice, setNotice] = useState("Whale Flow Agent is ready to start a live Mantle proof round.");
  const [commitPulseId, setCommitPulseId] = useState(0);
  const [resolvePulseId, setResolvePulseId] = useState(0);
  const [activePulseNode, setActivePulseNode] = useState<"agent" | "signal" | "score" | null>(null);
  const lastResolvedRef = useRef<number | null>(null);

  const reloadChainState = useMemo(() => async () => {
    setChainStatus("loading");
    try {
      const response = await fetch("/api/chain-state", { cache: "no-store" });
      if (!response.ok) throw new Error("chain state failed");
      const state = await response.json() as ChainStateResponse;
      setChainState(state);
      setChainStatus("ready");
    } catch {
      setChainStatus("error");
    }
  }, []);

  useEffect(() => {
    void reloadChainState();
  }, [reloadChainState]);

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

  const optimisticCommitted = preparedSignals.filter((signal) => Boolean(signal.commitTx)).length;
  const committed = (chainState ? Math.max(0, Number(chainState.nextSignalId) - 1) : chainSignals.length) + optimisticCommitted;
  const resolved = chainState
    ? Number(chainState.score.resolvedSignals)
    : chainSignals.filter((signal) => signal.status === "Resolved").length;
  const pending = displaySignals.filter((signal) => signal.status === "Pending").length;
  const latest = displaySignals[0];
  const selectedSignal = displaySignals.find((signal) => signal.id === selectedSignalId) ?? latest ?? initialSignals[0];
  const avgConfidence = useMemo(
    () => displaySignals.length === 0
      ? 0
      : Math.round(displaySignals.reduce((sum, signal) => sum + signal.confidence, 0) / displaySignals.length),
    [displaySignals]
  );
  const topReputation = chainState ? Number(chainState.score.reputation) : agents[0].reputation;
  const accuracy = chainState ? formatAccuracy(chainState.score) : displayAgents[0].accuracy;
  const cumulativeBps = chainState ? Number(chainState.score.cumulativePnLBps) : 0;
  const proofLinks = getProofLinks(selectedSignal);
  const timelineEvents = buildSignalTimeline(selectedSignal);
  const heroWords = displayAgents[0].name.split(" ");
  const scrambledProof = useHashScramble(selectedSignal.proof);
  const scrambledSourceHash = useHashScramble(
    shortenHash(selectedSignal.sourceDataHash ?? initialContract.payload.sourceDataHash)
  );
  const scrambledExplanationHash = useHashScramble(
    shortenHash(selectedSignal.explanationHash ?? initialContract.payload.explanationHash)
  );
  const networkDetail = chainStatus === "ready"
    ? `SignalRegistry ${shortAddress(chainState?.contracts.signalRegistry ?? signalRegistryAddress)}`
    : chainStatus === "loading"
      ? "Reading live chain state"
      : "Live RPC unavailable — click to retry";

  const cardMotionKey = `${displaySignals.length}:${scanStatus}:${chainState?.score.resolvedSignals ?? "0"}:${selectedSignalId ?? ""}`;

  useRevealAnimation(motionScopeRef, { refreshKey: displaySignals.length });
  useParallax(motionScopeRef, displaySignals.length);
  useMagneticButton(motionScopeRef);
  useCardTilt(motionScopeRef);
  useCardMotion(motionScopeRef, { refreshKey: cardMotionKey });
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

  useEffect(() => {
    if (!chainState) return;
    const resolvedNow = Number(chainState.score.resolvedSignals);
    if (lastResolvedRef.current === null) {
      lastResolvedRef.current = resolvedNow;
      return;
    }
    if (resolvedNow > lastResolvedRef.current) {
      setResolvePulseId((n) => n + 1);
      setActivePulseNode("score");
    }
    lastResolvedRef.current = resolvedNow;
  }, [chainState]);

  useEffect(() => {
    if (activePulseNode === null) return;
    const timeout = setTimeout(() => setActivePulseNode(null), 1400);
    return () => clearTimeout(timeout);
  }, [activePulseNode, commitPulseId, resolvePulseId]);

  function scrollToSection(section: string) {
    setActiveSection(section);
    scrollTo(`#${section}`, { offset: -92, duration: 1 });
  }

  async function addSignal() {
    setScanStatus("running");
    setDossierTab("payload");
    setNotice("Whale Flow Agent is reading Mantle RPC data and opening a proof round.");
    setCommitPulseId((n) => n + 1);
    setActivePulseNode("agent");

    try {
      const response = await fetch("/api/arena-round", {
        cache: "no-store",
        method: "POST"
      });
      if (!response.ok) throw new Error("arena round failed");

      const round = await response.json() as ArenaRoundResponse;
      const signal = toRoundSignal(round, preparedSignals.length + 1);

      setPreparedSignals((current) => [signal, ...current]);
      setSelectedSignalId(signal.id);
      setScanStatus("ready");
      setNotice(buildRoundNotice(round));

      if (round.round.committed) {
        void reloadChainState().then(() => {
          setPreparedSignals((current) => current.filter((entry) => !entry.commitTx));
        });
      }
    } catch {
      setScanStatus("error");
      setNotice("Arena round failed locally. Keep the Next API route running and retry.");
    }
  }

  async function copyAlphaCard() {
    const proofUrl = selectedSignal.proofUrl
      ?? `${explorerBaseUrl}/address/${signalRegistryAddress}`;
    const lines = [
      "AlphaProof Arena",
      `${selectedSignal.agent} called ${selectedSignal.target} ${selectedSignal.direction.toLowerCase()} with ${selectedSignal.confidence}% confidence.`,
      `Status: ${selectedSignal.status}`,
      `Outcome: ${selectedSignal.result}`,
      selectedSignal.thesis ? `Thesis: ${selectedSignal.thesis}` : "",
      `Proof: ${proofUrl}`
    ].filter(Boolean);

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setNotice("Alpha Card copied to clipboard with Mantle Explorer link.");
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
            <span>Proof-of-alpha for AI agents on Mantle</span>
          </div>
        </div>
        <div className="network-cluster">
          <button
            type="button"
            className={`chain-chip ${chainStatus}`}
            onClick={() => { if (chainStatus !== "loading") void reloadChainState(); }}
            aria-label="Reload chain state"
            disabled={chainStatus === "loading"}
          >
            <Radio size={15} />
            <strong>Mantle Sepolia</strong>
            <span>{networkDetail}</span>
          </button>
          <a className="top-link" href={`${explorerBaseUrl}/address/${signalRegistryAddress}`} target="_blank" rel="noreferrer">
            <ExternalLink size={14} />
            Explorer
          </a>
        </div>
      </header>

      <div className="workspace">
        <aside className="side-rail">
          <nav className="rail-section" aria-label="Arena sections">
            <span className="rail-label">Arena</span>
            <button
              type="button"
              className={`rail-item ${activeSection === "command" ? "active" : ""}`}
              aria-current={activeSection === "command" ? "page" : undefined}
              onClick={() => scrollToSection("command")}
              data-magnetic
            >
              <Activity size={16} aria-hidden="true" />
              <span>Command</span>
              <strong aria-label={`${displaySignals.length} signals`}>{displaySignals.length}</strong>
            </button>
            <button
              type="button"
              className={`rail-item ${activeSection === "agents" ? "active" : ""}`}
              aria-current={activeSection === "agents" ? "page" : undefined}
              onClick={() => scrollToSection("agents")}
              data-magnetic
            >
              <ShieldCheck size={16} aria-hidden="true" />
              <span>Agents</span>
              <strong aria-label={`${displayAgents.length} agents`}>{displayAgents.length}</strong>
            </button>
            <button
              type="button"
              className={`rail-item ${activeSection === "signals" ? "active" : ""}`}
              aria-current={activeSection === "signals" ? "page" : undefined}
              onClick={() => scrollToSection("signals")}
              data-magnetic
            >
              <GitCommitHorizontal size={16} aria-hidden="true" />
              <span>Signals</span>
              <strong aria-label={`${resolved} resolved`}>{resolved}</strong>
            </button>
            <button
              type="button"
              className={`rail-item ${activeSection === "score" ? "active" : ""}`}
              aria-current={activeSection === "score" ? "page" : undefined}
              onClick={() => scrollToSection("score")}
              data-magnetic
            >
              <Trophy size={16} aria-hidden="true" />
              <span>Score</span>
              <strong aria-label={`Reputation ${topReputation}`}>{topReputation}</strong>
            </button>
          </nav>

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
              <p className="hero-explainer" data-hero-reveal>
                Each round hashes a fresh AI signal and commits it to Mantle before the outcome
                window closes. The resolver writes the result and reputation update on-chain — no
                claims, just verifiable proof.
              </p>
              <ol className="round-steps" aria-label="Live arena round flow" data-hero-reveal>
                <li className={scanStatus === "running" ? "active" : ""} title="Read recent Mantle Sepolia blocks">
                  <ScanLine size={14} aria-hidden="true" />
                  <span>Scan</span>
                </li>
                <li className={scanStatus === "ready" ? "active" : ""} title="Hash signal and write to SignalRegistry">
                  <GitCommitHorizontal size={14} aria-hidden="true" />
                  <span>Commit</span>
                </li>
                <li title="Score the outcome window after expiry">
                  <Timer size={14} aria-hidden="true" />
                  <span>Resolve</span>
                </li>
                <li title="Update reputation on ScoreRegistry">
                  <Trophy size={14} aria-hidden="true" />
                  <span>Rank</span>
                </li>
              </ol>
              <div className="action-row" data-hero-reveal>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={addSignal}
                  disabled={scanStatus === "running"}
                  aria-label={scanStatus === "running" ? "Starting arena round" : "Start a live Mantle proof round"}
                  data-magnetic
                >
                  {scanStatus === "running"
                    ? <ScanLine size={17} className="scan-spinner" aria-hidden="true" />
                    : <Play size={17} aria-hidden="true" />}
                  {scanStatus === "running" ? "Starting" : "Start Round"}
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={copyAlphaCard}
                  aria-label="Copy selected signal as a shareable Alpha Card"
                  data-magnetic
                >
                  <Copy size={17} aria-hidden="true" />
                  Copy Card
                </button>
                <a
                  className="ghost-btn"
                  href={selectedSignal.proofUrl ?? `${explorerBaseUrl}/address/${signalRegistryAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open Mantle Explorer proof for the selected signal"
                  data-magnetic
                >
                  <ArrowUpRight size={17} aria-hidden="true" />
                  Proof
                </a>
              </div>
              <div className={`notice ${scanStatus}`} data-hero-reveal>
                <span />
                {notice}
              </div>
              <div className="hero-pulse" data-hero-reveal>
                <ProofPulse
                  commitPulseId={commitPulseId}
                  resolvePulseId={resolvePulseId}
                  activeNode={activePulseNode}
                />
              </div>
              <BlockStreamTicker />
              <div className="xp-burst" aria-hidden="true">+120 XP</div>
              <div className="achievement-toast" aria-hidden="true">
                <strong>Achievement unlocked</strong>
                <span>Round proof ready</span>
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
              <strong className="metric-text">{formatDataSource(selectedSignal.evidence?.dataSource)}</strong>
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
                      data-tilt-card
                      data-batch-card
                    >
                      <div className="signal-index">{String(index + 1).padStart(2, "0")}</div>
                      <div className="signal-body">
                        <div className="signal-title">
                          <strong>{signal.id} - {signal.target}</strong>
                          <span
                            className={`direction ${signal.direction.toLowerCase()}`}
                            key={`direction-${signal.direction}`}
                            data-badge
                          >
                            {signal.direction}
                          </span>
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
                        <span
                          className={`status-pill ${signal.status.toLowerCase()}`}
                          key={`status-${signal.status}`}
                          data-badge
                        >
                          {signal.status}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="inspect-btn"
                        aria-label={`Inspect ${signal.id} ${signal.target} dossier`}
                        aria-pressed={selectedSignal.id === signal.id}
                        onClick={() => {
                          setSelectedSignalId(signal.id);
                          setDossierTab("evidence");
                        }}
                        data-magnetic
                      >
                        <ScanLine size={15} aria-hidden="true" />
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
              <section className="alpha-pass" data-tilt-card data-parallax-scene>
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
                    <strong className="mono-proof">{scrambledProof}</strong>
                  </div>
                </div>
              </section>

              <section className="panel dossier-panel" data-reveal>
                <div className="dossier-tabs" role="tablist" aria-label="Selected signal dossier">
                  <button
                    type="button"
                    role="tab"
                    id="dossier-tab-evidence"
                    aria-selected={dossierTab === "evidence"}
                    aria-controls="dossier-panel-evidence"
                    tabIndex={dossierTab === "evidence" ? 0 : -1}
                    className={dossierTab === "evidence" ? "active" : ""}
                    onClick={() => setDossierTab("evidence")}
                    data-magnetic
                  >
                    <DatabaseZap size={15} aria-hidden="true" />
                    Evidence
                  </button>
                  <button
                    type="button"
                    role="tab"
                    id="dossier-tab-payload"
                    aria-selected={dossierTab === "payload"}
                    aria-controls="dossier-panel-payload"
                    tabIndex={dossierTab === "payload" ? 0 : -1}
                    className={dossierTab === "payload" ? "active" : ""}
                    onClick={() => setDossierTab("payload")}
                    data-magnetic
                  >
                    <FileCode2 size={15} aria-hidden="true" />
                    Payload
                  </button>
                  <button
                    type="button"
                    role="tab"
                    id="dossier-tab-timeline"
                    aria-selected={dossierTab === "timeline"}
                    aria-controls="dossier-panel-timeline"
                    tabIndex={dossierTab === "timeline" ? 0 : -1}
                    className={dossierTab === "timeline" ? "active" : ""}
                    onClick={() => setDossierTab("timeline")}
                    data-magnetic
                  >
                    <Timer size={15} aria-hidden="true" />
                    Timeline
                  </button>
                </div>

                {dossierTab === "evidence" ? (
                  <div data-tab-panel role="tabpanel" id="dossier-panel-evidence" aria-labelledby="dossier-tab-evidence">
                    <div className="evidence-grid receipt-reveal" key={`evidence-${selectedSignal.id}`}>
                      <EvidenceTile label="Source" value={formatDataSource(selectedSignal.evidence?.dataSource)} />
                      <EvidenceTile label="Observed" value={formatObservedAt(selectedSignal.evidence?.observedAt)} />
                      <EvidenceTile label="Round" value={selectedSignal.evidence?.roundStage ?? selectedSignal.status} />
                      <EvidenceTile label="Mode" value={selectedSignal.evidence?.commitMode ?? "On-chain proof"} />
                      <EvidenceTile label="Source blocks" value={selectedSignal.evidence?.sourceBlockRange ?? "Hashed fixture"} />
                      <EvidenceTile label="Commit block" value={selectedSignal.evidence?.commitBlock ?? selectedSignal.evidence?.outcomeBlockRange ?? "Resolver pending"} />
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
                  <div className="payload-panel" data-tab-panel role="tabpanel" id="dossier-panel-payload" aria-labelledby="dossier-tab-payload">
                    <div className="payload-grid">
                      <EvidenceTile label="Agent" value={`#${selectedSignal.contract?.payload.agentId ?? "1"}`} />
                      <EvidenceTile label="Confidence" value={`${selectedSignal.contract?.payload.confidenceBps ?? selectedSignal.confidence * 100} bps`} />
                      <EvidenceTile label="Source hash" value={scrambledSourceHash} />
                      <EvidenceTile label="Explanation" value={scrambledExplanationHash} />
                    </div>
                    <code>{JSON.stringify(selectedSignal.contract?.args ?? initialContract.args, null, 2)}</code>
                  </div>
                ) : null}

                {dossierTab === "timeline" ? (
                  <ol className="timeline" data-tab-panel role="tabpanel" id="dossier-panel-timeline" aria-labelledby="dossier-tab-timeline">
                    {timelineEvents.map((event) => (
                      <li key={`${event.time}-${event.title}`}>
                        <time>{event.time}</time>
                        <div>
                          <strong>{event.title}</strong>
                          <span>{event.detail}</span>
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

function toRoundSignal(round: ArenaRoundResponse, index: number): Signal {
  const committed = round.round.committed && Boolean(round.round.commitTx);
  const signalId = committed && round.round.signalId
    ? `Signal #${round.round.signalId}`
    : `Prepared #${index}`;
  const expiresAt = round.round.expiresAt ?? round.signal.expiresAt;
  const evidence = toPreparedEvidence(round);
  evidence.roundStage = committed ? "Committed" : "Prepared";
  evidence.commitMode = round.round.mode === "demo-fallback"
    ? "Demo fallback"
    : committed
      ? "Auto-committed"
      : "Prepared payload";
  if (round.round.commitBlock) evidence.commitBlock = String(round.round.commitBlock);
  evidence.scoreDelta = committed
    ? `Resolver pending ${formatEta(round.round.resolverEtaSeconds)}`
    : round.round.reason ?? "Commit payload ready";

  return {
    id: signalId,
    agent: round.signal.agentName,
    target: round.signal.targetSymbol,
    direction: toTitleDirection(round.signal.direction),
    confidence: Math.round(round.signal.confidenceBps / 100),
    status: committed ? "Pending" : "Prepared",
    result: committed ? formatUnixTimeLeft(round.contract.payload.expiresAt) : "Ready to commit",
    proof: committed && round.round.commitTx
      ? shortenHash(round.round.commitTx)
      : shortenHash(round.signal.explanationHash),
    proofUrl: round.round.explorerUrl ?? (round.round.commitTx ? txUrl(round.round.commitTx) : undefined),
    thesis: round.signal.thesis,
    expiresAt,
    sourceDataHash: round.signal.sourceDataHash,
    explanationHash: round.signal.explanationHash,
    commitTx: round.round.commitTx,
    evidence,
    contract: round.contract
  };
}

function buildRoundNotice(round: ArenaRoundResponse) {
  if (round.round.committed && round.round.signalId) {
    return `Committed Signal #${round.round.signalId} on Mantle Sepolia. Resolver opens ${formatEta(round.round.resolverEtaSeconds)}.`;
  }

  if (round.round.mode === "demo-fallback") {
    return `Prepared fallback payload because live Mantle RPC was unavailable: ${round.round.reason ?? round.warning ?? "retry later"}.`;
  }

  return `Prepared a live Mantle payload. ${round.round.reason ?? "Enable server autocommit to write it on-chain from the demo."}`;
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

function buildSignalTimeline(signal: Signal) {
  const observedAt = signal.evidence?.observedAt;
  const blockRange = signal.evidence?.sourceBlockRange ?? "hashed source data";
  const events = [
    {
      time: formatTimelineTime(observedAt),
      title: "Scan",
      detail: `${formatDataSource(signal.evidence?.dataSource)} captured ${blockRange}.`
    },
    {
      time: signal.commitTx ? "Chain" : "Ready",
      title: signal.commitTx ? "Commit" : "Payload",
      detail: signal.commitTx
        ? `Signal proof written to Mantle in ${shortenHash(signal.commitTx)}.`
        : `commitSignal payload generated with ${shortenHash(signal.explanationHash ?? initialContract.payload.explanationHash)}.`
    }
  ];

  if (signal.status === "Resolved") {
    events.push({
      time: "Score",
      title: "Resolve",
      detail: `Outcome scored ${signal.result}; reputation updated on-chain.`
    });
  } else {
    events.push({
      time: "Expiry",
      title: "Resolve",
      detail: `${signal.result} before the resolver can finalize the round.`
    });
  }

  events.push({
    time: "Share",
    title: "Alpha Card",
    detail: `${signal.target} ${signal.direction.toLowerCase()} proof is ready for community voting.`
  });

  return events;
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

function formatEta(seconds?: number) {
  if (typeof seconds !== "number" || seconds <= 0) return "now";
  if (seconds < 60) return `in ${seconds}s`;

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `in ${minutes}m`;

  const hours = Math.round(minutes / 60);
  return `in ${hours}h`;
}

function formatTimelineTime(value?: string) {
  if (!value) return "Live";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Live";

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit"
  });
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
