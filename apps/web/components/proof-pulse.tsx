"use client";

type ProofPulseProps = {
  commitPulseId: number;
  resolvePulseId: number;
  activeNode?: "agent" | "signal" | "score" | null;
};

const NODES = [
  { key: "agent", x: 20, label: "Agent" },
  { key: "signal", x: 100, label: "SignalRegistry" },
  { key: "score", x: 180, label: "ScoreRegistry" }
] as const;

export function ProofPulse({ commitPulseId, resolvePulseId, activeNode }: ProofPulseProps) {
  return (
    <div className="proof-pulse" role="img" aria-label="AlphaProof architecture: Agent commits to SignalRegistry, Resolver writes to ScoreRegistry">
      <svg viewBox="0 0 200 60" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <linearGradient id="pulse-line" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="rgba(159, 245, 25, 0.0)" />
            <stop offset="50%" stopColor="rgba(159, 245, 25, 0.55)" />
            <stop offset="100%" stopColor="rgba(159, 245, 25, 0.0)" />
          </linearGradient>
        </defs>

        <line x1="30" y1="30" x2="90" y2="30" className="pulse-edge" />
        <line x1="110" y1="30" x2="170" y2="30" className="pulse-edge" />

        {NODES.map((node) => (
          <g key={node.key} className={`pulse-node ${activeNode === node.key ? "active" : ""}`}>
            <circle cx={node.x} cy={30} r={10} />
            <text x={node.x} y={52} textAnchor="middle">{node.label}</text>
          </g>
        ))}

        {commitPulseId > 0 ? (
          <circle
            key={`commit-${commitPulseId}`}
            className="pulse-dot pulse-segment-1"
            cx={30}
            cy={30}
            r={3}
          />
        ) : null}

        {resolvePulseId > 0 ? (
          <circle
            key={`resolve-${resolvePulseId}`}
            className="pulse-dot pulse-segment-2"
            cx={110}
            cy={30}
            r={3}
          />
        ) : null}
      </svg>
    </div>
  );
}
