// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./AgentRegistry.sol";

/**
 * @title AetherialVault
 * @dev The core liquidity pool for Aetherial.
 */
contract AetherialVault is ReentrancyGuard, Ownable {
    AgentRegistry public registry;
    IERC20 public asset; // e.g., USDC or X Layer native-wrapped token

    uint256 public totalLPBalance;
    mapping(address => uint256) public lpBalances;
    mapping(address => uint256) public activeAllocations;

    event Deposited(address indexed lp, uint256 amount);
    event Withdrawn(address indexed lp, uint256 amount);
    event LiquidityAllocated(address indexed agent, uint256 amount);
    event LiquiditySetted(address indexed agent, uint256 repayment, uint256 profit);

    constructor(address _registry, address _asset) Ownable(msg.sender) {
        registry = AgentRegistry(_registry);
        asset = IERC20(_asset);
    }

    /**
     * @dev LP deposit into the vault.
     */
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        asset.transferFrom(msg.sender, address(this), amount);
        lpBalances[msg.sender] += amount;
        totalLPBalance += amount;
        emit Deposited(msg.sender, amount);
    }

    /**
     * @dev LP withdraw from the vault.
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(lpBalances[msg.sender] >= amount, "Insufficient balance");
        lpBalances[msg.sender] -= amount;
        totalLPBalance -= amount;
        asset.transfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @dev Whitelisted agents can request liquidity for trades.
     */
    function requestLiquidity(uint256 amount) external nonReentrant {
        require(registry.getAgent(msg.sender).isWhitelisted, "Agent not whitelisted");
        require(amount <= totalLPBalance, "Insufficient vault liquidity");
        
        activeAllocations[msg.sender] += amount;
        totalLPBalance -= amount;
        asset.transfer(msg.sender, amount);
        
        emit LiquidityAllocated(msg.sender, amount);
    }

    /**
     * @dev Agent settles the trade, returning liquidity plus interest/fees.
     */
    function settleLiquidity(uint256 repaymentAmount) external nonReentrant {
        require(activeAllocations[msg.sender] > 0, "No active allocation");
        
        asset.transferFrom(msg.sender, address(this), repaymentAmount);
        
        uint256 originalAllocation = activeAllocations[msg.sender];
        uint256 profit = 0;
        
        if (repaymentAmount > originalAllocation) {
            profit = repaymentAmount - originalAllocation;
        }

        activeAllocations[msg.sender] = 0;
        totalLPBalance += repaymentAmount;

        emit LiquiditySetted(msg.sender, repaymentAmount, profit);
    }
}
