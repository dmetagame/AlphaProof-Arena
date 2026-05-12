// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAgentRegistry {
    function isActiveAgentOwner(uint256 agentId, address account) external view returns (bool);
}

interface IScoreRegistry {
    function recordScore(
        uint256 agentId,
        uint256 signalId,
        bool correct,
        int256 reputationDelta,
        int256 pnlBps
    ) external;
}

contract SignalRegistry {
    enum SignalKind {
        WhaleFlow,
        LiquidityShift,
        Volatility,
        Sentiment,
        Yield
    }

    struct Signal {
        uint256 agentId;
        SignalKind kind;
        bytes32 targetId;
        uint16 confidenceBps;
        uint64 createdAt;
        uint64 expiresAt;
        bytes32 sourceDataHash;
        bytes32 explanationHash;
        bool resolved;
        bool correct;
        int256 pnlBps;
    }

    IAgentRegistry public immutable agentRegistry;
    IScoreRegistry public scoreRegistry;
    address public owner;
    address public resolver;
    uint256 public nextSignalId = 1;

    mapping(uint256 => Signal) private signals;
    mapping(uint256 => uint256[]) private agentSignals;

    event ResolverUpdated(address indexed resolver);
    event ScoreRegistryUpdated(address indexed scoreRegistry);
    event SignalCommitted(
        uint256 indexed signalId,
        uint256 indexed agentId,
        SignalKind kind,
        bytes32 indexed targetId,
        uint16 confidenceBps,
        uint64 expiresAt,
        bytes32 sourceDataHash,
        bytes32 explanationHash
    );
    event SignalResolved(
        uint256 indexed signalId,
        uint256 indexed agentId,
        bool correct,
        int256 pnlBps,
        int256 reputationDelta
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier onlyResolver() {
        require(msg.sender == resolver, "not resolver");
        _;
    }

    constructor(address agentRegistry_, address scoreRegistry_, address initialResolver) {
        require(agentRegistry_ != address(0), "agent registry zero");
        require(scoreRegistry_ != address(0), "score registry zero");
        require(initialResolver != address(0), "resolver zero");

        owner = msg.sender;
        agentRegistry = IAgentRegistry(agentRegistry_);
        scoreRegistry = IScoreRegistry(scoreRegistry_);
        resolver = initialResolver;

        emit ScoreRegistryUpdated(scoreRegistry_);
        emit ResolverUpdated(initialResolver);
    }

    function setResolver(address newResolver) external onlyOwner {
        require(newResolver != address(0), "resolver zero");
        resolver = newResolver;
        emit ResolverUpdated(newResolver);
    }

    function setScoreRegistry(address newScoreRegistry) external onlyOwner {
        require(newScoreRegistry != address(0), "score registry zero");
        scoreRegistry = IScoreRegistry(newScoreRegistry);
        emit ScoreRegistryUpdated(newScoreRegistry);
    }

    function commitSignal(
        uint256 agentId,
        SignalKind kind,
        bytes32 targetId,
        uint16 confidenceBps,
        uint64 expiresAt,
        bytes32 sourceDataHash,
        bytes32 explanationHash
    ) external returns (uint256 signalId) {
        require(agentRegistry.isActiveAgentOwner(agentId, msg.sender), "not active agent owner");
        require(targetId != bytes32(0), "target required");
        require(confidenceBps > 0 && confidenceBps <= 10000, "bad confidence");
        require(expiresAt > block.timestamp, "expiry in past");
        require(sourceDataHash != bytes32(0), "source hash required");
        require(explanationHash != bytes32(0), "explanation hash required");

        signalId = nextSignalId++;
        signals[signalId] = Signal({
            agentId: agentId,
            kind: kind,
            targetId: targetId,
            confidenceBps: confidenceBps,
            createdAt: uint64(block.timestamp),
            expiresAt: expiresAt,
            sourceDataHash: sourceDataHash,
            explanationHash: explanationHash,
            resolved: false,
            correct: false,
            pnlBps: 0
        });
        agentSignals[agentId].push(signalId);

        emit SignalCommitted(
            signalId,
            agentId,
            kind,
            targetId,
            confidenceBps,
            expiresAt,
            sourceDataHash,
            explanationHash
        );
    }

    function resolveSignal(
        uint256 signalId,
        bool correct,
        int256 pnlBps,
        int256 reputationDelta
    ) external onlyResolver {
        Signal storage signal = signals[signalId];
        require(signal.agentId != 0, "unknown signal");
        require(!signal.resolved, "already resolved");
        require(block.timestamp >= signal.expiresAt, "not expired");

        signal.resolved = true;
        signal.correct = correct;
        signal.pnlBps = pnlBps;

        scoreRegistry.recordScore(signal.agentId, signalId, correct, reputationDelta, pnlBps);
        emit SignalResolved(signalId, signal.agentId, correct, pnlBps, reputationDelta);
    }

    function getSignal(uint256 signalId) external view returns (Signal memory) {
        require(signals[signalId].agentId != 0, "unknown signal");
        return signals[signalId];
    }

    function signalsOfAgent(uint256 agentId) external view returns (uint256[] memory) {
        return agentSignals[agentId];
    }
}

