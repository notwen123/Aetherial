// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./ReputationNFT.sol";

/**
 * @title AgentRegistry
 * @dev Manages agent identities, credit scores, and Reputation NFTs on Aetherial.
 *
 *  Flow:
 *   1. Agent calls registerAgent() → stored with score 0, not whitelisted.
 *   2. Manager calls updateCreditScore() with the real alpha score.
 *   3. If score >= WHITELIST_THRESHOLD the agent is auto-whitelisted.
 *   4. On first whitelist, a soulbound ReputationNFT is minted with the EAS UID.
 */
contract AgentRegistry is AccessControl {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    
    ReputationNFT public reputationNFT;

    /// Minimum credit score (0-1000) required for auto-whitelist
    uint256 public constant WHITELIST_THRESHOLD = 500;

    struct Agent {
        bool isRegistered;
        uint256 creditScore;   // 0-1000
        string easAttestationUID; 
        bool isWhitelisted;
        uint256 lastUpdated;
    }

    mapping(address => Agent) public agents;
    address[] public registeredAgents;

    event AgentRegistered(address indexed agent);
    event CreditScoreUpdated(address indexed agent, uint256 newScore, string easUID);
    event WhitelistStatusChanged(address indexed agent, bool status);
    event AgentSlashed(address indexed agent, uint256 slashPoints, uint256 newScore);

    constructor(address _reputationNFT) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, msg.sender);
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
     * @dev Called by the off-chain manager after computing alpha score.
     */
    function updateCreditScore(
        address agent,
        uint256 score,
        string calldata easUID
    ) external onlyRole(MANAGER_ROLE) {
        require(agents[agent].isRegistered, "Agent not registered");
        require(score <= 1000, "Score out of range");

        agents[agent].creditScore = score;
        agents[agent].easAttestationUID = easUID;
        agents[agent].lastUpdated = block.timestamp;

        emit CreditScoreUpdated(agent, score, easUID);

        _updateWhitelistAndNFT(agent, score, easUID);
    }

    /**
     * @dev Process protocol-level slashing for bad performance or losses.
     */
    function slashAgent(address agent, uint256 points) external onlyRole(MANAGER_ROLE) {
        require(agents[agent].isRegistered, "Agent not registered");
        
        if (points > agents[agent].creditScore) {
            agents[agent].creditScore = 0;
        } else {
            agents[agent].creditScore -= points;
        }
        
        emit AgentSlashed(agent, points, agents[agent].creditScore);
        
        _updateWhitelistAndNFT(agent, agents[agent].creditScore, agents[agent].easAttestationUID);
    }

    function _updateWhitelistAndNFT(address agent, uint256 score, string memory easUID) internal {
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
     * @dev Manual override — admin can force whitelist status regardless of score.
     */
    function setWhitelisted(address agent, bool status) external onlyRole(DEFAULT_ADMIN_ROLE) {
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
