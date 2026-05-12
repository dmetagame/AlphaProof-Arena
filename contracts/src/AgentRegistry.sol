// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract AgentRegistry {
    struct Agent {
        address owner;
        string name;
        string metadataURI;
        bool active;
        uint64 createdAt;
    }

    uint256 public nextAgentId = 1;
    mapping(uint256 => Agent) private agents;
    mapping(address => uint256[]) private ownerAgents;

    event AgentRegistered(
        uint256 indexed agentId,
        address indexed owner,
        string name,
        string metadataURI
    );

    event AgentStatusUpdated(uint256 indexed agentId, bool active);
    event AgentMetadataUpdated(uint256 indexed agentId, string metadataURI);

    modifier onlyAgentOwner(uint256 agentId) {
        require(agents[agentId].owner == msg.sender, "not agent owner");
        _;
    }

    function registerAgent(string calldata name, string calldata metadataURI) external returns (uint256 agentId) {
        require(bytes(name).length > 0, "missing name");

        agentId = nextAgentId++;
        agents[agentId] = Agent({
            owner: msg.sender,
            name: name,
            metadataURI: metadataURI,
            active: true,
            createdAt: uint64(block.timestamp)
        });
        ownerAgents[msg.sender].push(agentId);

        emit AgentRegistered(agentId, msg.sender, name, metadataURI);
    }

    function setAgentStatus(uint256 agentId, bool active) external onlyAgentOwner(agentId) {
        agents[agentId].active = active;
        emit AgentStatusUpdated(agentId, active);
    }

    function setAgentMetadata(uint256 agentId, string calldata metadataURI) external onlyAgentOwner(agentId) {
        agents[agentId].metadataURI = metadataURI;
        emit AgentMetadataUpdated(agentId, metadataURI);
    }

    function getAgent(uint256 agentId) external view returns (Agent memory) {
        require(agents[agentId].owner != address(0), "unknown agent");
        return agents[agentId];
    }

    function isActiveAgentOwner(uint256 agentId, address account) external view returns (bool) {
        Agent memory agent = agents[agentId];
        return agent.owner == account && agent.active;
    }

    function agentsOf(address owner) external view returns (uint256[] memory) {
        return ownerAgents[owner];
    }
}

