// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ScoreRegistry {
    struct AgentScore {
        uint256 resolvedSignals;
        uint256 correctSignals;
        int256 reputation;
        int256 cumulativePnLBps;
        uint64 updatedAt;
    }

    address public owner;
    address public resolver;
    mapping(uint256 => AgentScore) private scores;

    event ResolverUpdated(address indexed resolver);
    event ScoreRecorded(
        uint256 indexed agentId,
        uint256 indexed signalId,
        bool correct,
        int256 reputationDelta,
        int256 pnlBps,
        int256 newReputation
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier onlyResolver() {
        require(msg.sender == resolver, "not resolver");
        _;
    }

    constructor(address initialResolver) {
        owner = msg.sender;
        resolver = initialResolver;
        emit ResolverUpdated(initialResolver);
    }

    function setResolver(address newResolver) external onlyOwner {
        require(newResolver != address(0), "resolver zero");
        resolver = newResolver;
        emit ResolverUpdated(newResolver);
    }

    function recordScore(
        uint256 agentId,
        uint256 signalId,
        bool correct,
        int256 reputationDelta,
        int256 pnlBps
    ) external onlyResolver {
        AgentScore storage score = scores[agentId];
        score.resolvedSignals += 1;
        if (correct) score.correctSignals += 1;
        score.reputation += reputationDelta;
        score.cumulativePnLBps += pnlBps;
        score.updatedAt = uint64(block.timestamp);

        emit ScoreRecorded(agentId, signalId, correct, reputationDelta, pnlBps, score.reputation);
    }

    function getScore(uint256 agentId) external view returns (AgentScore memory) {
        return scores[agentId];
    }
}

