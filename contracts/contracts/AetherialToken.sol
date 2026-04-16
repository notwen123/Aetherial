// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AetherialToken (AUSD)
 * @dev The native stablecoin-pegged asset for the Aetherial protocol on X Layer Testnet.
 *      In production this would be replaced by real USDC. On testnet, the owner
 *      (deployer / faucet) can mint to bootstrap LP liquidity.
 */
contract AetherialToken is ERC20, Ownable {
    uint8 private immutable _decimals;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _decimals = decimals_;
    }

    mapping(address => uint256) public lastFaucetClaim;

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /// @notice Public testnet faucet — 100 AUSD every 24 hours
    function faucet() external {
        require(
            block.timestamp >= lastFaucetClaim[msg.sender] + 1 days,
            "Faucet: Wait 24 hours between claims"
        );
        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, 100 * 10**uint256(_decimals));
    }

    /// @notice Testnet faucet — owner mints to bootstrap liquidity
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
