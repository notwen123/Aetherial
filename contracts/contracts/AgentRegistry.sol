// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ReputationNFT.sol";

/**
 * @title AgentRegistry
 * @dev Manages agent identities, credit scores, and Reputation NFTs on Aetherial.
 *
 *  Flow:
 *   1. Agent calls registerAgent() → stored with score 0, not whitelisted.
 *   2. Off-chain CreditEvaluator calls updateCreditScore() with the real alpha score.
 *   3. If score >= WHITELIST_THRESHOLD the agent is auto-whitelisted.
 *   4. On first whitelist, a soulbound ReputationNFT is minted with the EAS UID.
 *   5. Owner can manually override whitelist status at any time.
 */
contract AgentRegistry is Ownable {
    ReputationNFT public reputationNFT;

    /// Minimum credit score (0-1000) required for auto-whitelist
    uint256 public constant WHITELIST_THRESHOLD = 500;

    struct Agent {
        bool isRegistered;
        uint256 creditScore;   // 0-1000
        string easAttestationUID; // latest EAS attestation UID
        bool isWhitelisted;
        uint256 lastUpdated;   // block.timestamp of last score update
    }

    mapping(address => Agent) public agents;
    address[] public registeredAgents;

    event AgentRegistered(address indexed agent);
    event CreditScoreUpdated(address indexed agent, uint256 newScore, string easUID);
    event WhitelistStatusChanged(address indexed agent, bool status);

    constructor(address _reputationNFT) Ownable(msg.sender) {
        reputationNFT = ReputationNFT(_reputationNFT);
    }

    /**
     * @dev Any address can self-register as an agent.
     */
    function registerAgent() external {
        require(!agents[msg.sender].isRegistered, "Already registered");
        agents[msg.sender] = Agent({
            isRegistered: true,
            creditScore: 0,
            easAttestationUID: "",
            isWhitelisted: false,
            lastUpdated: block.timestamp
        });
        registeredAgents.push(msg.sender);
        emit AgentRegistered(msg.sender);
    }

    /**
     * @dev Called by the off-chain CreditEvaluator (owner) after computing alpha score.
     *      Stores the EAS attestation UID, updates score, and auto-whitelists if threshold met.
     * @param agent       The agent address being scored.
     * @param score       Alpha score 0-1000.
     * @param easUID      The EAS attestation UID anchoring this score on-chain.
     */
    function updateCreditScore(
        address agent,
        uint256 score,
        string calldata easUID
    ) external onlyOwner {
        require(agents[agent].isRegistered, "Agent not registered");
        require(score <= 1000, "Score out of range");

        agents[agent].creditScore = score;
        agents[agent].easAttestationUID = easUID;
        agents[agent].lastUpdated = block.timestamp;

        emit CreditScoreUpdated(agent, score, easUID);

        // Auto-whitelist / de-whitelist based on threshold
        bool shouldWhitelist = score >= WHITELIST_THRESHOLD;
        if (agents[agent].isWhitelisted != shouldWhitelist) {
            agents[agent].isWhitelisted = shouldWhitelist;
            emit WhitelistStatusChanged(agent, shouldWhitelist);
        }

        // Mint or update Reputation NFT
        if (reputationNFT.agentTokenId(agent) == 0) {
            reputationNFT.mintReputation(agent, easUID);
        } else {
            reputationNFT.updateReputation(agent, easUID);
        }
    }

    /**
     * @dev Manual override — owner can force whitelist status regardless of score.
     */
    function setWhitelisted(address agent, bool status) external onlyOwner {
        require(agents[agent].isRegistered, "Agent not registered");
        agents[agent].isWhitelisted = status;
        emit WhitelistStatusChanged(agent, status);
    }

    function getAgent(address agent) external view returns (Agent memory) {
        return agents[agent];
    }

    function getRegisteredAgents() external view returns (address[] memory) {
        return registeredAgents;
    }

    function totalAgents() external view returns (uint256) {
        return registeredAgents.length;
    }
}
