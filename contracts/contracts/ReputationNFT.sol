// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ReputationNFT
 * @dev Soulbound ERC-721 that represents a verified agent's on-chain reputation.
 *      - One NFT per agent address (non-transferable after mint).
 *      - The AgentRegistry (owner) mints/updates the token URI when credit score changes.
 *      - tokenURI stores the EAS attestation UID so it is permanently auditable.
 */
contract ReputationNFT is ERC721, Ownable {
    uint256 private _nextTokenId;

    // agent address → token id
    mapping(address => uint256) public agentTokenId;
    // token id → metadata URI (EAS attestation UID encoded as URI)
    mapping(uint256 => string) private _tokenURIs;

    event ReputationMinted(address indexed agent, uint256 tokenId, string attestationUID);
    event ReputationUpdated(address indexed agent, uint256 tokenId, string newAttestationUID);

    constructor() ERC721("Aetherial Reputation", "AREP") Ownable(msg.sender) {}

    /**
     * @dev Mint a Reputation NFT for a new agent. Only callable by AgentRegistry (owner).
     */
    function mintReputation(address agent, string calldata attestationUID) external onlyOwner returns (uint256) {
        require(agentTokenId[agent] == 0, "Reputation already minted");

        _nextTokenId++;
        uint256 tokenId = _nextTokenId;

        _safeMint(agent, tokenId);
        _tokenURIs[tokenId] = attestationUID;
        agentTokenId[agent] = tokenId;

        emit ReputationMinted(agent, tokenId, attestationUID);
        return tokenId;
    }

    /**
     * @dev Update the attestation URI when credit score is refreshed.
     */
    function updateReputation(address agent, string calldata newAttestationUID) external onlyOwner {
        uint256 tokenId = agentTokenId[agent];
        require(tokenId != 0, "No reputation NFT found");
        _tokenURIs[tokenId] = newAttestationUID;
        emit ReputationUpdated(agent, tokenId, newAttestationUID);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _tokenURIs[tokenId];
    }

    /// @dev Soulbound: block all transfers except mint (from == address(0))
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        require(from == address(0), "Reputation NFT is soulbound");
        return super._update(to, tokenId, auth);
    }
}
