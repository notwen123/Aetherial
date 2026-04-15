// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./AgentRegistry.sol";

/**
 * @title AetherialVault
 * @dev The core liquidity pool for Aetherial Prime Broker.
 *
 *  Yield mechanics:
 *   - LPs deposit AUSD and receive a proportional share of the vault.
 *   - Profit splitting: 5% protocol, 10% agent, 85% LPs.
 *
 *  Slashing mechanics:
 *   - Proportional slashing: score_reduction = loss_pct * (2 + consecutiveLosses).
 *   - Recovery: Streak resets only if profit >= 5% of allocation.
 */
contract AetherialVault is ReentrancyGuard, AccessControl {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    AgentRegistry public registry;
    IERC20 public asset;

    // ── Config ──────────────────────────────────────────────────────────────
    uint256 public constant PROTOCOL_FEE_BPS = 500;   // 5%
    uint256 public constant AGENT_FEE_BPS    = 1000;  // 10%
    uint256 public constant BPS_DENOMINATOR  = 10000;
    
    /// Reset streak if profit >= 5% of allocation
    uint256 public constant MIN_PROFIT_BPS_TO_RESET = 500; 
    uint256 public constant MAX_ALLOCATION_BPS = 2000;

    // ── LP accounting ────────────────────────────────────────────────────────
    uint256 public totalShares;
    mapping(address => uint256) public lpShares;
    uint256 public accRewardPerShare;
    mapping(address => uint256) public rewardDebt;
    mapping(address => uint256) public pendingYield;

    // ── Agent accounting ─────────────────────────────────────────────────────
    uint256 public totalAllocated;
    mapping(address => uint256) public activeAllocations;
    mapping(address => uint256) public consecutiveLosses;

    // ── Treasury ─────────────────────────────────────────────────────────────
    address public treasury;
    uint256 public protocolFeeAccrued;

    // ── Events ───────────────────────────────────────────────────────────────
    event Deposited(address indexed lp, uint256 amount, uint256 shares);
    event Withdrawn(address indexed lp, uint256 amount, uint256 shares);
    event YieldClaimed(address indexed lp, uint256 amount);
    event LiquidityAllocated(address indexed agent, uint256 amount);
    event LiquiditySettled(address indexed agent, uint256 repayment, uint256 profit, uint256 loss);
    event ProtocolFeeWithdrawn(address indexed treasury, uint256 amount);

    constructor(
        address _registry,
        address _asset,
        address _treasury
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, msg.sender);
        
        registry = AgentRegistry(_registry);
        asset = IERC20(_asset);
        treasury = _treasury;
    }

    // ── Internal helpers ─────────────────────────────────────────────────────

    function totalAssets() public view returns (uint256) {
        return asset.balanceOf(address(this)) - protocolFeeAccrued + totalAllocated;
    }

    function _toShares(uint256 amount) internal view returns (uint256) {
        uint256 pool = totalAssets() - amount; // assets before this deposit
        if (totalShares == 0 || pool == 0) return amount;
        return (amount * totalShares) / pool;
    }

    function _toAssets(uint256 shares) internal view returns (uint256) {
        if (totalShares == 0) return 0;
        return (shares * totalAssets()) / totalShares;
    }

    function _harvest(address lp) internal {
        pendingYield[lp] = pendingYieldOf(lp);
        rewardDebt[lp] = (lpShares[lp] * accRewardPerShare) / 1e18;
    }

    function pendingYieldOf(address lp) public view returns (uint256) {
        uint256 earned = (lpShares[lp] * accRewardPerShare) / 1e18 - rewardDebt[lp];
        return pendingYield[lp] + earned;
    }

    // ── LP functions ─────────────────────────────────────────────────────────

    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        _harvest(msg.sender);

        asset.transferFrom(msg.sender, address(this), amount);
        uint256 shares = _toShares(amount);
        lpShares[msg.sender] += shares;
        totalShares += shares;
        
        rewardDebt[msg.sender] = (lpShares[msg.sender] * accRewardPerShare) / 1e18;
        emit Deposited(msg.sender, amount, shares);
    }

    function withdraw(uint256 shares) external nonReentrant {
        require(shares > 0 && lpShares[msg.sender] >= shares, "Invalid shares");
        _harvest(msg.sender);

        uint256 amount = (shares * totalAssets()) / totalShares;
        uint256 available = asset.balanceOf(address(this)) - protocolFeeAccrued;
        require(amount <= available, "Insufficient liquid assets");

        lpShares[msg.sender] -= shares;
        totalShares -= shares;
        
        rewardDebt[msg.sender] = (lpShares[msg.sender] * accRewardPerShare) / 1e18;
        asset.transfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount, shares);
    }

    function claimYield() external nonReentrant {
        _harvest(msg.sender);
        uint256 amount = pendingYield[msg.sender];
        require(amount > 0, "No yield to claim");
        pendingYield[msg.sender] = 0;
        asset.transfer(msg.sender, amount);
        emit YieldClaimed(msg.sender, amount);
    }

    // ── Agent functions ───────────────────────────────────────────────────────

    function requestLiquidity(uint256 amount) external nonReentrant {
        AgentRegistry.Agent memory agent = registry.getAgent(msg.sender);
        require(agent.isWhitelisted, "Agent not whitelisted");
        require(amount > 0, "Amount > 0");

        uint256 liquid = asset.balanceOf(address(this)) - protocolFeeAccrued;
        require(amount <= liquid, "Insufficient liquid assets");

        uint256 maxAlloc = (totalAssets() * MAX_ALLOCATION_BPS) / BPS_DENOMINATOR;
        require(activeAllocations[msg.sender] + amount <= maxAlloc, "Exceeds max allocation");

        activeAllocations[msg.sender] += amount;
        totalAllocated += amount;

        asset.transfer(msg.sender, amount);
        emit LiquidityAllocated(msg.sender, amount);
    }

    function settleLiquidity(uint256 repaymentAmount) external nonReentrant {
        uint256 allocation = activeAllocations[msg.sender];
        require(allocation > 0, "No active allocation");

        asset.transferFrom(msg.sender, address(this), repaymentAmount);
        activeAllocations[msg.sender] = 0;
        totalAllocated -= allocation;

        if (repaymentAmount >= allocation) {
            uint256 profit = repaymentAmount - allocation;
            
            // Handle Grace condition for Streak Reset
            uint256 profitBps = (profit * BPS_DENOMINATOR) / allocation;
            if (profitBps >= MIN_PROFIT_BPS_TO_RESET) {
                consecutiveLosses[msg.sender] = 0;
            }

            if (profit > 0 && totalShares > 0) {
                uint256 protocolFee = (profit * PROTOCOL_FEE_BPS) / BPS_DENOMINATOR;
                uint256 agentFee    = (profit * AGENT_FEE_BPS)    / BPS_DENOMINATOR;
                uint256 lpProfit    = profit - protocolFee - agentFee;

                protocolFeeAccrued += protocolFee;
                if (agentFee > 0) asset.transfer(msg.sender, agentFee);
                if (lpProfit > 0) accRewardPerShare += (lpProfit * 1e18) / totalShares;
            }
            emit LiquiditySettled(msg.sender, repaymentAmount, profit, 0);
        } else {
            uint256 loss = allocation - repaymentAmount;
            uint256 lossPct = (loss * 100) / allocation;
            uint256 slashPoints = lossPct * (2 + consecutiveLosses[msg.sender]);
            
            consecutiveLosses[msg.sender]++;
            registry.slashAgent(msg.sender, slashPoints);

            emit LiquiditySettled(msg.sender, repaymentAmount, 0, loss);
        }
    }

    // ── Admin functions ───────────────────────────────────────────────────────

    function withdrawProtocolFees() external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 amount = protocolFeeAccrued;
        require(amount > 0, "No fees");
        protocolFeeAccrued = 0;
        asset.transfer(treasury, amount);
        emit ProtocolFeeWithdrawn(treasury, amount);
    }

    function setTreasury(address _treasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_treasury != address(0), "Zero address");
        treasury = _treasury;
    }
}
