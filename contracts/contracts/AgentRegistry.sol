// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentRegistry
 * @dev Manages agent identities and their associated reputation attestations on Aetherial.
 */
contract AgentRegistry is Ownable {
    struct Agent {
        bool isRegistered;
        uint256 creditScore; // 0-1000 base
        string reputationCID; // EAS attestation reference or metadata
        bool isWhitelisted;
    }

    mapping(address => Agent) public agents;
    address[] public registeredAgents;

    event AgentRegistered(address indexed agent);
    event CreditScoreUpdated(address indexed agent, uint256 newScore);
    event WhitelistStatusChanged(address indexed agent, bool status);

    constructor() Ownable(msg.sender) {}

    function registerAgent() external {
        require(!agents[msg.sender].isRegistered, "Already registered");
        agents[msg.sender] = Agent({
            isRegistered: true,
            creditScore: 0,
            reputationCID: "",
            isWhitelisted: false
        });
        registeredAgents.push(msg.sender);
        emit AgentRegistered(msg.sender);
    }

    function updateCreditScore(address agent, uint256 score) external onlyOwner {
        require(agents[agent].isRegistered, "Agent not registered");
        agents[agent].creditScore = score;
        emit CreditScoreUpdated(agent, score);
    }

    function setWhitelisted(address agent, bool status) external onlyOwner {
        require(agents[agent].isRegistered, "Agent not registered");
        agents[agent].isWhitelisted = status;
        emit WhitelistStatusChanged(agent, status);
    }

    function getAgent(address agent) external view returns (Agent memory) {
        return agents[agent];
    }
}
